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
// Auto Proportional / Dual Mode API (New)
// ============================================================================

/**
 * Process a single Kanji Timer line using Dual Mode distribution.
 *
 * Algorithm:
 * 1. Parse all k-tags from source text.
 * 2. Segment destination text into Unicode graphemes (characters).
 * 3. Calculate character allocation:
 *    - Mode A (Tags >= Chars): 1:1 mapping. Each text tag gets 1 char until chars run out.
 *    - Mode B (Tags < Chars): Proportional mapping. Chars distributed based on text length ratio.
 * 4. Generate output string.
 *
 * @param sourceText - Source line text with k-tags
 * @param destText - Destination line text (will be stripped of tags)
 * @returns Processed line with k-tags applied to characters
 */
export function processKanjiTimerLine(
	sourceText: string,
	destText: string,
): string {
	// Parse source syllables using unified parser
	// This ensures we capture tag types (k, kf, ko) and handle durations consistently
	const syllables = parseSourceSyllables(sourceText);
	if (syllables.length === 0) return sourceText;

	// Strip tags from destination to get plain text, then segment into characters
	const plainDestText = stripAssTags(destText);
	const destChars = segmentGraphemes(plainDestText);
	if (destChars.length === 0) return ""; // No dest chars

	// Calculate distribution:
	// - Empty k-tags (lead-in, whitespace only): don't consume any dest chars
	// - Text k-tags: distribute dest chars among them
	const textTags = syllables.filter((s) => s.text.trim().length > 0);
	const totalTextLength = textTags.reduce(
		(sum, s) => sum + s.text.trim().length,
		0,
	);

	// Calculate how many dest chars each text-tag should get
	const charAllocation: number[] = [];

	if (textTags.length >= destChars.length) {
		// Mode A: More tags than chars -> 1:1 mapping (last tags get 0)
		for (let j = 0; j < textTags.length; j++) {
			charAllocation.push(j < destChars.length ? 1 : 0);
		}
	} else {
		// Mode B: More chars than tags -> Proportional distribution based on text length
		let cumulativeTextLength = 0;
		let allocatedChars = 0;

		for (let j = 0; j < textTags.length; j++) {
			const syl = textTags[j];
			const sLen = syl.text.trim().length;
			cumulativeTextLength += sLen;

			// Proportional: (cumulativeTextLength / totalTextLength) * destChars.length
			const targetCumulative = Math.round(
				(cumulativeTextLength / totalTextLength) * destChars.length,
			);
			const charsForThisTag = Math.max(1, targetCumulative - allocatedChars);
			charAllocation.push(charsForThisTag);
			allocatedChars += charsForThisTag;
		}

		// Ensure we don't over-allocate
		const totalAllocated = charAllocation.reduce((a, b) => a + b, 0);
		if (totalAllocated > destChars.length && charAllocation.length > 0) {
			const excess = totalAllocated - destChars.length;
			charAllocation[charAllocation.length - 1] = Math.max(
				1,
				charAllocation[charAllocation.length - 1] - excess,
			);
		}
	}

	// Build output
	let output = "";
	let destIdx = 0;
	let textTagIdx = 0;

	for (const syl of syllables) {
		// Convert duration back to centiseconds (ms -> cs)
		const kVal = Math.round(syl.duration / 10);
		// Preserve original tag type (k, kf, ko)
		output += `{\\${syl.tagType}${kVal}}`;

		// Only consume a destination character if this syllable has effective text
		if (syl.text.trim().length > 0 && textTagIdx < charAllocation.length) {
			const numChars = charAllocation[textTagIdx];
			for (let c = 0; c < numChars && destIdx < destChars.length; c++) {
				output += destChars[destIdx];
				destIdx++;
			}
			textTagIdx++;
		}
	}

	// Append any remaining destination characters (edge case)
	while (destIdx < destChars.length) {
		output += destChars[destIdx];
		destIdx++;
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
