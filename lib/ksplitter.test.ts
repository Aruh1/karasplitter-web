import { describe, it, expect } from "vitest";
import {
	aegiTimeTOds,
	k_array_char,
	k_array_word,
	k_array_syl,
	processAssFile,
	arrTOk_str,
	extractActorsAndStyles,
} from "./ksplitter";

describe("ksplitter", () => {
	describe("aegiTimeTOds", () => {
		it("should convert 0:00:00.00 to 0", () => {
			expect(aegiTimeTOds("0:00:00.00")).toBe(0);
		});

		it("should convert 0:00:01.00 to 100", () => {
			expect(aegiTimeTOds("0:00:01.00")).toBe(100);
		});

		it("should convert 0:01:00.00 to 6000", () => {
			expect(aegiTimeTOds("0:01:00.00")).toBe(6000);
		});

		it("should convert 1:00:00.00 to 360000", () => {
			expect(aegiTimeTOds("1:00:00.00")).toBe(360000);
		});

		it("should handle milliseconds correctly", () => {
			expect(aegiTimeTOds("0:00:00.50")).toBe(50);
			expect(aegiTimeTOds("0:00:00.99")).toBe(99);
		});
	});

	describe("k_array_char", () => {
		it("should split simple text into characters", () => {
			expect(k_array_char("abc")).toEqual(["a", "b", "c"]);
		});

		it("should attach punctuation/spaces to previous character", () => {
			expect(k_array_char("a b")).toEqual(["a ", "b"]);
			expect(k_array_char("a!")).toEqual(["a!"]);
			expect(k_array_char("a! b?")).toEqual(["a! ", "b?"]);
		});
	});

	describe("k_array_word", () => {
		it("should split text into words with trailing space", () => {
			expect(k_array_word("hello world")).toEqual(["hello ", "world "]);
		});

		it("should handle multiple spaces", () => {
			expect(k_array_word("hello   world")).toEqual(["hello ", "world "]);
		});
	});

	describe("k_array_syl", () => {
		it("should split romaji by syllables", () => {
			expect(k_array_syl("karaoke")).toEqual(["ka", "ra", "o", "ke"]);
			expect(k_array_syl("watashi")).toEqual(["wa", "ta", "shi"]);
		});

		it("should handle special combinations", () => {
			expect(k_array_syl("sha")).toEqual(["sha"]);
			expect(k_array_syl("tsu")).toEqual(["tsu"]);
			expect(k_array_syl("chi")).toEqual(["chi"]);
		});

		it("should handle k bracket syntax", () => {
			// logic attaches {} to previous element if exists, else pushes it.
			expect(k_array_syl("{k}a")).toEqual(["{k}", "a"]);
			expect(k_array_syl("ka{k}ra")).toEqual(["ka{k}", "ra"]);
		});
	});

	describe("arrTOk_str", () => {
		it("should generate karaoke timing string from syllable array", () => {
			const syllables = ["ka", "ra", "o", "ke"];
			const timePerletter = 50;
			// Each syllable: timing = timePerletter * syllable.length
			// "ka" (2) -> {\k100}ka, "ra" (2) -> {\k100}ra, "o" (1) -> {\k50}o, "ke" (2) -> {\k100}ke
			const result = arrTOk_str(syllables, timePerletter);
			expect(result).toBe("{\\k100}ka{\\k100}ra{\\k50}o{\\k100}ke");
		});

		it("should handle empty array", () => {
			const result = arrTOk_str([], 50);
			expect(result).toBe("");
		});

		it("should handle single syllable", () => {
			const result = arrTOk_str(["a"], 100);
			expect(result).toBe("{\\k100}a");
		});

		it("should handle syllables with spaces attached", () => {
			const syllables = ["hello ", "world "];
			const timePerletter = 10;
			// "hello " (6) -> {\k60}hello , "world " (6) -> {\k60}world
			const result = arrTOk_str(syllables, timePerletter);
			expect(result).toBe("{\\k60}hello {\\k60}world ");
		});

		it("should handle zero time per letter", () => {
			const result = arrTOk_str(["ka", "ra"], 0);
			expect(result).toBe("{\\k0}ka{\\k0}ra");
		});
	});

	describe("extractActorsAndStyles", () => {
		it("should extract actors and styles from Dialogue lines", () => {
			const input =
				"Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1,0,0,0,,text";
			const result = extractActorsAndStyles(input);

			expect(result.actors).toEqual(["Singer1"]);
			expect(result.styles).toEqual(["Default"]);
		});

		it("should extract from Comment lines as well", () => {
			const input =
				"Comment: 0,0:00:00.00,0:00:05.00,Karaoke,Narrator,0,0,0,,text";
			const result = extractActorsAndStyles(input);

			expect(result.actors).toEqual(["Narrator"]);
			expect(result.styles).toEqual(["Karaoke"]);
		});

		it("should extract multiple unique actors and styles", () => {
			const input = `
				Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1,0,0,0,,line1
				Dialogue: 0,0:00:05.00,0:00:10.00,Karaoke,Singer2,0,0,0,,line2
				Dialogue: 0,0:00:10.00,0:00:15.00,Default,Singer1,0,0,0,,line3
				Comment: 0,0:00:15.00,0:00:20.00,Chorus,Backup,0,0,0,,line4
			`.trim();
			const result = extractActorsAndStyles(input);

			expect(result.actors).toEqual(["Backup", "Singer1", "Singer2"]);
			expect(result.styles).toEqual(["Chorus", "Default", "Karaoke"]);
		});

		it("should return sorted arrays", () => {
			const input = `
				Dialogue: 0,0:00:00.00,0:00:05.00,Zebra,Charlie,0,0,0,,text
				Dialogue: 0,0:00:05.00,0:00:10.00,Alpha,Bob,0,0,0,,text
				Dialogue: 0,0:00:10.00,0:00:15.00,Mike,Alice,0,0,0,,text
			`.trim();
			const result = extractActorsAndStyles(input);

			expect(result.actors).toEqual(["Alice", "Bob", "Charlie"]);
			expect(result.styles).toEqual(["Alpha", "Mike", "Zebra"]);
		});

		it("should return empty arrays for invalid content", () => {
			const result = extractActorsAndStyles(
				"Invalid content\nNo dialogue here",
			);

			expect(result.actors).toEqual([]);
			expect(result.styles).toEqual([]);
		});

		it("should handle empty actor or style fields", () => {
			const input = `
				Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,text
				Dialogue: 0,0:00:05.00,0:00:10.00,,Singer1,0,0,0,,text
			`.trim();
			const result = extractActorsAndStyles(input);

			expect(result.actors).toEqual(["Singer1"]);
			expect(result.styles).toEqual(["Default"]);
		});

		it("should handle lines with fewer than 10 comma-separated fields", () => {
			const input = `
				Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1
				Dialogue: 0,0:00:05.00,0:00:10.00,Karaoke,Singer2,0,0,0,,valid
			`.trim();
			const result = extractActorsAndStyles(input);

			// First line has only 5 fields, should be ignored
			expect(result.actors).toEqual(["Singer2"]);
			expect(result.styles).toEqual(["Karaoke"]);
		});
	});

	describe("processAssFile", () => {
		it("should return error for invalid input", () => {
			const result = processAssFile("Invalid content", {
				mode: "syl",
				selector: "all",
			});
			expect(result.error).toContain("No valid");
			expect(result.content).toBe("");
		});

		it("should process Dialogue lines", () => {
			const input = "Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,karaoke";
			const result = processAssFile(input, { mode: "syl", selector: "all" });

			expect(result.error).toBeNull();
			expect(result.content).toContain("Dialogue:");
			expect(result.content).toContain("{\\k");
		});

		it("should preserve Comment lines", () => {
			const input =
				"Comment: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,comment line";
			const result = processAssFile(input, { mode: "syl", selector: "all" });
			expect(result.error).toBeNull();
			expect(result.content).toBe(input);
		});

		it("should filter by actor", () => {
			const input = `
				Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1,0,0,0,,hello
				Dialogue: 0,0:00:05.00,0:00:10.00,Default,Singer2,0,0,0,,world
			`.trim();
			const result = processAssFile(input, {
				mode: "char",
				selector: "actor",
				selectorValue: "Singer1",
			});

			expect(result.error).toBeNull();
			// First line should be processed, second should be preserved as-is
			expect(result.content).toContain("{\\k");
		});

		it("should filter by style", () => {
			const input = `
				Dialogue: 0,0:00:00.00,0:00:05.00,Karaoke,Singer1,0,0,0,,hello
				Dialogue: 0,0:00:05.00,0:00:10.00,Default,Singer2,0,0,0,,world
			`.trim();
			const result = processAssFile(input, {
				mode: "char",
				selector: "style",
				selectorValue: "Karaoke",
			});

			expect(result.error).toBeNull();
			expect(result.content).toContain("{\\k");
		});

		it("should filter out invalid lines but process valid ones", () => {
			const input = `
				Invalid Line
				Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,valid
			`.trim();
			const result = processAssFile(input, { mode: "syl", selector: "all" });

			expect(result.error).toBeNull();
			expect(result.content).toContain("Dialogue:");
			expect(result.content).not.toContain("Invalid Line");
		});
	});
	describe("cleanKTime mode", () => {
		it("should remove all karaoke tags when cleanKTime is true", () => {
			const input =
				"Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1,0,0,0,,{\\k50}He{\\k50}llo";
			const result = processAssFile(input, {
				mode: "syl",
				selector: "all",
				cleanKTime: true,
			});

			expect(result.error).toBeNull();
			// Should retain the prefix but strip tags from text
			expect(result.content).toBe(
				"Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1,0,0,0,,Hello",
			);
		});

		it("should handle various tag formats", () => {
			const input =
				"Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1,0,0,0,,{\\K50}W{\\kf50}or{\\ko50}ld";
			const result = processAssFile(input, {
				mode: "syl",
				selector: "all",
				cleanKTime: true,
			});
			expect(result.content).toBe(
				"Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1,0,0,0,,World",
			);
		});

		it("should ignore splitting mode when cleanKTime is true", () => {
			const input =
				"Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1,0,0,0,,Hello World";
			// Even with 'char' mode, it should not split if cleanKTime is true
			const result = processAssFile(input, {
				mode: "char",
				selector: "all",
				cleanKTime: true,
			});
			expect(result.content).toBe(
				"Dialogue: 0,0:00:00.00,0:00:05.00,Default,Singer1,0,0,0,,Hello World",
			);
		});
	});
});
