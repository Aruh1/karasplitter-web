export type SplitMode = "char" | "word" | "syl";

// Pre-computed character sets for O(1) lookup
const PUNCTUATION_CHARS = new Set([" ", "!", "?", ",", ";", ":"]);
const PUNCTUATION_CHARS_WITH_BRACE = new Set([
	" ",
	"!",
	"?",
	",",
	";",
	":",
	"}",
]);
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const VOWELS_WITH_MACRON = new Set([
	"a",
	"e",
	"i",
	"o",
	"u",
	"ā",
	"ī",
	"ū",
	"ē",
	"ō",
]);
const CONSONANTS_WITH_VOWEL = new Set([
	"b",
	"d",
	"g",
	"h",
	"k",
	"m",
	"n",
	"p",
	"r",
	"v",
	"y",
	"z",
]);
const W_VOWELS = new Set(["a", "e", "i", "o", "ā", "ē", "ī", "ō"]);
const T_VOWELS = new Set(["a", "e", "i", "o", "u", "ā", "ē", "ī", "ō", "ū"]);
const S_VOWELS = new Set(["a", "e", "i", "o", "u", "ā", "ē", "ī", "ō", "ū"]);
const ASS_TAG_REGEX = /\{[^}]*\}/g;

export function deKtime(text: string): string {
	return text.replace(ASS_TAG_REGEX, "");
}

export interface ExtractedMetadata {
	actors: string[];
	styles: string[];
}

export function extractActorsAndStyles(content: string): ExtractedMetadata {
	const actorsSet = new Set<string>();
	const stylesSet = new Set<string>();
	const lines = content.split(/\r?\n/);

	for (const line of lines) {
		const input = line.trim();
		const firstChar = input[0];
		if (firstChar !== "D" && firstChar !== "C") continue;
		if (!input.startsWith("Dialogue:") && !input.startsWith("Comment:"))
			continue;

		const inputarray = input.split(",");
		if (inputarray.length >= 10) {
			const style = inputarray[3]?.trim();
			const actor = inputarray[4]?.trim();
			if (style) stylesSet.add(style);
			if (actor) actorsSet.add(actor);
		}
	}

	return {
		actors: [...actorsSet].sort(),
		styles: [...stylesSet].sort(),
	};
}

export function aegiTimeTOds(timestr: string): number {
	const c1 = timestr.indexOf(":");
	const c2 = timestr.indexOf(":", c1 + 1);
	const d = timestr.indexOf(".");

	const h = +timestr.slice(0, c1);
	const m = +timestr.slice(c1 + 1, c2);
	const s = +timestr.slice(c2 + 1, d);
	const cs = +timestr.slice(d + 1); // Centiseconds (0-99 in ASS format)

	return cs + (h * 3600 + m * 60 + s) * 100;
}

export function str_TOkara_array(karaText: string, mode: SplitMode): string[] {
	if (mode === "char") return k_array_char(karaText);
	if (mode === "word") return k_array_word(karaText);
	if (mode === "syl") return k_array_syl(karaText);
	return [];
}

export function k_array_char(karaText: string): string[] {
	const result: string[] = [];
	for (const char of karaText) {
		if (PUNCTUATION_CHARS.has(char) && result.length > 0) {
			result[result.length - 1] += char;
		} else {
			result.push(char);
		}
	}
	return result;
}

export function k_array_word(karaText: string): string[] {
	const trimmed = karaText.trim();
	if (!trimmed) return [];
	return trimmed.split(/\s+/).map((w) => `${w} `);
}

export function k_array_syl(karaText: string): string[] {
	const result: string[] = [];
	const ln = karaText.length;
	let l = 0;

	// Helper to find the index of the next non-tag character
	const getNextCharIdx = (startIdx: number): number => {
		let idx = startIdx;
		while (idx < ln) {
			if (karaText[idx] === "{") {
				const closeIdx = karaText.indexOf("}", idx);
				if (closeIdx !== -1) {
					idx = closeIdx + 1;
					continue;
				}
			}
			return idx;
		}
		return ln;
	};

	while (l < ln) {
		const char = karaText[l];
		const lc = char.toLowerCase();

		// Handle bracket content
		if (char === "{") {
			const closeIdx = karaText.indexOf("}", l);
			const bracketContent =
				closeIdx !== -1 ? karaText.slice(l, closeIdx + 1) : karaText.slice(l);
			if (result.length > 0) {
				result[result.length - 1] += bracketContent;
			} else {
				result.push(bracketContent);
			}
			l = closeIdx !== -1 ? closeIdx + 1 : ln;
			continue;
		}

		// Handle punctuation
		if (PUNCTUATION_CHARS_WITH_BRACE.has(char)) {
			if (result.length > 0) {
				result[result.length - 1] += char;
			} else {
				result.push(char);
			}
			l++;
			continue;
		}

		// Peek ahead for the next 1 or 2 actual characters (skipping tags)
		const nextCharIdx1 = getNextCharIdx(l + 1);
		const nextChar1 = nextCharIdx1 < ln ? karaText[nextCharIdx1] : "";
		const lnc1 = nextChar1.toLowerCase();

		const nextCharIdx2 = getNextCharIdx(nextCharIdx1 + 1);
		const nextChar2 = nextCharIdx2 < ln ? karaText[nextCharIdx2] : "";
		const lnc2 = nextChar2.toLowerCase();

		// We extract the full slice (including tags) when we match a multi-char syllable
		const pushSlice = (endIdxInclusive: number) => {
			const slice = karaText.slice(l, endIdxInclusive + 1);
			result.push(slice);
			l = endIdxInclusive + 1;
		};

		// Syllable patterns
		if (CONSONANTS_WITH_VOWEL.has(lc)) {
			if (VOWELS_WITH_MACRON.has(lnc1)) {
				pushSlice(nextCharIdx1);
			} else if (
				(lnc1 === "w" || lnc1 === "y") &&
				VOWELS_WITH_MACRON.has(lnc2)
			) {
				// kwa, gwa, bya, dyu, vya, etc.
				pushSlice(nextCharIdx2);
			} else {
				pushSlice(l);
			}
		} else if (lc === "w") {
			if (W_VOWELS.has(lnc1)) {
				pushSlice(nextCharIdx1);
			} else {
				pushSlice(l);
			}
		} else if (lc === "t") {
			if (T_VOWELS.has(lnc1)) {
				pushSlice(nextCharIdx1);
			} else if (lnc1 === "s") {
				// We don't peek 3 chars ahead strictly for 'tsa' check, but if we see 'ts' we assume it's one syllable chunk
				// To be precise: ts + vowel. But even just 'ts' is grouped. Let's group 'ts' + next char if next is vowel.
				if (VOWELS_WITH_MACRON.has(lnc2)) {
					pushSlice(nextCharIdx2);
				} else {
					pushSlice(l);
				}
			} else {
				pushSlice(l);
			}
		} else if (lc === "c") {
			if (lnc1 === "h") {
				if (VOWELS_WITH_MACRON.has(lnc2)) {
					pushSlice(nextCharIdx2);
				} else {
					pushSlice(nextCharIdx1); // at least group 'ch'
				}
			} else {
				// Just c + next handled via default or pushSlice(l)?
				// Original logic grouped c + nextChar unconditionally if not 'h'. Let's group c + nextChar1
				if (nextCharIdx1 < ln) {
					pushSlice(nextCharIdx1);
				} else {
					pushSlice(l);
				}
			}
		} else if (lc === "s") {
			if (S_VOWELS.has(lnc1)) {
				pushSlice(nextCharIdx1);
			} else if (lnc1 === "h") {
				if (VOWELS_WITH_MACRON.has(lnc2)) {
					pushSlice(nextCharIdx2);
				} else {
					pushSlice(nextCharIdx1);
				}
			} else {
				pushSlice(l);
			}
		} else if (lc === "f") {
			if (VOWELS_WITH_MACRON.has(lnc1)) {
				pushSlice(nextCharIdx1);
			} else if (lnc1 === "y") {
				// fyu (フュ)
				if (VOWELS_WITH_MACRON.has(lnc2)) {
					pushSlice(nextCharIdx2);
				} else {
					pushSlice(nextCharIdx1);
				}
			} else {
				pushSlice(l);
			}
		} else if (VOWELS.has(lc)) {
			pushSlice(l);
		} else {
			// Default: check if next is a vowel
			if (VOWELS.has(lnc1)) {
				pushSlice(nextCharIdx1);
			} else {
				pushSlice(l);
			}
		}
	}

	return result;
}

export function arrTOk_str(
	karaSplit_array: string[],
	timePerletter: number,
): string {
	const len = karaSplit_array.length;
	if (len === 0) return "";

	let result = "";
	for (let i = 0; i < len; i++) {
		const syl = karaSplit_array[i];
		result += `{\\k${timePerletter * syl.length}}${syl}`;
	}
	return result;
}

export function arrTOk_str_fixed(karaSplit_array: string[]): string {
	const len = karaSplit_array.length;
	if (len === 0) return "";

	let result = "";
	for (let i = 0; i < len; i++) {
		result += `{\\k1}${karaSplit_array[i]}`;
	}
	return result;
}

export interface ProcessOptions {
	selector: "all" | "actor" | "style";
	selectorValue?: string;
	mode: SplitMode;
	cleanKTime?: boolean;
	kTimeOption?: "calculated" | "k1";
}

export function processAssFile(
	content: string,
	options: ProcessOptions,
): { content: string; error: string | null } {
	// Input validation: check if content appears to be ASS format
	const trimmedContent = content.trim();
	if (!trimmedContent) {
		return {
			content: "",
			error: "Input is empty. Please paste your .ass file content.",
		};
	}

	// Check for common ASS indicators (not strict, just basic validation)
	const hasAssIndicators =
		trimmedContent.includes("Dialogue:") ||
		trimmedContent.includes("Comment:") ||
		trimmedContent.includes("[Script Info]") ||
		trimmedContent.includes("[V4+ Styles]");

	if (!hasAssIndicators) {
		return {
			content: "",
			error:
				"Input doesn't appear to be a valid .ass file. Expected Dialogue:, Comment:, or ASS section headers.",
		};
	}

	const lines = content.split(/\r?\n/);
	const outputLines: string[] = [];
	let counter = 0;

	const isActorSelector = options.selector === "actor";
	const isStyleSelector = options.selector === "style";
	const selectorValueLower = (options.selectorValue ?? "").toLowerCase();
	const cleanMode = options.cleanKTime === true;

	for (const line of lines) {
		const input = line.trim();
		const firstChar = input[0];

		if (firstChar !== "D" && firstChar !== "C") continue;

		const isDialogue = input.startsWith("Dialogue:");
		const isComment = !isDialogue && input.startsWith("Comment:");

		if (!isDialogue && !isComment) continue;

		if (isDialogue) {
			const parts = input.split(",");

			if (parts.length >= 10) {
				const prefix = parts.slice(0, 9).join(",") + ",";
				const karaRawText = parts.slice(9).join(",");

				let shouldProcess: boolean;
				if (isActorSelector) {
					shouldProcess = parts[4].toLowerCase() === selectorValueLower;
				} else if (isStyleSelector) {
					shouldProcess = parts[3].toLowerCase() === selectorValueLower;
				} else {
					shouldProcess = true;
				}

				if (shouldProcess) {
					counter++;
					if (cleanMode) {
						outputLines.push(prefix + deKtime(karaRawText));
					} else {
						const split = str_TOkara_array(karaRawText, options.mode);
						// Use fixed {\k1} for char/word modes when kTimeOption is 'k1'
						if (
							(options.mode === "char" || options.mode === "word") &&
							options.kTimeOption === "k1"
						) {
							outputLines.push(prefix + arrTOk_str_fixed(split));
						} else {
							const duration = aegiTimeTOds(parts[2]) - aegiTimeTOds(parts[1]);
							const textLen = karaRawText.length;
							if (textLen > 0) {
								const timePerletter = Math.floor(duration / textLen);
								outputLines.push(prefix + arrTOk_str(split, timePerletter));
							} else {
								outputLines.push(input);
							}
						}
					}
				} else {
					outputLines.push(input);
				}
			} else {
				outputLines.push(input);
			}
		} else {
			outputLines.push(input);
		}
	}

	console.log(`Found: ${counter} lines matching criteria`);

	if (outputLines.length === 0) {
		return {
			content: "",
			error:
				"No valid 'Dialogue:' or 'Comment:' lines found. Please check your input.",
		};
	}

	return { content: outputLines.join("\n"), error: null };
}

// Re-export Kanji Timer API
export * from "./kanjitimer";
