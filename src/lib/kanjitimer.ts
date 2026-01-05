/**
 * Kanji Timer API - TypeScript port of Aegisub's KaraokeLineMatchDisplay
 *
 * Functional API for linking source karaoke syllables to destination text,
 * aggregating durations, and reconstructing ASS karaoke lines.
 *
 * Based on: https://github.com/arch1t3cht/Aegisub/blob/feature/src/dialog_kara_timing_copy.cpp
 */

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
 *
 * @example
 * parseSourceSyllables("{\\k50}ka{\\k50}ra{\\k50}o{\\k50}ke")
 * // Returns: [
 * //   { duration: 500, text: "ka", tagType: "k" },
 * //   { duration: 500, text: "ra", tagType: "k" },
 * //   { duration: 500, text: "o", tagType: "k" },
 * //   { duration: 500, text: "ke", tagType: "k" }
 * // ]
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
// State Management
// ============================================================================

/**
 * Create initial Kanji Timer state from source and destination lines.
 *
 * @param sourceText - Source ASS karaoke line with k-tags
 * @param destinationText - Destination text (plain or with tags to be stripped)
 * @returns Initial KanjiTimerState
 *
 * @example
 * const state = createKanjiTimerState(
 *   "{\\k50}ka{\\k50}ra{\\k50}o{\\k50}ke",
 *   "唐揚げ"
 * );
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
 * Returns new state (immutable).
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
 * Returns new state (immutable).
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
 * Returns new state (immutable).
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
 * Returns new state (immutable).
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
 * Returns new state with match recorded, or null if both selections are empty.
 *
 * This is equivalent to Aegisub's "Link" button operation.
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
 * Returns new state, or null if there are no matches to undo.
 *
 * This is equivalent to Aegisub's "Unlink" button operation.
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
 *
 * For each match group, aggregates durations from all source syllables
 * and creates a single k-tag with the destination text.
 *
 * @param state - Current Kanji Timer state
 * @returns ASS karaoke line string
 *
 * @example
 * // If matches are: [{src: [50ms, 50ms], dst: "唐"}, {src: [100ms], dst: "揚げ"}]
 * getOutputLine(state)
 * // Returns: "{\\k10}唐{\\k10}揚げ"
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
 * Check if all destination characters have been matched.
 */
export function isDestinationComplete(state: KanjiTimerState): boolean {
	return state.matchEnd >= state.destinationChars.length;
}

/**
 * Check if the Kanji Timer matching is complete (both source and destination fully matched).
 */
export function isComplete(state: KanjiTimerState): boolean {
	return isSourceComplete(state) && isDestinationComplete(state);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Auto-accept all remaining matches with 1:1 mapping.
 * Useful when source syllable count equals destination character count.
 *
 * @param state - Current state
 * @returns Final state with all matches completed, or null if counts don't match
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
 * Useful as a final "accept all remaining" operation.
 *
 * @param state - Current state
 * @returns New state with remaining matched as one group
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
