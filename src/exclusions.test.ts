import { describe, expect, it } from "vitest";
import { isPathExcluded } from "./exclusions";

describe("isPathExcluded", () => {
	it("returns false for an empty exclusion list", () => {
		expect(isPathExcluded("Daily/Note.md", [])).toBe(false);
	});

	it("matches a file directly inside an excluded folder", () => {
		expect(isPathExcluded("Templates/Note.md", ["Templates"])).toBe(true);
	});

	it("matches files in subfolders of an excluded folder", () => {
		expect(isPathExcluded("Archiv/2025/Q1/Note.md", ["Archiv/2025"])).toBe(true);
	});

	it("matches an exact file entry", () => {
		expect(isPathExcluded("Daily/Scratch.md", ["Daily/Scratch.md"])).toBe(true);
	});

	it("does not match siblings of an excluded file", () => {
		expect(isPathExcluded("Daily/Other.md", ["Daily/Scratch.md"])).toBe(false);
	});

	it("does not treat folder entries as plain substring prefixes", () => {
		expect(isPathExcluded("Archiv-alt/Note.md", ["Archiv"])).toBe(false);
	});

	it("compares case-insensitively in both directions", () => {
		expect(isPathExcluded("templates/note.md", ["Templates"])).toBe(true);
		expect(isPathExcluded("Templates/Note.md", ["templates"])).toBe(true);
	});

	it("ignores empty and whitespace-only entries", () => {
		expect(isPathExcluded("Daily/Note.md", ["", "   "])).toBe(false);
	});

	it("returns false for an empty file path", () => {
		expect(isPathExcluded("", ["Templates"])).toBe(false);
	});

	it("normalizes slash variants of entries", () => {
		expect(isPathExcluded("Templates/Note.md", ["/Templates/"])).toBe(true);
		expect(isPathExcluded("Templates/Note.md", ["Templates\\"])).toBe(true);
	});
});
