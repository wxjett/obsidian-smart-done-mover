import { Editor, MarkdownView, Notice, Plugin, TFile, moment } from "obsidian";
import { DEFAULT_SETTINGS, DoneMoverSettings, MoveOptions, MoveResult } from "./src/types";
import { DoneMoverSettingTab } from "./src/settings";
import { moveCompletedTasks, moveSelectedTasks } from "./src/mover";
import { isPathExcluded } from "./src/exclusions";
import { Lang, Strings, getStrings } from "./src/i18n";

/** Delay before the auto mode reacts, so it does not interrupt typing. */
const AUTO_MOVE_DEBOUNCE_MS = 400;

/**
 * Detects the UI language from Obsidian's locale (via the bundled moment
 * instance, which Obsidian sets from the app language). Falls back to English.
 */
function detectLang(): Lang {
	const locale = (moment.locale() || "en").toLowerCase();
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
			if (editor && activeView?.file?.path === file.path && activeView.editor === editor) {
				const result = moveCompletedTasks(editor.getValue(), this.moveOptions());
				if (result.movedCount > 0) {
					this.applyResult(editor, result);
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
