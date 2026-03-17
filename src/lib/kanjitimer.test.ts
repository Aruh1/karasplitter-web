import { describe, it, expect } from "vitest";
import {
	parseSourceSyllables,
	segmentGraphemes,
	stripAssTags,
	createKanjiTimerState,
	increaseSourceMatch,
	decreaseSourceMatch,
	increaseDestinationMatch,
	decreaseDestinationMatch,
	acceptMatch,
	undoMatch,
	getOutputLine,
	getRemainingSource,
	getRemainingDestination,
	getSelectedSource,
	getSelectedDestination,
	isComplete,
	autoMatchOneToOne,
	acceptAllRemaining,
	autoMatchKaraoke,
	processKanjiTimerLine,
} from "./kanjitimer";

describe("kanjitimer", () => {
	describe("parseSourceSyllables", () => {
		it("should parse basic k-tags", () => {
			const result = parseSourceSyllables(
				"{\\k50}ka{\\k50}ra{\\k50}o{\\k50}ke",
			);
			expect(result).toHaveLength(4);
			expect(result[0]).toEqual({ duration: 500, text: "ka", tagType: "k" });
			expect(result[1]).toEqual({ duration: 500, text: "ra", tagType: "k" });
			expect(result[2]).toEqual({ duration: 500, text: "o", tagType: "k" });
			expect(result[3]).toEqual({ duration: 500, text: "ke", tagType: "k" });
		});

		it("should parse kf and ko tags", () => {
			const result = parseSourceSyllables("{\\kf100}fill{\\ko50}outline");
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				duration: 1000,
				text: "fill",
				tagType: "kf",
			});
			expect(result[1]).toEqual({
				duration: 500,
				text: "outline",
				tagType: "ko",
			});
		});

		it("should handle uppercase K tags", () => {
			const result = parseSourceSyllables("{\\K50}upper{\\Kf50}case");
			expect(result).toHaveLength(2);
			expect(result[0].tagType).toBe("k");
			expect(result[1].tagType).toBe("kf");
		});

		it("should handle empty syllables (timing-only tags)", () => {
			const result = parseSourceSyllables("{\\k0}{\\k50}text");
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ duration: 0, text: "", tagType: "k" });
			expect(result[1]).toEqual({ duration: 500, text: "text", tagType: "k" });
		});

		it("should return empty array for text without k-tags", () => {
			const result = parseSourceSyllables("no tags here");
			expect(result).toHaveLength(0);
		});
	});

	describe("segmentGraphemes", () => {
		it("should segment ASCII text", () => {
			const result = segmentGraphemes("abc");
			expect(result).toEqual(["a", "b", "c"]);
		});

		it("should segment Japanese kanji", () => {
			const result = segmentGraphemes("唐揚げ");
			expect(result).toEqual(["唐", "揚", "げ"]);
		});

		it("should segment mixed text", () => {
			const result = segmentGraphemes("あAい");
			expect(result).toEqual(["あ", "A", "い"]);
		});

		it("should handle empty string", () => {
			const result = segmentGraphemes("");
			expect(result).toEqual([]);
		});
	});

	describe("stripAssTags", () => {
		it("should remove k-tags", () => {
			const result = stripAssTags("{\\k50}ka{\\k50}ra");
			expect(result).toBe("kara");
		});

		it("should remove other override tags", () => {
			const result = stripAssTags("{\\b1}bold{\\i1}italic");
			expect(result).toBe("bolditalic");
		});

		it("should handle text without tags", () => {
			const result = stripAssTags("plain text");
			expect(result).toBe("plain text");
		});
	});

	describe("createKanjiTimerState", () => {
		it("should initialize state with source syllables and destination", () => {
			const state = createKanjiTimerState(
				"{\\k50}ka{\\k50}ra{\\k50}o{\\k50}ke",
				"カラオケ",
			);

			expect(state.unmatchedSource).toHaveLength(4);
			expect(state.destinationStr).toBe("カラオケ");
			expect(state.destinationChars).toEqual(["カ", "ラ", "オ", "ケ"]);
			expect(state.matchedGroups).toHaveLength(0);
			expect(state.sourceSelLength).toBe(1);
			expect(state.matchBegin).toBe(0);
			expect(state.matchEnd).toBe(1);
		});

		it("should handle empty source", () => {
			const state = createKanjiTimerState("", "destination");
			expect(state.unmatchedSource).toHaveLength(0);
			expect(state.sourceSelLength).toBe(0);
		});

		it("should handle empty destination", () => {
			const state = createKanjiTimerState("{\\k50}test", "");
			expect(state.destinationChars).toHaveLength(0);
			expect(state.matchEnd).toBe(0);
		});

		it("should strip tags from destination", () => {
			const state = createKanjiTimerState("{\\k50}src", "{\\pos(100,100)}dest");
			expect(state.destinationStr).toBe("dest");
		});
	});

	describe("selection operations", () => {
		it("increaseSourceMatch should expand selection", () => {
			const state = createKanjiTimerState("{\\k50}a{\\k50}b{\\k50}c", "ABC");
			expect(state.sourceSelLength).toBe(1);

			const state2 = increaseSourceMatch(state);
			expect(state2.sourceSelLength).toBe(2);

			const state3 = increaseSourceMatch(state2);
			expect(state3.sourceSelLength).toBe(3);

			// Should not exceed available syllables
			const state4 = increaseSourceMatch(state3);
			expect(state4.sourceSelLength).toBe(3);
		});

		it("decreaseSourceMatch should shrink selection", () => {
			let state = createKanjiTimerState("{\\k50}a{\\k50}b{\\k50}c", "ABC");
			state = increaseSourceMatch(state);
			state = increaseSourceMatch(state);
			expect(state.sourceSelLength).toBe(3);

			state = decreaseSourceMatch(state);
			expect(state.sourceSelLength).toBe(2);

			state = decreaseSourceMatch(state);
			expect(state.sourceSelLength).toBe(1);

			state = decreaseSourceMatch(state);
			expect(state.sourceSelLength).toBe(0);

			// Should not go below 0
			state = decreaseSourceMatch(state);
			expect(state.sourceSelLength).toBe(0);
		});

		it("increaseDestinationMatch should expand selection", () => {
			const state = createKanjiTimerState("{\\k50}a", "ABC");
			expect(state.matchEnd).toBe(1);

			const state2 = increaseDestinationMatch(state);
			expect(state2.matchEnd).toBe(2);

			const state3 = increaseDestinationMatch(state2);
			expect(state3.matchEnd).toBe(3);

			// Should not exceed available characters
			const state4 = increaseDestinationMatch(state3);
			expect(state4.matchEnd).toBe(3);
		});

		it("decreaseDestinationMatch should shrink selection", () => {
			let state = createKanjiTimerState("{\\k50}a", "ABC");
			state = increaseDestinationMatch(state);
			state = increaseDestinationMatch(state);
			expect(state.matchEnd).toBe(3);

			state = decreaseDestinationMatch(state);
			expect(state.matchEnd).toBe(2);

			state = decreaseDestinationMatch(state);
			expect(state.matchEnd).toBe(1);

			state = decreaseDestinationMatch(state);
			expect(state.matchEnd).toBe(0);

			// Should not go below matchBegin
			state = decreaseDestinationMatch(state);
			expect(state.matchEnd).toBe(0);
		});
	});

	describe("getSelectedSource / getSelectedDestination", () => {
		it("should return selected items", () => {
			let state = createKanjiTimerState("{\\k50}a{\\k50}b{\\k50}c", "XYZ");
			state = increaseSourceMatch(state);
			state = increaseDestinationMatch(state);

			const selectedSrc = getSelectedSource(state);
			expect(selectedSrc).toHaveLength(2);
			expect(selectedSrc[0].text).toBe("a");
			expect(selectedSrc[1].text).toBe("b");

			const selectedDst = getSelectedDestination(state);
			expect(selectedDst).toBe("XY");
		});
	});

	describe("acceptMatch", () => {
		it("should create match and advance selection", () => {
			const state = createKanjiTimerState("{\\k50}ka{\\k50}ra", "唐揚");

			const newState = acceptMatch(state);
			expect(newState).not.toBeNull();
			expect(newState!.matchedGroups).toHaveLength(1);
			expect(newState!.matchedGroups[0].src).toHaveLength(1);
			expect(newState!.matchedGroups[0].dst).toBe("唐");
			expect(newState!.unmatchedSource).toHaveLength(1);
			expect(newState!.sourceSelLength).toBe(1);
			expect(newState!.matchBegin).toBe(1);
			expect(newState!.matchEnd).toBe(2);
		});

		it("should reject empty match", () => {
			let state = createKanjiTimerState("{\\k50}a", "X");
			state = decreaseSourceMatch(state);
			state = decreaseDestinationMatch(state);

			const result = acceptMatch(state);
			expect(result).toBeNull();
		});

		it("should allow matching multiple syllables to one character", () => {
			let state = createKanjiTimerState(
				"{\\k50}ka{\\k50}ra{\\k50}a{\\k50}ge",
				"唐揚げ",
			);
			// Select 2 source syllables for 1 destination character
			state = increaseSourceMatch(state);
			expect(state.sourceSelLength).toBe(2);

			const newState = acceptMatch(state);
			expect(newState).not.toBeNull();
			expect(newState!.matchedGroups[0].src).toHaveLength(2);
			expect(newState!.matchedGroups[0].dst).toBe("唐");
		});

		it("should allow matching one syllable to multiple characters", () => {
			let state = createKanjiTimerState("{\\k100}word", "AB");
			state = increaseDestinationMatch(state);
			expect(state.matchEnd).toBe(2);

			const newState = acceptMatch(state);
			expect(newState).not.toBeNull();
			expect(newState!.matchedGroups[0].src).toHaveLength(1);
			expect(newState!.matchedGroups[0].dst).toBe("AB");
		});
	});

	describe("undoMatch", () => {
		it("should restore previous state", () => {
			let state = createKanjiTimerState("{\\k50}ka{\\k50}ra", "唐揚");

			// Accept first match
			state = acceptMatch(state)!;
			expect(state.matchedGroups).toHaveLength(1);
			expect(state.unmatchedSource).toHaveLength(1);

			// Undo
			const restored = undoMatch(state);
			expect(restored).not.toBeNull();
			expect(restored!.matchedGroups).toHaveLength(0);
			expect(restored!.unmatchedSource).toHaveLength(2);
			expect(restored!.sourceSelLength).toBe(1);
			expect(restored!.matchBegin).toBe(0);
			expect(restored!.matchEnd).toBe(1);
		});

		it("should return null when no matches to undo", () => {
			const state = createKanjiTimerState("{\\k50}a", "X");
			const result = undoMatch(state);
			expect(result).toBeNull();
		});
	});

	describe("getOutputLine", () => {
		it("should generate ASS line from matches", () => {
			let state = createKanjiTimerState(
				"{\\k50}ka{\\k50}ra{\\k50}o{\\k50}ke",
				"カラオケ",
			);

			// Match all 1:1
			state = acceptMatch(state)!;
			state = acceptMatch(state)!;
			state = acceptMatch(state)!;
			state = acceptMatch(state)!;

			const output = getOutputLine(state);
			// Original k-tags were \k50 (50 centiseconds = 500ms), output preserves centiseconds
			expect(output).toBe("{\\k50}カ{\\k50}ラ{\\k50}オ{\\k50}ケ");
		});

		it("should aggregate durations for multi-syllable matches", () => {
			let state = createKanjiTimerState("{\\k50}ka{\\k50}ra", "唐");

			// Match both syllables to one character
			state = increaseSourceMatch(state);
			state = acceptMatch(state)!;

			const output = getOutputLine(state);
			expect(output).toBe("{\\k100}唐"); // 500 + 500 = 1000ms = 100cs
		});

		it("should handle empty matches array", () => {
			const state = createKanjiTimerState("{\\k50}a", "X");
			const output = getOutputLine(state);
			expect(output).toBe("");
		});
	});

	describe("getRemainingSource / getRemainingDestination", () => {
		it("should count remaining items", () => {
			let state = createKanjiTimerState("{\\k50}a{\\k50}b{\\k50}c", "XYZ");

			expect(getRemainingSource(state)).toBe(3);
			expect(getRemainingDestination(state)).toBe(2); // 3 - 1 (matchEnd)

			state = acceptMatch(state)!;
			expect(getRemainingSource(state)).toBe(2);
			expect(getRemainingDestination(state)).toBe(1);
		});
	});

	describe("isComplete", () => {
		it("should return true when all matched", () => {
			let state = createKanjiTimerState("{\\k50}a{\\k50}b", "XY");

			state = acceptMatch(state)!;
			expect(isComplete(state)).toBe(false);

			state = acceptMatch(state)!;
			expect(isComplete(state)).toBe(true);
		});
	});

	describe("autoMatchOneToOne", () => {
		it("should auto-match when counts are equal", () => {
			const state = createKanjiTimerState("{\\k10}a{\\k20}b{\\k30}c", "XYZ");

			const result = autoMatchOneToOne(state);
			expect(result).not.toBeNull();
			expect(result!.matchedGroups).toHaveLength(3);
			expect(isComplete(result!)).toBe(true);
		});

		it("should return null when counts differ", () => {
			const state = createKanjiTimerState("{\\k10}a{\\k20}b", "XYZ");

			const result = autoMatchOneToOne(state);
			expect(result).toBeNull();
		});
	});

	describe("acceptAllRemaining", () => {
		it("should match all remaining as one group", () => {
			let state = createKanjiTimerState("{\\k10}a{\\k20}b{\\k30}c", "XYZ");

			// Accept first match
			state = acceptMatch(state)!;

			// Accept all remaining
			const result = acceptAllRemaining(state);
			expect(result).not.toBeNull();
			expect(result!.matchedGroups).toHaveLength(2);
			expect(result!.matchedGroups[1].src).toHaveLength(2); // b and c
			expect(result!.matchedGroups[1].dst).toBe("YZ");
			expect(isComplete(result!)).toBe(true);
		});

		it("should return null when no source remaining", () => {
			let state = createKanjiTimerState("{\\k10}a", "X");
			state = acceptMatch(state)!;

			const result = acceptAllRemaining(state);
			expect(result).toBeNull();
		});
	});

	describe("integration: complex kanji timing scenario", () => {
		it("should handle romaji to kanji timing transfer", () => {
			// Source: Romaji with timing from original karaoke
			// Destination: Japanese text to receive timing
			let state = createKanjiTimerState(
				"{\\k30}ka{\\k30}ra{\\k40}o{\\k30}ke",
				"カラオケ",
			);

			// 1:1 matching for this example
			state = acceptMatch(state)!; // ka -> カ
			state = acceptMatch(state)!; // ra -> ラ
			state = acceptMatch(state)!; // o -> オ
			state = acceptMatch(state)!; // ke -> ケ

			const output = getOutputLine(state);
			// 30cs (300ms), 30cs, 40cs, 30cs - preserved in output
			expect(output).toBe("{\\k30}カ{\\k30}ラ{\\k40}オ{\\k30}ケ");
		});

		it("should handle kanji with furigana-style matching", () => {
			// 唐揚げ (karaage) - 3 characters but 5 syllables
			let state = createKanjiTimerState(
				"{\\k20}ka{\\k20}ra{\\k20}a{\\k20}ge",
				"唐揚げ",
			);

			// 唐 (kara) - matches "ka" + "ra"
			state = increaseSourceMatch(state); // Select 2
			state = acceptMatch(state)!;

			// 揚 (a) - matches "a"
			state = acceptMatch(state)!;

			// げ (ge) - matches "ge"
			state = acceptMatch(state)!;

			const output = getOutputLine(state);
			// 唐: 20+20=40cs, 揚: 20cs, げ: 20cs
			expect(output).toBe("{\\k40}唐{\\k20}揚{\\k20}げ");
		});
	});

	describe("autoMatchKaraoke", () => {
		it("should match romaji syllable to corresponding hiragana", () => {
			// "ka" → "か"
			const result = autoMatchKaraoke(["ka"], "か");
			expect(result.sourceLength).toBe(1);
			expect(result.destinationLength).toBe(1);
		});

		it("should match romaji syllable to corresponding katakana", () => {
			// "ka" → "カ"
			const result = autoMatchKaraoke(["ka"], "カ");
			expect(result.sourceLength).toBe(1);
			expect(result.destinationLength).toBe(1);
		});

		it("should match digraph romaji spanning two kana grapheme clusters", () => {
			// "sha" → "シャ" (two separate grapheme clusters: シ + ャ)
			const result = autoMatchKaraoke(["sha"], "シャ");
			expect(result.sourceLength).toBe(1);
			expect(result.destinationLength).toBe(2);
		});

		it("should match a source syllable that covers multiple kana", () => {
			// "sou" covers "so"→"そ" then "u"→"う" before src is exhausted
			const result = autoMatchKaraoke(["sou", "a"], "そうあ");
			expect(result.sourceLength).toBe(1);
			expect(result.destinationLength).toBe(2); // "そ" + "う"
		});

		it("should handle empty source syllable (lead-in)", () => {
			// Empty syllable text → 0 dest chars consumed, 1 source syllable consumed
			const result = autoMatchKaraoke(["", "ka"], "カ");
			expect(result.sourceLength).toBe(1);
			expect(result.destinationLength).toBe(0);
		});

		it("should fall back to 1-char match for non-kana content", () => {
			const result = autoMatchKaraoke(["a", "b"], "XY");
			expect(result.sourceLength).toBe(1);
			expect(result.destinationLength).toBe(1);
		});

		it("should return empty result for empty source", () => {
			const result = autoMatchKaraoke([], "カラ");
			expect(result.sourceLength).toBe(0);
			expect(result.destinationLength).toBe(0);
		});

		it("should assign all source to last dest char when only one char remains", () => {
			// Only 1 dest char → all source syllables bind to it
			const result = autoMatchKaraoke(["no", "ko"], "の");
			expect(result.sourceLength).toBe(2);
			expect(result.destinationLength).toBe(1);
		});

		it("should use lookahead to split dest chars between source syllables", () => {
			// source: ["so", "ra"] — "ra" matches "ラ" via lookahead
			// dest: "ソラ" — "so" should get "ソ", "ra" should get "ラ"
			const result = autoMatchKaraoke(["so", "ra"], "ソラ");
			expect(result.sourceLength).toBe(1);
			expect(result.destinationLength).toBe(1); // "ソ" for "so"
		});
	});

	describe("processKanjiTimerLine (Aegisub auto-match)", () => {
		it("should perform 1:1 romaji-to-katakana matching", () => {
			const src = "{\\k30}ka{\\k30}ra{\\k40}o{\\k30}ke";
			const dst = "カラオケ";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\k30}カ{\\k30}ラ{\\k40}オ{\\k30}ケ");
		});

		it("should perform 1:1 romaji-to-hiragana matching", () => {
			const src = "{\\k20}na{\\k30}ni";
			const dst = "なに";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\k20}な{\\k30}に");
		});

		it("should match digraph romaji to paired kana graphemes", () => {
			// "sha" → "シャ" (シ + ャ = 2 grapheme clusters)
			const src = "{\\k40}sha";
			const dst = "シャ";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\k40}シャ");
		});

		it("should match a source syllable spanning multiple kana", () => {
			// "sou" covers "so"→"そ" then "u"→"う"
			const src = "{\\k49}sou{\\k17}a";
			const dst = "そうあ";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\k49}そう{\\k17}あ");
		});

		it("should handle empty lead-in tags correctly", () => {
			// Lead-in {\\k5} gets 0 dest chars; then 1:1 kana matching
			const src = "{\\k5}{\\k10}ka{\\k10}ra";
			const dst = "カラ";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\k5}{\\k10}カ{\\k10}ラ");
		});

		it("more tags than dest chars: remaining source syllables accumulate into last match", () => {
			// ka → カ (10cs), ra+o → ラ (20+30=50cs) because dest exhausted after "ラ"
			const src = "{\\k10}ka{\\k20}ra{\\k30}o";
			const dst = "カラ";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\k10}カ{\\k50}ラ");
		});

		it("should fall back to 1:1 for non-kana ASCII content", () => {
			// ASCII source and ASCII dest — no kana table match, falls back to 1:1
			const src = "{\\k10}a{\\k20}b";
			const dst = "XY";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\k10}X{\\k20}Y");
		});

		it("more dest chars than source syllables: trailing chars appended without tag", () => {
			// 2 syllables, 4 dest chars — first 2 match 1:1, remaining 2 appended raw
			const src = "{\\k10}a{\\k20}b";
			const dst = "WXYZ";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\k10}W{\\k20}XYZ");
		});

		it("should aggregate durations for multi-syllable kanji match", () => {
			// ka+ra → 唐 (40cs), a → 揚 (20cs), ge → げ (20cs)
			const src = "{\\k20}ka{\\k20}ra{\\k20}a{\\k20}ge";
			const dst = "唐揚げ";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\k40}唐{\\k20}揚{\\k20}げ");
		});

		it("should preserve kf and ko tag types in output", () => {
			const src = "{\\kf30}ka{\\ko30}ra";
			const dst = "カラ";
			const output = processKanjiTimerLine(src, dst);
			expect(output).toBe("{\\kf30}カ{\\ko30}ラ");
		});

		it("should return empty string when dest is empty", () => {
			const src = "{\\k10}ka";
			const output = processKanjiTimerLine(src, "");
			expect(output).toBe("");
		});
	});
});
