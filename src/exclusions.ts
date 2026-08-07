// Pure path-exclusion matching. No Obsidian imports here so this stays unit-testable.

/**
 * Normalizes a vault path for comparison: backslashes become slashes,
 * surrounding whitespace and leading/trailing slashes are removed, and the
 * result is lower-cased because matching is case-insensitive.
 */
function normalizePath(path: string): string {
	return path
		.trim()
		.replace(/\\/g, "/")
		.replace(/^\/+|\/+$/g, "")
		.toLowerCase();
}

/**
 * Returns true when filePath matches one of the excluded entries.
 * An entry matches if it equals the file path (file exclusion) or if the
 * file path lies underneath it (folder exclusion including subfolders).
 */
export function isPathExcluded(filePath: string, excludedPaths: string[]): boolean {
	const file = normalizePath(filePath);
	if (file.length === 0) return false;
	return excludedPaths.some((entry) => {
		const excluded = normalizePath(entry);
		if (excluded.length === 0) return false;
		return file === excluded || file.startsWith(excluded + "/");
	});
}
