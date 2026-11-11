import { describe, expect, it } from "vitest";
import { moveCompletedTasks, moveSelectedTasks } from "./mover";
import { MoveOptions } from "./types";

const OPTS: MoveOptions = {
	doneHeading: "Done",
	appendDate: true,
	today: "2026-05-15",
	taskFilter: "",
};

const SAMPLE = [
	"### To-DO",
	"- [x] Task 1",
	"\t- [x] Untertask1",
	"\t- [x] Untertask 2",
	"- [ ] Task 2",
	"- [ ] Task 3",
	"",
	"---",
	"",
	"### Done",
	"",
	"- [x] Erledigt 1",
].join("\n");

describe("moveCompletedTasks", () => {
	it("moves a fully completed task with its sub-tasks", () => {
		const result = moveCompletedTasks(SAMPLE, OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [x] Task 1 ✅ 2026-05-15");
		expect(result.text).toContain("\t- [x] Untertask1 ✅ 2026-05-15");
		// Task 1 now lives below the Done heading.
		expect(result.text.indexOf("Task 1")).toBeGreaterThan(
			result.text.indexOf("### Done")
		);
		// Unfinished tasks stay put.
		expect(result.text).toContain("- [ ] Task 2");
		expect(result.text.indexOf("Task 2")).toBeLessThan(
			result.text.indexOf("### Done")
		);
	});

	it("leaves a task with an unchecked sub-task in place", () => {
		const text = [
			"### To-DO",
			"- [x] Parent",
			"\t- [ ] Sub",
			"",
			"### Done",
		].join("\n");
		const result = moveCompletedTasks(text, OPTS);
		expect(result.movedCount).toBe(0);
		expect(result.text).toBe(text);
	});

	it("creates the Done section when it is missing", () => {
		const text = "### To-DO\n- [x] Done task\n";
		const result = moveCompletedTasks(text, OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("### Done");
		expect(result.text).toContain("- [x] Done task ✅ 2026-05-15");
	});

	it("creates a missing Done section with the configured Markdown heading level", () => {
		const text = "- [x] Done task";
		const result = moveCompletedTasks(text, { ...OPTS, doneHeading: "# 已完成" });
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("# 已完成");
		expect(result.text).not.toContain("### 已完成");
	});

	it("reuses an existing heading with the configured Markdown heading text", () => {
		const text = ["- [x] Done task", "", "### 已完成"].join("\n");
		const result = moveCompletedTasks(text, { ...OPTS, doneHeading: "# 已完成" });
		expect(result.movedCount).toBe(1);
		expect(result.text).not.toContain("\n# 已完成\n");
		expect(result.text).toContain("### 已完成\n\n- [x] Done task ✅ 2026-05-15");
	});

	it("leaves one blank line above the first task in an empty Done section", () => {
		const text = "- [x] Finished\n\n### Done\n\n### Journal\n";
		expect(moveCompletedTasks(text, { ...OPTS, appendDate: false }).text)
			.toBe("\n### Done\n\n- [x] Finished\n\n### Journal\n");
	});

	it("appends to an existing Done list without a gap between tasks", () => {
		const text = "- [x] Finished\n\n### Done\n\n- [x] Earlier\n";
		expect(moveCompletedTasks(text, { ...OPTS, appendDate: false }).text)
			.toBe("\n### Done\n\n- [x] Earlier\n- [x] Finished\n");
	});

	it("does not duplicate an existing completion date", () => {
		const text = ["### To-DO", "- [x] Old ✅ 2025-01-01", "", "### Done"].join(
			"\n"
		);
		const result = moveCompletedTasks(text, OPTS);
		expect(result.text).toContain("- [x] Old ✅ 2025-01-01");
		expect(result.text).not.toContain("2026-05-15");
	});

	it("does nothing when there is nothing completed", () => {
		const text = ["### To-DO", "- [ ] A", "- [ ] B", "", "### Done"].join("\n");
		const result = moveCompletedTasks(text, OPTS);
		expect(result.movedCount).toBe(0);
		expect(result.text).toBe(text);
	});

	it("moves a cancelled standalone task without appending a completion date", () => {
		const text = ["- [-] Cancelled", "", "### Done"].join("\n");
		const result = moveCompletedTasks(text, OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [-] Cancelled");
		expect(result.text).not.toContain("Cancelled ✅");
	});

	it("moves a parent with checked and cancelled sub-tasks", () => {
		const text = [
			"- [x] Parent",
			"  - [x] Finished child",
			"  - [-] Cancelled child",
			"",
			"### Done",
		].join("\n");
		const result = moveCompletedTasks(text, OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [-] Cancelled child");
		expect(result.text).not.toContain("Cancelled child ✅");
	});
});

describe("moveSelectedTasks", () => {
	it("moves the selected task regardless of its checkbox state", () => {
		const result = moveSelectedTasks(SAMPLE, {
			...OPTS,
			selection: { startLine: 4, endLine: 4 },
		});
		expect(result.movedCount).toBe(1);
		// Task 2 is unchecked, so it moves without a completion date.
		expect(result.text).toContain("- [ ] Task 2");
		expect(result.text.indexOf("Task 2")).toBeGreaterThan(
			result.text.indexOf("### Done")
		);
		expect(result.text).not.toContain("Task 2 ✅");
	});

	it("ignores tasks that are already inside the Done section", () => {
		const result = moveSelectedTasks(SAMPLE, {
			...OPTS,
			selection: { startLine: 11, endLine: 11 },
		});
		expect(result.movedCount).toBe(0);
	});
});

describe("task filter", () => {
	const FILTERED_OPTS: MoveOptions = { ...OPTS, taskFilter: "#task" };

	it("moves only checked un-nested tasks containing the filter", () => {
		const text = ["- [x] #task Move", "- [x] Leave", "", "### Done"].join("\n");
		const result = moveCompletedTasks(text, FILTERED_OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [x] #task Move ✅ 2026-05-15");
		expect(result.text).toContain("- [x] Leave");
	});

	it("moves a cancelled filtered task without appending a completion date", () => {
		const text = ["- [-] #task Cancelled", "", "### Done"].join("\n");
		const result = moveCompletedTasks(text, FILTERED_OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [-] #task Cancelled");
		expect(result.text).not.toContain("Cancelled ✅");
	});

	it("moves a filtered parent with unfiltered descendants when only the parent is checked", () => {
		const text = [
			"- [x] #task Parent",
			"  - [ ] Child",
			"  - note",
			"",
			"### Done",
		].join("\n");
		const result = moveCompletedTasks(text, FILTERED_OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [ ] Child");
		expect(result.text).toContain("  - note");
		expect(result.text.indexOf("#task Parent")).toBeGreaterThan(result.text.indexOf("### Done"));
	});

	it("requires every filtered descendant to be checked before moving a filtered parent", () => {
		const text = [
			"- [x] #task Parent",
			"  - [x] #task Done child",
			"  - [ ] #task Open child",
			"  - [ ] Unfiltered child",
			"",
			"### Done",
		].join("\n");
		expect(moveCompletedTasks(text, FILTERED_OPTS).movedCount).toBe(0);

		const completed = text.replace("[ ] #task Open child", "[x] #task Open child");
		const result = moveCompletedTasks(completed, FILTERED_OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("  - [ ] Unfiltered child");
	});

	it("moves a filtered parent when all of its filtered children are checked", () => {
		const text = [
			"- [x] #task Parent",
			"  - [x] #task Child 1",
			"  - [x] #task Child 2",
			"",
			"### Done",
		].join("\n");
		const result = moveCompletedTasks(text, FILTERED_OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [x] #task Parent ✅ 2026-05-15");
		expect(result.text).toContain("  - [x] #task Child 2 ✅ 2026-05-15");
	});

	it("moves a filtered child independently when its parent is not filtered", () => {
		const text = [
			"- [ ] Parent",
			"  - [x] #task Child",
			"    - note",
			"  - [ ] Sibling",
			"",
			"### Done",
		].join("\n");
		const result = moveCompletedTasks(text, FILTERED_OPTS);
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [ ] Parent");
		expect(result.text).toContain("  - [ ] Sibling");
		expect(result.text).toContain("- [x] #task Child ✅ 2026-05-15\n  - note");
	});

	it("applies the filter and completion rules to the selection command", () => {
		const text = ["- [x] #task Done", "- [ ] #task Open", "", "### Done"].join("\n");
		const result = moveSelectedTasks(text, {
			...FILTERED_OPTS,
			selection: { startLine: 0, endLine: 1 },
		});
		expect(result.movedCount).toBe(1);
		expect(result.text).toContain("- [ ] #task Open");
	});

	it("keeps the original unfiltered behavior", () => {
		const text = ["- [x] Parent", "  - [ ] Child", "", "### Done"].join("\n");
		expect(moveCompletedTasks(text, OPTS).movedCount).toBe(0);
		const result = moveSelectedTasks(text, {
			...OPTS,
			selection: { startLine: 0, endLine: 0 },
		});
		expect(result.movedCount).toBe(1);
	});
});
