// UI string localization. English is the default; German and Simplified
// Chinese follow Obsidian's interface language.

export type Lang = "en" | "de" | "zh-cn";

export interface Strings {
	cmdMoveCompleted: string;
	cmdMoveSelection: string;
	noticeMoved: (count: number, heading: string) => string;
	noticeAutoMoved: (count: number) => string;
	noticeNoCompleted: string;
	noticeNoSelection: string;
	settingAutoModeName: string;
	settingAutoModeDesc: string;
	settingHeadingName: string;
	settingHeadingDesc: string;
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
	noticeNoCompleted: "No fully completed tasks found.",
	noticeNoSelection: "No tasks found in the selection.",
	settingAutoModeName: "Auto mode",
	settingAutoModeDesc:
		"Move fully completed tasks automatically as soon as they are checked " +
		"(only when all of their sub-tasks are checked too).",
	settingHeadingName: "Done heading",
	settingHeadingDesc:
		"Name of the target heading. Enter a full Markdown heading (for example # Done) to choose its level; plain text creates a ### heading.",
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
	noticeNoCompleted: "Keine vollständig erledigten Aufgaben gefunden.",
	noticeNoSelection: "Keine Aufgaben in der Auswahl gefunden.",
	settingAutoModeName: "Auto-Modus",
	settingAutoModeDesc:
		"Vollständig erledigte Aufgaben automatisch verschieben, sobald sie " +
		"abgehakt werden (nur wenn auch alle Unteraufgaben abgehakt sind).",
	settingHeadingName: "Done-Überschrift",
	settingHeadingDesc:
		"Name der Ziel-Überschrift. Eine vollständige Markdown-Überschrift (zum Beispiel # Done) bestimmt ihre Ebene; Klartext erstellt eine ###-Überschrift.",
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
	noticeNoCompleted: "未找到可移动的已完成任务。",
	noticeNoSelection: "选中内容中未找到任务。",
	settingAutoModeName: "自动模式",
	settingAutoModeDesc: "任务勾选后，自动移动符合条件的已完成任务。",
	settingHeadingName: "完成区标题",
	settingHeadingDesc:
		"目标完成区的标题。输入完整 Markdown 标题（例如 # 已完成）可指定层级；输入普通文字则创建 ### 标题。",
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
