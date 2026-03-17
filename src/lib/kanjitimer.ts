/**
 * Kanji Timer API - TypeScript port of Aegisub's KaraokeLineMatchDisplay
 *
 * Functional API for linking source karaoke syllables to destination text,
 * aggregating durations, and reconstructing ASS karaoke lines.
 *
 * Based on:
 *  - https://github.com/arch1t3cht/Aegisub/blob/feature/src/dialog_kara_timing_copy.cpp
 *  - https://github.com/arch1t3cht/Aegisub/blob/feature/libaegisub/common/karaoke_matcher.cpp
 */

import { KANA_TABLE } from "./kana-table";

// ============================================================================
// Types
// ============================================================================

/** Parsed syllable from source ASS karaoke line */
export interface SourceSyllable {
	/** Duration in milliseconds */
	duration: number;
	/** Syllable text (stripped of k-tags) */
	text: string;
	/** Tag type: 'k', 'kf', or 'ko' */
	tagType: string;
}

/** A matched group linking source syllables to destination text */
export interface MatchGroup {
	/** Source syllables included in this match */
	src: SourceSyllable[];
	/** Destination text for this match */
	dst: string;
}

/** Complete Kanji Timer state (immutable) */
export interface KanjiTimerState {
	/** Completed matches */
	matchedGroups: MatchGroup[];
	/** Remaining unmatched source syllables (deque-like, front is next to match) */
	unmatchedSource: SourceSyllable[];
	/** Full destination string (stripped text) */
	destinationStr: string;
	/** Destination split into grapheme clusters (characters) */
	destinationChars: string[];
	/** Number of source syllables currently selected (starting from front) */
	sourceSelLength: number;
	/** Start index in destinationChars for current selection */
	matchBegin: number;
	/** End index in destinationChars for current selection (exclusive) */
	matchEnd: number;
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Regex to match ASS karaoke tags with their durations and following text.
 * Captures: [1] tag type (k, kf, ko, K, Kf, Ko), [2] duration, [3] text until next tag
 */
const K_TAG_REGEX = /\{\\([kK][fo]?)(\d+)\}([^{]*)/g;

/**
 * Parse an ASS karaoke line into source syllables.
 *
 * @param text - ASS dialogue text with karaoke tags (e.g., "{\\k50}ka{\\k50}ra")
 * @returns Array of parsed syllables with duration, text, and tag type
 */
export function parseSourceSyllables(text: string): SourceSyllable[] {
	const syllables: SourceSyllable[] = [];
	let match: RegExpExecArray | null;

	// Reset regex state
	K_TAG_REGEX.lastIndex = 0;

	while ((match = K_TAG_REGEX.exec(text)) !== null) {
		const tagType = match[1].toLowerCase();
		const durationCs = parseInt(match[2], 10); // Duration in centiseconds
		const syllableText = match[3];

		syllables.push({
			duration: durationCs * 10, // Convert centiseconds to milliseconds
			text: syllableText,
			tagType: tagType,
		});
	}

	return syllables;
}

/**
 * Segment a string into grapheme clusters (Unicode-aware character splitting).
 * Handles Japanese kanji, hiragana, katakana, and combined characters properly.
 *
 * @param text - Text to segment
 * @returns Array of grapheme clusters
 */
export function segmentGraphemes(text: string): string[] {
	// Use Intl.Segmenter for proper Unicode grapheme boundaries
	if (typeof Intl !== "undefined" && Intl.Segmenter) {
		const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
		return [...segmenter.segment(text)].map((s) => s.segment);
	}
	// Fallback: simple spread (may not handle all Unicode correctly)
	return [...text];
}

/**
 * Strip ASS override tags from text, returning plain text.
 *
 * @param text - ASS text with possible override tags
 * @returns Plain text without tags
 */
export function stripAssTags(text: string): string {
	return text.replace(/\{[^}]*\}/g, "");
}

// ============================================================================
// State Management (Manual Matching API)
// ============================================================================

/**
 * Create initial Kanji Timer state from source and destination lines.
 */
export function createKanjiTimerState(
	sourceText: string,
	destinationText: string,
): KanjiTimerState {
	const unmatchedSource = parseSourceSyllables(sourceText);
	const destinationStr = stripAssTags(destinationText);
	const destinationChars = segmentGraphemes(destinationStr);

	return {
		matchedGroups: [],
		unmatchedSource,
		destinationStr,
		destinationChars,
		// Initial selection: 1 source syllable, 1 destination character (if available)
		sourceSelLength: unmatchedSource.length > 0 ? 1 : 0,
		matchBegin: 0,
		matchEnd: destinationChars.length > 0 ? 1 : 0,
	};
}

/**
 * Get the number of remaining unmatched source syllables.
 */
export function getRemainingSource(state: KanjiTimerState): number {
	return state.unmatchedSource.length;
}

/**
 * Get the number of remaining unmatched destination characters.
 */
export function getRemainingDestination(state: KanjiTimerState): number {
	return state.destinationChars.length - state.matchEnd;
}

/**
 * Get the currently selected source syllables.
 */
export function getSelectedSource(state: KanjiTimerState): SourceSyllable[] {
	return state.unmatchedSource.slice(0, state.sourceSelLength);
}

/**
 * Get the currently selected destination text.
 */
export function getSelectedDestination(state: KanjiTimerState): string {
	return state.destinationChars
		.slice(state.matchBegin, state.matchEnd)
		.join("");
}

/**
 * Increase source selection length by 1.
 */
export function increaseSourceMatch(state: KanjiTimerState): KanjiTimerState {
	const newSelLength = Math.min(
		state.sourceSelLength + 1,
		state.unmatchedSource.length,
	);
	return {
		...state,
		sourceSelLength: newSelLength,
	};
}

/**
 * Decrease source selection length by 1 (minimum 0).
 */
export function decreaseSourceMatch(state: KanjiTimerState): KanjiTimerState {
	const newSelLength = Math.max(state.sourceSelLength - 1, 0);
	return {
		...state,
		sourceSelLength: newSelLength,
	};
}

/**
 * Increase destination selection length by 1.
 */
export function increaseDestinationMatch(
	state: KanjiTimerState,
): KanjiTimerState {
	if (state.matchEnd < state.destinationChars.length) {
		return {
			...state,
			matchEnd: state.matchEnd + 1,
		};
	}
	return state;
}

/**
 * Decrease destination selection length by 1.
 */
export function decreaseDestinationMatch(
	state: KanjiTimerState,
): KanjiTimerState {
	if (state.matchEnd > state.matchBegin) {
		return {
			...state,
			matchEnd: state.matchEnd - 1,
		};
	}
	return state;
}

/**
 * Accept the current match, linking selected source syllables to destination text.
 */
export function acceptMatch(state: KanjiTimerState): KanjiTimerState | null {
	// Completely empty match - reject
	if (state.sourceSelLength === 0 && state.matchBegin === state.matchEnd) {
		return null;
	}

	// Create new match group
	const matchSrc = state.unmatchedSource.slice(0, state.sourceSelLength);
	const matchDst = state.destinationChars
		.slice(state.matchBegin, state.matchEnd)
		.join("");

	const newMatch: MatchGroup = {
		src: matchSrc,
		dst: matchDst,
	};

	// Remove matched syllables from unmatched source
	const newUnmatchedSource = state.unmatchedSource.slice(state.sourceSelLength);

	// Move match begin to match end
	const newMatchBegin = state.matchEnd;

	// Calculate new selections (auto-advance by 1 if possible)
	const newSourceSelLength = newUnmatchedSource.length > 0 ? 1 : 0;
	const newMatchEnd =
		newMatchBegin < state.destinationChars.length
			? newMatchBegin + 1
			: newMatchBegin;

	return {
		...state,
		matchedGroups: [...state.matchedGroups, newMatch],
		unmatchedSource: newUnmatchedSource,
		sourceSelLength: newSourceSelLength,
		matchBegin: newMatchBegin,
		matchEnd: newMatchEnd,
	};
}

/**
 * Undo the last match, restoring syllables and destination selection.
 */
export function undoMatch(state: KanjiTimerState): KanjiTimerState | null {
	if (state.matchedGroups.length === 0) {
		return null;
	}

	// Get the last match
	const lastMatch = state.matchedGroups[state.matchedGroups.length - 1];

	// Restore source syllables to front of unmatched
	const newUnmatchedSource = [...lastMatch.src, ...state.unmatchedSource];

	// Restore destination selection
	const dstLength = segmentGraphemes(lastMatch.dst).length;
	const newMatchBegin = state.matchBegin - dstLength;
	const newMatchEnd = state.matchBegin;

	return {
		...state,
		matchedGroups: state.matchedGroups.slice(0, -1),
		unmatchedSource: newUnmatchedSource,
		sourceSelLength: lastMatch.src.length,
		matchBegin: newMatchBegin,
		matchEnd: newMatchEnd,
	};
}

/**
 * Generate the final ASS karaoke line from completed matches.
 */
export function getOutputLine(state: KanjiTimerState): string {
	let result = "";

	for (const match of state.matchedGroups) {
		// Sum durations from all source syllables in this match
		let duration = 0;
		for (const syl of match.src) {
			duration += syl.duration;
		}

		// Convert milliseconds to centiseconds for k-tag value
		const kValue = Math.round(duration / 10);

		result += `{\\k${kValue}}${match.dst}`;
	}

	return result;
}

/**
 * Check if all source syllables have been matched.
 */
export function isSourceComplete(state: KanjiTimerState): boolean {
	return state.unmatchedSource.length === 0;
}

/**
 * Check if the Kanji Timer matching is complete.
 */
export function isComplete(state: KanjiTimerState): boolean {
	return (
		isSourceComplete(state) &&
		isDestinationComplete(state) &&
		state.matchBegin >= state.destinationChars.length
	);
}

/**
 * Check if all destination characters have been matched.
 */
export function isDestinationComplete(state: KanjiTimerState): boolean {
	return state.matchBegin >= state.destinationChars.length;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Auto-accept all remaining matches with 1:1 mapping.
 */
export function autoMatchOneToOne(
	state: KanjiTimerState,
): KanjiTimerState | null {
	if (
		state.unmatchedSource.length !==
		getRemainingDestination(state) + (state.matchEnd - state.matchBegin)
	) {
		return null;
	}

	let currentState = state;

	while (currentState.unmatchedSource.length > 0) {
		// Set selection to 1:1
		currentState = {
			...currentState,
			sourceSelLength: 1,
			matchEnd: currentState.matchBegin + 1,
		};

		const nextState = acceptMatch(currentState);
		if (!nextState) break;
		currentState = nextState;
	}

	return currentState;
}

/**
 * Batch link: Accept all remaining source syllables to all remaining destination text.
 */
export function acceptAllRemaining(
	state: KanjiTimerState,
): KanjiTimerState | null {
	if (state.unmatchedSource.length === 0) {
		return null;
	}

	// Select all remaining source
	const allSourceState = {
		...state,
		sourceSelLength: state.unmatchedSource.length,
		matchEnd: state.destinationChars.length,
	};

	return acceptMatch(allSourceState);
}

// ============================================================================
// Kana/Romaji Auto-Match Helpers (Internal)
// ============================================================================

/**
 * Result of the auto-match algorithm for one step.
 * Mirrors Aegisub's `karaoke_match_result`.
 */
interface KaraokeMatchResult {
	/** Number of source syllables to consume in this match */
	sourceLength: number;
	/** Number of destination grapheme clusters to consume in this match */
	destinationLength: number;
}

/**
 * Try to match the start of `src` (romaji) to consecutive entries in `destChars`
 * starting at `dstIdx` using the kana-romaji lookup table.
 *
 * Returns `{romajiLength, kanaLength}` if a match is found, otherwise `null`.
 * Digraph entries (e.g. "きゃ") are listed first in KANA_TABLE and therefore
 * tried before their constituent singles, producing the longest match.
 */
function tryKanaMatch(
	src: string,
	destChars: string[],
	dstIdx: number,
): { romajiLength: number; kanaLength: number } | null {
	const lsrc = src.toLowerCase();
	for (const pair of KANA_TABLE) {
		if (!lsrc.startsWith(pair.romaji)) continue;
		// Check that each codepoint of the kana matches consecutive dest chars
		const kanaChars = [...pair.kana]; // split on codepoints (all kana are BMP)
		let matches = true;
		for (let i = 0; i < kanaChars.length; i++) {
			if (
				dstIdx + i >= destChars.length ||
				destChars[dstIdx + i] !== kanaChars[i]
			) {
				matches = false;
				break;
			}
		}
		if (matches) {
			return {
				romajiLength: pair.romaji.length,
				kanaLength: kanaChars.length,
			};
		}
	}
	return null;
}

/**
 * Return all romaji readings for `kana` (a string of 1–2 kana codepoints).
 * Used by the lookahead section of `autoMatchKaraoke`.
 */
function getKanaRomajiReadings(kana: string): string[] {
	const results: string[] = [];
	for (const pair of KANA_TABLE) {
		if (pair.kana === kana) {
			results.push(pair.romaji);
		}
	}
	return results;
}

/**
 * Aegisub-compatible auto-match algorithm.
 *
 * Ported from `agi::auto_match_karaoke` in karaoke_matcher.cpp.
 *
 * Given the remaining unmatched source syllable texts and the remaining
 * destination string, returns how many source syllables and destination
 * grapheme clusters should be consumed for the **current** match group.
 *
 * @param sourceStrings - Texts of remaining unmatched source syllables
 * @param destString    - Remaining destination string (from current position)
 * @returns Match result with sourceLength ≥ 1 and destinationLength ≥ 0
 */
export function autoMatchKaraoke(
	sourceStrings: string[],
	destString: string,
): KaraokeMatchResult {
	const result: KaraokeMatchResult = { sourceLength: 0, destinationLength: 0 };
	if (sourceStrings.length === 0) return result;

	result.sourceLength = 1;
	const destChars = segmentGraphemes(destString);
	if (destChars.length === 0) return result;

	// Working copy of the first source syllable (lowercased for matching)
	let src = sourceStrings[0].toLowerCase();
	let dstIdx = 0;

	/**
	 * Strip leading whitespace from src and advance dstIdx past any whitespace
	 * characters in dest.  Returns true when we should stop iterating (either
	 * src was exhausted or dest ran out).
	 */
	const eatWhitespace = (): boolean => {
		src = src.trimStart();
		while (dstIdx < destChars.length && /^\s$/.test(destChars[dstIdx])) {
			dstIdx++;
			result.destinationLength++;
		}
		if (dstIdx >= destChars.length) {
			// Ran out of dest — bind all remaining source to this match
			result.sourceLength = sourceStrings.length;
			return true;
		}
		return src.length === 0;
	};

	if (eatWhitespace()) return result;

	// ── Main matching loop ────────────────────────────────────────────────────
	// Advance through romaji ↔ kana correspondences one syllable at a time.
	while (src.length > 0) {
		if (dstIdx >= destChars.length) break;
		const dstChar = destChars[dstIdx];

		// 1. Direct character match (case-insensitive; handles ASCII ↔ ASCII)
		if (src.toLowerCase().startsWith(dstChar.toLowerCase())) {
			src = src.slice(dstChar.length);
			dstIdx++;
			result.destinationLength++;
			if (eatWhitespace()) return result;
			continue;
		}

		// 2. Romaji → kana lookup (handles "ka" ↔ "カ", "sha" ↔ "シャ", etc.)
		const kanaMatch = tryKanaMatch(src, destChars, dstIdx);
		if (kanaMatch !== null) {
			src = src.slice(kanaMatch.romajiLength);
			dstIdx += kanaMatch.kanaLength;
			result.destinationLength += kanaMatch.kanaLength;
			if (eatWhitespace()) return result;
			continue;
		}

		break; // No match found; fall through to lookahead
	}

	// ── Special case: only one dest char remains ──────────────────────────────
	// Bind all remaining source syllables to that last character.
	if (destChars.length - dstIdx === 1) {
		result.sourceLength = sourceStrings.length;
		result.destinationLength++;
		return result;
	}

	// ── Lookahead ─────────────────────────────────────────────────────────────
	// Scan ahead in dest to find where the NEXT source syllable matches, then
	// assign current dest characters proportionally — mirroring Aegisub's logic.
	const DST_LOOKAHEAD_MAX = 3;
	const MAX_CHARACTER_LENGTH = 5;

	let lookaheadDst = dstIdx;
	for (let lookahead = 0; lookahead < DST_LOOKAHEAD_MAX; lookahead++) {
		lookaheadDst++;
		if (lookaheadDst >= destChars.length) break;

		// Transliterate the lookahead dest char to romaji
		const translit: string[] = [];
		const lookaheadChar = destChars[lookaheadDst];
		const nextChar =
			lookaheadDst + 1 < destChars.length
				? destChars[lookaheadDst + 1]
				: "";

		if (nextChar) {
			translit.push(...getKanaRomajiReadings(lookaheadChar + nextChar));
		}
		translit.push(...getKanaRomajiReadings(lookaheadChar));

		// Search source syllables (beyond the first) for a syllable that matches
		// the lookahead destination character.
		const srcLookaheadMax = (lookahead + 1) * MAX_CHARACTER_LENGTH;
		let srcPos = 0;

		for (let si = 0; si < sourceStrings.length; si++) {
			const syl = sourceStrings[si];
			if (/^\s*$/.test(syl)) continue; // skip whitespace-only syllables
			srcPos++;
			if (srcPos === 1) continue; // skip the current syllable (already processed)
			if (srcPos > srcLookaheadMax) break;

			const lsyl = syl.toLowerCase();
			const matches =
				syl === lookaheadChar || translit.some((t) => lsyl.startsWith(t));
			if (!matches) continue;

			if (srcPos === 2) {
				// The very next syllable matches → current syllable gets lookahead+1 dest chars
				result.destinationLength += lookahead + 1;
				return result;
			}

			// Several syllables ahead → proportional split
			result.destinationLength += 1;
			result.sourceLength = Math.round(
				(srcPos - 1.0) / (lookahead + 1.0) + 0.5,
			);
			return result;
		}
	}

	// Fallback: always consume at least one destination character
	result.destinationLength = Math.max(result.destinationLength, 1);
	return result;
}

// ============================================================================
// Auto-Match Batch API
// ============================================================================

/**
 * Process a single Kanji Timer line using the Aegisub auto-match algorithm.
 *
 * Replaces the previous proportional "Dual Mode" implementation with Aegisub's
 * intelligent romaji↔kana matching (`auto_match_karaoke`).
 *
 * Algorithm (per match step):
 * 1. Call `autoMatchKaraoke` with remaining source syllable texts and dest string.
 * 2. Sum durations of the matched source syllables.
 * 3. Emit `{\kXX}destText` and advance both cursors.
 * 4. Repeat until source syllables or dest chars are exhausted.
 *
 * @param sourceText - Source line text with k-tags (romaji timing)
 * @param destText   - Destination line text (kana/kanji, tags are stripped)
 * @returns Processed line with k-tags applied to destination characters
 */
export function processKanjiTimerLine(
	sourceText: string,
	destText: string,
): string {
	const syllables = parseSourceSyllables(sourceText);
	if (syllables.length === 0) return sourceText;

	const plainDestText = stripAssTags(destText);
	const destChars = segmentGraphemes(plainDestText);
	if (destChars.length === 0) return "";

	let output = "";
	let syllableIdx = 0;
	let destStart = 0;

	while (syllableIdx < syllables.length && destStart < destChars.length) {
		const remainingSyllables = syllables.slice(syllableIdx);
		const remainingDestStr = destChars.slice(destStart).join("");
		const sourceTexts = remainingSyllables.map((s) => s.text);

		const match = autoMatchKaraoke(sourceTexts, remainingDestStr);

		const srcCount = Math.max(1, match.sourceLength);
		const dstCount = match.destinationLength; // may be 0 for empty syllables

		// Sum durations of matched source syllables
		let duration = 0;
		for (let i = 0; i < srcCount && syllableIdx + i < syllables.length; i++) {
			duration += syllables[syllableIdx + i].duration;
		}

		const kVal = Math.round(duration / 10);
		// Use tag type from the first matched syllable
		const tagType = syllables[syllableIdx].tagType;
		const dstText = destChars.slice(destStart, destStart + dstCount).join("");

		output += `{\\${tagType}${kVal}}${dstText}`;

		syllableIdx += srcCount;
		destStart += dstCount;
	}

	// Emit any remaining source syllables that have no dest chars left
	while (syllableIdx < syllables.length) {
		const syl = syllables[syllableIdx];
		const kVal = Math.round(syl.duration / 10);
		output += `{\\${syl.tagType}${kVal}}`;
		syllableIdx++;
	}

	// Append any remaining dest chars without a source syllable
	if (destStart < destChars.length) {
		output += destChars.slice(destStart).join("");
	}

	return output;
}

/**
 * Process an entire ASS file content to apply Kanji Timer logic based on styles.
 *
 * @param content - Full ASS file content
 * @param sourceStyle - Style name for source lines (Romaji with timing)
 * @param destStyle - Style name for destination lines (Kanji/Text to align)
 * @returns Object containing processed content (if successful) or error message
 */
export function processKanjiTimer(
	content: string,
	sourceStyle: string,
	destStyle: string,
): { content: string; error: string | null } {
	if (!sourceStyle || !destStyle) {
		return {
			content: "",
			error: "Please select both source and destination styles.",
		};
	}
	if (sourceStyle === destStyle) {
		return {
			content: "",
			error: "Source and destination styles must be different.",
		};
	}

	const lines = content.split(/\r?\n/);

	// Collect source and destination lines by matching order
	const sourceLines: { index: number; text: string }[] = [];
	const destLines: { index: number; text: string }[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line.startsWith("Dialogue:")) continue;

		const parts = line.split(",");
		if (parts.length < 10) continue;

		const style = parts[3]?.trim();
		const dialogueText = parts.slice(9).join(",");

		if (style === sourceStyle) {
			sourceLines.push({ index: i, text: dialogueText });
		} else if (style === destStyle) {
			destLines.push({ index: i, text: dialogueText });
		}
	}

	if (sourceLines.length === 0) {
		return {
			content: "",
			error: `No lines found with source style "${sourceStyle}".`,
		};
	}
	if (destLines.length === 0) {
		return {
			content: "",
			error: `No lines found with destination style "${destStyle}".`,
		};
	}

	// Process matching pairs
	const processedLines = [...lines];
	const pairCount = Math.min(sourceLines.length, destLines.length);
	let successCount = 0;

	for (let i = 0; i < pairCount; i++) {
		const srcLine = sourceLines[i];
		const dstLine = destLines[i];

		// Process matching pairs using library logic
		const output = processKanjiTimerLine(srcLine.text, dstLine.text);
		if (!output) continue;

		// Reconstruct the dialogue line
		const originalLine = processedLines[dstLine.index];
		const parts = originalLine.split(",");
		if (parts.length >= 10) {
			const prefix = parts.slice(0, 9).join(",") + ",";
			processedLines[dstLine.index] = prefix + output;
			successCount++;
		}
	}

	if (successCount === 0) {
		return {
			content: "",
			error:
				"Could not match any lines. Check your source/destination content.",
		};
	}

	return {
		content: processedLines.join("\n"),
		error: null,
	};
}
