// Pure task-moving logic — no Obsidian imports, fully unit-testable.

import { DEFAULT_SETTINGS, MoveOptions, MoveResult, TaskBlock } from "./types";
import {
	TASK_RE,
	blockEnd,
	doneInsertIndex,
	findDoneSection,
	isBlockFullyDone,
	parseDoneHeading,
	parseLines,
	splitLines,
	topLevelBlocks,
	type DoneSection,
} from "./taskParser";

/** Detects an already-present "✅ YYYY-MM-DD" completion date. */
const DATE_RE = /✅\s*\d{4}-\d{2}-\d{2}/;

/** Appends "✅ today" to checked checkbox lines that do not yet have a date. */
function appendDateToBlock(blockLines: string[], today: string): string[] {
	return blockLines.map((line) => {
		const m = line.match(TASK_RE);
		if (!m) return line;
		const checked = m[2] === "x" || m[2] === "X";
		if (!checked || DATE_RE.test(line)) return line;
		return line.replace(/\s*$/, "") + " ✅ " + today;
	});
}

/** Removes the first line's leading whitespace from every line of the block. */
function dedent(blockLines: string[]): string[] {
	const first = blockLines[0] ?? "";
	const rootIndent = (first.match(/^\s*/)?.[0] ?? "").length;
	if (rootIndent === 0) return blockLines.slice();
	return blockLines.map((line) => {
		let removed = 0;
		let k = 0;
		while (k < line.length && removed < rootIndent && /\s/.test(line[k])) {
			k++;
			removed++;
		}
		return line.slice(k);
	});
}

/** True when a block starts inside the Done section (and so must not be moved). */
function inDoneSection(
	block: TaskBlock,
	section: { headingIndex: number; contentEnd: number } | null
): boolean {
	return (
		section !== null &&
		block.start >= section.headingIndex &&
		block.start < section.contentEnd
	);
}

/** True when the task line contains the configured filter text. */
function matchesTaskFilter(line: string, taskFilter: string): boolean {
	return line.includes(taskFilter);
}

/** Finds the outermost task blocks that match the active filter. */
function taskBlocks(
	lines: string[],
	parsed: ReturnType<typeof parseLines>,
	taskFilter: string
): TaskBlock[] {
	if (!taskFilter) return topLevelBlocks(lines, parsed);
	const blocks: TaskBlock[] = [];
	for (let start = 0; start < lines.length; start++) {
		if (!parsed[start].isTask || !matchesTaskFilter(lines[start], taskFilter)) continue;
		const end = blockEnd(lines, start);
		blocks.push({ start, end });
		start = end;
	}
	return blocks;
}

function isTaskBlockEnded(
	parsed: ReturnType<typeof parseLines>,
	block: TaskBlock,
	taskFilter: string
): boolean {
	if (!taskFilter) return isBlockFullyDone(parsed, block);
	for (let i = block.start; i <= block.end; i++) {
		const line = parsed[i];
		if (line.isTask && matchesTaskFilter(line.raw, taskFilter) && !line.ended) return false;
	}
	return true;
}

export interface ReopenedTask extends TaskBlock {
	createdDate: string | undefined;
	lines: string[];
}

/** Finds task blocks in Done that no longer meet the archive conditions. */
export function findReopenedTasks(text: string, doneHeading: string, taskFilter: string): ReopenedTask[] {
	const { lines } = splitLines(text);
	const section = findDoneSection(lines, parseDoneHeading(doneHeading).name);
	if (!section) return [];

	const sectionLines = lines.slice(section.contentStart, section.contentEnd);
	const parsed = parseLines(sectionLines);
	return taskBlocks(sectionLines, parsed, taskFilter)
		.filter((block) => !isTaskBlockEnded(parsed, block, taskFilter))
		.map(({ start, end }) => ({
			start: start + section.contentStart,
			end: end + section.contentStart,
			createdDate: sectionLines[start].match(/➕\s*(\d{4}-\d{2}-\d{2})(?!\d)/)?.[1],
			lines: dedent(sectionLines.slice(start, end + 1)).map((line) => {
				// Keep dates on children that are still completed or cancelled.
				if (line.match(TASK_RE)?.[2] !== " ") return line;
				return line.replace(/\s+[✅❌]\s*\d{4}-\d{2}-\d{2}(?!\d)/g, "");
			}),
		}));
}

export function removeTaskBlocks(text: string, blocks: TaskBlock[]): string {
	const { lines, eol } = splitLines(text);
	for (const block of [...blocks].sort((a, b) => b.start - a.start)) {
		lines.splice(block.start, block.end - block.start + 1);
	}
	return lines.join(eol);
}

function sectionInsertion(lines: string[], section: DoneSection, taskLines: string[]) {
	const after = doneInsertIndex(lines, section);
	return {
		after,
		lines: after === section.headingIndex ? ["", ...taskLines] : taskLines,
	};
}

export function insertRestoredTasks(
	text: string,
	tasks: ReopenedTask[],
	doneHeading: string,
	restoreHeading: string
): string | null {
	const { lines, eol } = splitLines(text);
	const defaultHeading = parseDoneHeading(DEFAULT_SETTINGS.restoreHeading).name;
	const heading = parseDoneHeading(restoreHeading || DEFAULT_SETTINGS.restoreHeading).name;
	const section = findDoneSection(lines, heading) ??
		(heading === defaultHeading ? findDoneSection(lines, "新增待办") : null);
	const done = findDoneSection(lines, parseDoneHeading(doneHeading).name);
	if (!section || section.headingIndex === done?.headingIndex) return null;
	const insertion = sectionInsertion(lines, section, tasks.flatMap((task) => task.lines));
	lines.splice(insertion.after + 1, 0, ...insertion.lines);
	return lines.join(eol);
}

/**
 * Moves the given blocks into the Done section. Pure: takes document text,
 * returns new text. Blocks already inside the Done section must be filtered
 * out by the caller.
 */
function performMove(text: string, blocksToMove: TaskBlock[], opts: MoveOptions): MoveResult {
	if (blocksToMove.length === 0) return { text, movedCount: 0 };

	const { lines, eol } = splitLines(text);
	const blocks = [...blocksToMove].sort((a, b) => a.start - b.start);

	const movedSet = new Set<number>();
	for (const b of blocks) {
		for (let i = b.start; i <= b.end; i++) movedSet.add(i);
	}

	let movedLines: string[] = [];
	for (const b of blocks) {
		let blockLines = dedent(lines.slice(b.start, b.end + 1));
		if (opts.appendDate) blockLines = appendDateToBlock(blockLines, opts.today);
		movedLines = movedLines.concat(blockLines);
	}

	const doneHeading = parseDoneHeading(opts.doneHeading);
	const section = findDoneSection(lines, doneHeading.name);
	const result: string[] = [];

	if (section) {
		const insertion = sectionInsertion(lines, section, movedLines);
		for (let i = 0; i < lines.length; i++) {
			if (!movedSet.has(i)) result.push(lines[i]);
			if (i === insertion.after) result.push(...insertion.lines);
		}
	} else {
		for (let i = 0; i < lines.length; i++) {
			if (!movedSet.has(i)) result.push(lines[i]);
		}
		if (result.length > 0 && result[result.length - 1].trim() !== "") {
			result.push("");
		}
		result.push(doneHeading.line);
		result.push("");
		result.push(...movedLines);
	}

	return { text: result.join(eol), movedCount: blocks.length };
}

/** Moves every fully completed top-level task into the Done section. */
export function moveCompletedTasks(text: string, opts: MoveOptions): MoveResult {
	const { lines } = splitLines(text);
	const parsed = parseLines(lines);
	const section = findDoneSection(lines, parseDoneHeading(opts.doneHeading).name);
	const candidateBlocks = taskBlocks(lines, parsed, opts.taskFilter)
		.filter((block) => isTaskBlockEnded(parsed, block, opts.taskFilter));
	const blocks = candidateBlocks.filter(
		(b) => !inDoneSection(b, section)
	);
	return performMove(text, blocks, opts);
}

export interface SelectionRange {
	startLine: number;
	endLine: number;
}

/**
 * Moves task blocks touched by the selection into the Done section. With an
 * empty filter, this preserves the original top-level, checkbox-agnostic
 * behavior; with a filter, only eligible completed filtered roots move.
 */
export function moveSelectedTasks(
	text: string,
	opts: MoveOptions & { selection: SelectionRange }
): MoveResult {
	const { lines } = splitLines(text);
	const parsed = parseLines(lines);
	const section = findDoneSection(lines, parseDoneHeading(opts.doneHeading).name);
	const { startLine, endLine } = opts.selection;
	const candidateBlocks = taskBlocks(lines, parsed, opts.taskFilter)
		.filter((block) => !opts.taskFilter || isTaskBlockEnded(parsed, block, opts.taskFilter));
	const blocks = candidateBlocks.filter(
		(b) => !inDoneSection(b, section) && b.start <= endLine && b.end >= startLine
	);
	return performMove(text, blocks, opts);
}

// Re-exported so callers can build blocks without reaching into taskParser.
export { blockEnd };
