// UI string localization. English is the default; German and Simplified
// Chinese follow Obsidian's interface language.

export type Lang = "en" | "de" | "zh-cn";

export interface Strings {
	cmdMoveCompleted: string;
	cmdMoveSelection: string;
	noticeMoved: (count: number, heading: string) => string;
	noticeAutoMoved: (count: number) => string;
	noticeRestored: (count: number) => string;
	noticeRestoreFailed: (count: number) => string;
	noticeRestoreConflict: (path: string) => string;
	noticeNoCompleted: string;
	noticeNoSelection: string;
	settingAutoModeName: string;
	settingAutoModeDesc: string;
	settingHeadingName: string;
	settingHeadingDesc: string;
	settingRestoreHeadingName: string;
	settingRestoreHeadingDesc: string;
	settingDateName: string;
	settingDateDesc: string;
	settingTaskFilterName: string;
	settingTaskFilterDesc: string;
	settingExcludedName: string;
	settingExcludedDesc: string;
}

const en: Strings = {
	cmdMoveCompleted: "Move completed tasks to Done",
	cmdMoveSelection: "Move selection to Done",
	noticeMoved: (count, heading) => `Moved ${count} task(s) to "${heading}".`,
	noticeAutoMoved: (count) => `Automatically moved ${count} completed task(s).`,
	noticeRestored: (count) => `Restored ${count} task block(s) to their creation-date daily notes.`,
	noticeRestoreFailed: (count) => `Kept ${count} task block(s) in Done. Check their creation dates, daily notes, and destination headings.`,
	noticeRestoreConflict: (path) => `Check for duplicate tasks in "${path}". It changed before the restore could be rolled back.`,
	noticeNoCompleted: "No fully completed tasks found.",
	noticeNoSelection: "No tasks found in the selection.",
	settingAutoModeName: "Auto mode",
	settingAutoModeDesc:
		"Automatically archive completed or cancelled task blocks and restore reopened blocks to their creation-date daily notes.",
	settingHeadingName: "Done heading",
	settingHeadingDesc:
		"Name of the target heading. Enter a full Markdown heading (for example # Done) to choose its level; plain text creates a ### heading.",
	settingRestoreHeadingName: "Restore heading",
	settingRestoreHeadingDesc:
		"Existing heading in the creation-date daily note. Enter a name or a Markdown heading. The default also recognizes 新增待办.",
	settingDateName: "Append completion date",
	settingDateDesc: 'Appends "✅ YYYY-MM-DD" to every moved, checked line.',
	settingTaskFilterName: "Task filter",
	settingTaskFilterDesc:
		"Only move tasks containing this text (for example #task). Leave empty to move all tasks.",
	settingExcludedName: "Excluded folders/files",
	settingExcludedDesc:
		"One vault path per line. Auto mode stays inactive in these folders " +
		"(including subfolders) and files. Manual commands still work.",
};

const de: Strings = {
	cmdMoveCompleted: "Erledigte Aufgaben nach Done verschieben",
	cmdMoveSelection: "Auswahl nach Done verschieben",
	noticeMoved: (count, heading) => `${count} Aufgabe(n) nach „${heading}" verschoben.`,
	noticeAutoMoved: (count) => `${count} erledigte Aufgabe(n) automatisch verschoben.`,
	noticeRestored: (count) => `${count} Aufgabenblock/‑blöcke in die Tagesnotiz des Erstellungsdatums zurückverschoben.`,
	noticeRestoreFailed: (count) => `${count} Aufgabenblock/‑blöcke blieben im Erledigt-Abschnitt. Prüfe Erstellungsdatum, Tagesnotiz und Zielüberschrift.`,
	noticeRestoreConflict: (path) => `Prüfe „${path}“ auf doppelte Aufgaben. Die Notiz wurde vor dem Rückgängigmachen geändert.`,
	noticeNoCompleted: "Keine vollständig erledigten Aufgaben gefunden.",
	noticeNoSelection: "Keine Aufgaben in der Auswahl gefunden.",
	settingAutoModeName: "Auto-Modus",
	settingAutoModeDesc:
		"Erledigte oder abgebrochene Aufgabenblöcke automatisch archivieren und wieder geöffnete Blöcke in ihre Tagesnotizen zurückverschieben.",
	settingHeadingName: "Done-Überschrift",
	settingHeadingDesc:
		"Name der Ziel-Überschrift. Eine vollständige Markdown-Überschrift (zum Beispiel # Done) bestimmt ihre Ebene; Klartext erstellt eine ###-Überschrift.",
	settingRestoreHeadingName: "Überschrift zum Wiederherstellen",
	settingRestoreHeadingDesc:
		"Vorhandene Überschrift in der Tagesnotiz des Erstellungsdatums. Ein Name oder eine Markdown-Überschrift ist möglich. Die Vorgabe erkennt auch 新增待办.",
	settingDateName: "Erledigt-Datum anhängen",
	settingDateDesc: 'Hängt "✅ JJJJ-MM-TT" an jede verschobene, abgehakte Zeile an.',
	settingTaskFilterName: "Aufgabenfilter",
	settingTaskFilterDesc:
		"Nur Aufgaben verschieben, die diesen Text enthalten (zum Beispiel #task). Leer lassen, um alle Aufgaben zu verschieben.",
	settingExcludedName: "Ausgeschlossene Ordner/Dateien",
	settingExcludedDesc:
		"Ein Vault-Pfad pro Zeile. Der Auto-Modus bleibt in diesen Ordnern " +
		"(inklusive Unterordnern) und Dateien inaktiv. Manuelle Befehle funktionieren weiterhin.",
};

const zhCn: Strings = {
	cmdMoveCompleted: "将已完成任务移至完成区",
	cmdMoveSelection: "将选中任务移至完成区",
	noticeMoved: (count, heading) => `已将 ${count} 个任务移至“${heading}”。`,
	noticeAutoMoved: (count) => `已自动移动 ${count} 个已完成任务。`,
	noticeRestored: (count) => `已将 ${count} 个任务块移回创建日期对应的日记。`,
	noticeRestoreFailed: (count) => `${count} 个任务块仍留在完成区。请检查创建日期、目标日记和章节标题。`,
	noticeRestoreConflict: (path) => `“${path}”在回滚前发生了变化，请检查其中是否有重复任务。`,
	noticeNoCompleted: "未找到可移动的已完成任务。",
	noticeNoSelection: "选中内容中未找到任务。",
	settingAutoModeName: "自动模式",
	settingAutoModeDesc: "自动归档已完成或已取消的任务块，并按创建日期移回重新打开的任务块。",
	settingHeadingName: "完成区标题",
	settingHeadingDesc:
		"目标完成区的标题。输入完整 Markdown 标题（例如 # 已完成）可指定层级；输入普通文字则创建 ### 标题。",
	settingRestoreHeadingName: "恢复章节标题",
	settingRestoreHeadingDesc:
		"任务移回创建日期对应的日记时使用的现有章节。可填标题文字或完整 Markdown 标题。默认也识别旧标题“新增待办”。",
	settingDateName: "添加完成日期",
	settingDateDesc: "为每个已移动且已勾选的任务添加“✅ YYYY-MM-DD”。",
	settingTaskFilterName: "任务筛选",
	settingTaskFilterDesc:
		"只移动包含此文本的任务（例如 #task）。留空则移动所有任务。",
	settingExcludedName: "排除的文件夹/文件",
	settingExcludedDesc:
		"每行一个库内路径。自动模式不会在这些文件夹（包括子文件夹）和文件中运行；手动命令仍可使用。",
};

const LANGUAGES: Record<Lang, Strings> = { en, de, "zh-cn": zhCn };

/** Returns the UI strings for the given language. */
export function getStrings(lang: Lang): Strings {
	return LANGUAGES[lang];
}
