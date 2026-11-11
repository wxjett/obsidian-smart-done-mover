import { describe, expect, it } from "vitest";
import { findReopenedTasks, insertRestoredTasks } from "./mover";
import { DEFAULT_SETTINGS } from "./types";

const doneHeading = "# 已完成";
const archived = [
	doneHeading,
	"- [x] #task Parent ➕ 2026-08-31 ✅ 2026-09-01",
	"  - [ ] #task Child ➕ 2026-09-01 ✅ 2026-09-02",
	"    Note for child",
].join("\n");

describe("findReopenedTasks", () => {
	it("uses the outermost filtered parent's date and keeps the entire block", () => {
		expect(findReopenedTasks(archived, doneHeading, "#task")).toEqual([{
			start: 1, end: 3, createdDate: "2026-08-31",
			lines: [
				"- [x] #task Parent ➕ 2026-08-31 ✅ 2026-09-01",
				"  - [ ] #task Child ➕ 2026-09-01",
				"    Note for child",
			],
		}]);
	});

	it("treats an independently eligible child as its own block", () => {
		const text = archived.replace("#task Parent", "Parent");
		expect(findReopenedTasks(text, doneHeading, "#task")).toEqual([{
			start: 2, end: 3, createdDate: "2026-09-01",
			lines: ["- [ ] #task Child ➕ 2026-09-01", "  Note for child"],
		}]);
	});

	it("keeps cancelled and checked tasks archived and ignores unfiltered children", () => {
		const text = archived.replace("[x]", "[-]").replace("#task Child", "Child");
		expect(findReopenedTasks(text, doneHeading, "#task")).toEqual([]);
		expect(findReopenedTasks(text, doneHeading, "")).toHaveLength(1);
		expect(findReopenedTasks(archived.replace("[ ]", "[-]"), doneHeading, "#task")).toEqual([]);
	});

	it("reopens a cancelled task when its status becomes blank and ignores tasks outside Done", () => {
		const text = "# 待办\n- [ ] #task Outside ➕ 2026-08-31\n\n" + doneHeading +
			"\n- [-] #task Cancelled ➕ 2026-08-31 ❌ 2026-09-01";
		expect(findReopenedTasks(text, doneHeading, "#task")).toEqual([]);
		expect(findReopenedTasks(text.replace("[-]", "[ ]"), doneHeading, "#task")[0].lines)
			.toEqual(["- [ ] #task Cancelled ➕ 2026-08-31"]);
	});
});

describe("insertRestoredTasks", () => {
	const tasks = findReopenedTasks(archived, doneHeading, "#task");
	const restoredLines = tasks[0].lines.join("\n");

	it("leaves one blank line below an empty destination heading", () => {
		const target = "# 新增代办\n\n# 日记\n";
		expect(insertRestoredTasks(target, tasks, doneHeading, DEFAULT_SETTINGS.restoreHeading))
			.toBe("# 新增代办\n\n" + restoredLines + "\n\n# 日记\n");
	});

	it("appends directly to the existing destination list", () => {
		const target = "# 新增待办\n\n- [ ] Earlier\n";
		expect(insertRestoredTasks(target, tasks, doneHeading, DEFAULT_SETTINGS.restoreHeading))
			.toBe("# 新增待办\n\n- [ ] Earlier\n" + restoredLines + "\n");
	});

	it.each(["待办池", "## 待办池"])("matches the configured restore heading %s", (heading) => {
		const target = "# 新增代办\n\n## 待办池\n";
		expect(insertRestoredTasks(target, tasks, doneHeading, heading))
			.toBe(target + "\n" + restoredLines + "\n");
	});

	it("leaves the note untouched when the custom heading is missing or matches Done", () => {
		const target = "# 新增代办\n\n# 已完成\n";
		expect(insertRestoredTasks(target, tasks, doneHeading, "待办池")).toBeNull();
		expect(insertRestoredTasks(target, tasks, doneHeading, "## 已完成")).toBeNull();
	});
});
