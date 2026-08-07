// Shared types and defaults. No Obsidian imports here so this stays unit-testable.

export interface DoneMoverSettings {
	/** When on, fully completed tasks are moved automatically shortly after being checked. */
	autoMode: boolean;
	/** Name of the target heading the tasks are moved under (e.g. "Done"). */
	doneHeading: string;
	/** When on, a "✅ YYYY-MM-DD" completion date is appended to moved checked lines. */
	appendCompletionDate: boolean;
	/** Vault paths (folders or files) in which auto mode stays inactive. */
	excludedPaths: string[];
	/** Text a task must contain before it is eligible to move; empty disables filtering. */
	taskFilter: string;
}

export const DEFAULT_SETTINGS: DoneMoverSettings = {
	autoMode: false,
	doneHeading: "Done",
	appendCompletionDate: true,
	excludedPaths: [],
	taskFilter: "",
};

/** Options consumed by the pure mover functions. */
export interface MoveOptions {
	doneHeading: string;
	appendDate: boolean;
	/** Today's date as YYYY-MM-DD. Passed in so the logic stays deterministic/testable. */
	today: string;
	/** Text a task must contain before it is eligible to move; empty disables filtering. */
	taskFilter: string;
}

export interface MoveResult {
	/** The full document text after the move (unchanged if nothing moved). */
	text: string;
	/** Number of top-level task blocks that were moved. */
	movedCount: number;
}

/** A contiguous run of lines: a task line plus all of its indented sub-lines. */
export interface TaskBlock {
	/** Line index of the task line itself. */
	start: number;
	/** Line index of the last line belonging to the block (inclusive). */
	end: number;
}
