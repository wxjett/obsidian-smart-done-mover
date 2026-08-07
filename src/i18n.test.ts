import { describe, expect, it } from "vitest";
import { getStrings } from "./i18n";

describe("getStrings", () => {
	it("returns Simplified Chinese text", () => {
		const strings = getStrings("zh-cn");
		expect(strings.cmdMoveCompleted).toBe("将已完成任务移至完成区");
		expect(strings.settingTaskFilterName).toBe("任务筛选");
		expect(strings.noticeMoved(2, "已完成")).toBe("已将 2 个任务移至“已完成”。");
	});
});
