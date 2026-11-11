import { Editor, MarkdownView, Notice, Plugin, TFile, getLanguage, moment, normalizePath } from "obsidian";
import { DEFAULT_SETTINGS, DoneMoverSettings, MoveOptions, MoveResult } from "./src/types";
import { DoneMoverSettingTab } from "./src/settings";
import {
	findReopenedTasks,
	insertRestoredTasks,
	moveCompletedTasks,
	moveSelectedTasks,
	removeTaskBlocks,
	type ReopenedTask,
} from "./src/mover";
import { isPathExcluded } from "./src/exclusions";
import { Lang, Strings, getStrings } from "./src/i18n";

/** Delay before the auto mode reacts, so it does not interrupt typing. */
const AUTO_MOVE_DEBOUNCE_MS = 400;

/** Uses the app language, with a fallback for Obsidian before 1.8.7. */
function detectLang(): Lang {
	const language = typeof getLanguage === "function" ? getLanguage() : moment.locale();
	const locale = (language || "en").toLowerCase();
	if (locale.startsWith("de")) return "de";
	if (locale.startsWith("zh")) return "zh-cn";
	return "en";
}

/** Returns today's local date as YYYY-MM-DD. */
function formatToday(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default class DoneMoverPlugin extends Plugin {
	settings!: DoneMoverSettings;
	/** Localized UI strings, resolved once at load time. */
	strings: Strings = getStrings(detectLang());
	private autoTimers = new Map<string, { timer: number; editor?: Editor }>();
	private autoMovingPaths = new Set<string>();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new DoneMoverSettingTab(this.app, this));

		this.addCommand({
			id: "move-completed-tasks",
			name: this.strings.cmdMoveCompleted,
			editorCallback: (editor) => this.runMoveCompleted(editor),
		});

		this.addCommand({
			id: "move-selected-tasks",
			name: this.strings.cmdMoveSelection,
			editorCallback: (editor) => this.runMoveSelection(editor),
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				menu.addItem((item) =>
					item
						.setTitle(this.strings.cmdMoveCompleted)
						.setIcon("check-check")
						.onClick(() => this.runMoveCompleted(editor))
				);
				if (editor.getSelection().length > 0) {
					menu.addItem((item) =>
						item
							.setTitle(this.strings.cmdMoveSelection)
							.setIcon("arrow-down-to-line")
							.onClick(() => this.runMoveSelection(editor))
					);
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-change", (editor, info) => {
				if (this.settings.autoMode && info.file) {
					this.scheduleAutoMove(info.file, editor);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (this.settings.autoMode && file instanceof TFile) {
					this.scheduleAutoMove(file);
				}
			})
		);
	}

	onunload() {
		for (const { timer } of this.autoTimers.values()) window.clearTimeout(timer);
		this.autoTimers.clear();
		this.autoMovingPaths.clear();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private moveOptions(): MoveOptions {
		return {
			doneHeading: this.settings.doneHeading,
			appendDate: this.settings.appendCompletionDate,
			today: formatToday(),
			taskFilter: this.settings.taskFilter,
		};
	}

	private runMoveCompleted(editor: Editor) {
		const result = moveCompletedTasks(editor.getValue(), this.moveOptions());
		this.applyResult(editor, result);
		new Notice(
			result.movedCount > 0
				? this.strings.noticeMoved(result.movedCount, this.settings.doneHeading)
				: this.strings.noticeNoCompleted
		);
	}

	private runMoveSelection(editor: Editor) {
		const startLine = editor.getCursor("from").line;
		const endLine = editor.getCursor("to").line;
		const result = moveSelectedTasks(editor.getValue(), {
			...this.moveOptions(),
			selection: { startLine, endLine },
		});
		this.applyResult(editor, result);
		new Notice(
			result.movedCount > 0
				? this.strings.noticeMoved(result.movedCount, this.settings.doneHeading)
				: this.strings.noticeNoSelection
		);
	}

	private scheduleAutoMove(file: TFile, editor?: Editor) {
		if (file.extension !== "md") return;
		const existing = this.autoTimers.get(file.path);
		if (existing) {
			// A direct editor event is the faster path for manual checkbox changes.
			if (!editor && existing.editor) return;
			window.clearTimeout(existing.timer);
		}

		const timer = window.setTimeout(() => {
			if (this.autoTimers.get(file.path)?.timer !== timer) return;
			this.autoTimers.delete(file.path);
			void this.runAutoMove(file, editor);
		}, AUTO_MOVE_DEBOUNCE_MS);
		this.autoTimers.set(file.path, { timer, editor });
	}

	private async runAutoMove(file: TFile, editor?: Editor) {
		if (
			!this.settings.autoMode ||
			isPathExcluded(file.path, this.settings.excludedPaths) ||
			this.autoMovingPaths.has(file.path)
		) {
			return;
		}

		this.autoMovingPaths.add(file.path);
		try {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			const sourceEditor = editor && activeView?.file?.path === file.path && activeView.editor === editor
				? editor
				: undefined;
			await this.restoreReopenedTasks(file, sourceEditor);
			if (sourceEditor && this.app.workspace.getActiveViewOfType(MarkdownView) === activeView && activeView?.file === file) {
				const result = moveCompletedTasks(sourceEditor.getValue(), this.moveOptions());
				if (result.movedCount > 0) {
					this.applyResult(sourceEditor, result);
					new Notice(this.strings.noticeAutoMoved(result.movedCount));
				}
				return;
			}

			const currentText = await this.app.vault.read(file);
			if (moveCompletedTasks(currentText, this.moveOptions()).movedCount === 0) return;

			let movedCount = 0;
			await this.app.vault.process(file, (text) => {
				const result = moveCompletedTasks(text, this.moveOptions());
				movedCount = result.movedCount;
				return result.text;
			});
			if (movedCount > 0) new Notice(this.strings.noticeAutoMoved(movedCount));
		} finally {
			this.autoMovingPaths.delete(file.path);
		}
	}

	private async restoreReopenedTasks(file: TFile, editor?: Editor): Promise<void> {
		const original = editor?.getValue() ?? await this.app.vault.read(file);
		const { doneHeading, restoreHeading, taskFilter } = this.settings;
		const tasks = findReopenedTasks(original, doneHeading, taskFilter);
		if (!tasks.length) return;

		const configPath = normalizePath(this.app.vault.configDir + "/daily-notes.json");
		const adapter = this.app.vault.adapter;
		let daily: { folder?: string; format?: string } = {};
		try {
			if (await adapter.exists(configPath)) {
				daily = JSON.parse(await adapter.read(configPath)) ?? {};
			}
		} catch {
			new Notice(this.strings.noticeRestoreFailed(tasks.length));
			return;
		}

		const byDestination = new Map<TFile, ReopenedTask[]>();
		for (const task of tasks) {
			if (!task.createdDate) continue;
			const date = moment(task.createdDate, "YYYY-MM-DD", true);
			if (!date.isValid()) continue;
			const path = normalizePath(
				[daily.folder, date.format(daily.format || "YYYY-MM-DD") + ".md"].filter(Boolean).join("/")
			);
			const target = this.app.vault.getAbstractFileByPath(path);
			if (!(target instanceof TFile) || isPathExcluded(target.path, this.settings.excludedPaths)) continue;
			const group = byDestination.get(target) ?? [];
			group.push(task);
			byDestination.set(target, group);
		}

		const moved: ReopenedTask[] = [];
		const written: { target: TFile; before: string; after: string }[] = [];
		for (const [target, group] of byDestination) {
			if (target === file) continue;
			try {
				const before = await this.app.vault.read(target);
				const after = insertRestoredTasks(before, group, doneHeading, restoreHeading);
				// Persist the destination before removing anything from the source.
				if (after === null || !await this.replaceIfCurrent(target, before, after)) continue;
				written.push({ target, before, after });
				moved.push(...group);
			} catch {
				// The source remains intact if writing this destination fails.
			}
		}

		const local = byDestination.get(file) ?? [];
		let updated = removeTaskBlocks(original, moved);
		if (local.length) {
			const withoutLocal = removeTaskBlocks(original, [...moved, ...local]);
			const restoredLocal = insertRestoredTasks(withoutLocal, local, doneHeading, restoreHeading);
			if (restoredLocal !== null) {
				updated = restoredLocal;
				moved.push(...local);
			}
		}
		let restored = 0;
		if (moved.length) {
			try {
				if (await this.replaceIfCurrent(file, original, updated, editor)) restored = moved.length;
			} catch {
				// A failed source write is handled like a concurrent source edit.
			}
		}
		if (!restored) {
			for (const copy of written) {
				try {
					if (await this.replaceIfCurrent(copy.target, copy.after, copy.before)) continue;
				} catch {
					// Preserve the destination if rollback cannot safely be applied.
				}
				new Notice(this.strings.noticeRestoreConflict(copy.target.path));
			}
		}
		if (restored) new Notice(this.strings.noticeRestored(restored));
		if (restored < tasks.length) new Notice(this.strings.noticeRestoreFailed(tasks.length - restored));
	}

	/** Avoid overwriting edits made after taking the snapshot. */
	private async replaceIfCurrent(file: TFile, before: string, after: string, editor?: Editor): Promise<boolean> {
		if (editor) {
			const stillOpen = this.app.workspace.getLeavesOfType("markdown").some(({ view }) =>
				view instanceof MarkdownView && view.file === file && view.editor === editor
			);
			if (!stillOpen || editor.getValue() !== before) return false;
			this.applyResult(editor, { text: after, movedCount: 1 });
			return true;
		}
		let replaced = false;
		await this.app.vault.process(file, (text) => {
			if (text !== before) return text;
			const hasUnsavedEdits = this.app.workspace.getLeavesOfType("markdown").some(({ view }) =>
				view instanceof MarkdownView && view.file === file && view.editor.getValue() !== before
			);
			if (hasUnsavedEdits) return text;
			replaced = true;
			return after;
		});
		return replaced;
	}

	/** Writes the new text back and keeps the cursor at a sensible position. */
	private applyResult(editor: Editor, result: MoveResult) {
		if (result.movedCount === 0) return;
		const cursor = editor.getCursor();
		editor.setValue(result.text);
		const line = Math.min(cursor.line, editor.lastLine());
		const ch = Math.min(cursor.ch, editor.getLine(line).length);
		editor.setCursor({ line, ch });
	}
}
