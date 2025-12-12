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
const VOWELS_WITH_MACRON = new Set(["a", "e", "i", "o", "u", "ō"]);
const CONSONANTS_WITH_VOWEL = new Set(["r", "y", "m", "n", "h", "k"]);
const W_VOWELS = new Set(["a", "o", "ō"]);
const T_VOWELS = new Set(["a", "e", "o", "ō"]);
const S_VOWELS = new Set(["a", "u", "e", "o", "ō"]);
const KTIME_REGEX = /\{\\[kK][fo]?\d*\}/g;

export function deKtime(text: string): string {
	return text.replace(KTIME_REGEX, "");
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
	const ms = +timestr.slice(d + 1);

	return ms + (h * 3600 + m * 60 + s) * 100;
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

	while (l < ln) {
		const char = karaText[l];
		const nextChar = karaText[l + 1] ?? "";
		const lc = char.toLowerCase();
		const lnc = nextChar.toLowerCase();

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

		// Syllable patterns
		if (CONSONANTS_WITH_VOWEL.has(lc)) {
			if (VOWELS_WITH_MACRON.has(lnc)) {
				result.push(char + nextChar);
				l += 2;
			} else {
				result.push(char);
				l++;
			}
		} else if (lc === "w") {
			if (W_VOWELS.has(lnc)) {
				result.push(char + nextChar);
				l += 2;
			} else {
				result.push(char);
				l++;
			}
		} else if (lc === "t") {
			if (T_VOWELS.has(lnc)) {
				result.push(char + nextChar);
				l += 2;
			} else if (lnc === "s" && l + 2 < ln) {
				result.push(char + nextChar + karaText[l + 2]);
				l += 3;
			} else {
				result.push(char);
				l++;
			}
		} else if (lc === "c") {
			if (lnc === "h" && l + 2 < ln) {
				result.push(char + nextChar + karaText[l + 2]);
				l += 3;
			} else {
				result.push(char + nextChar);
				l += 2;
			}
		} else if (lc === "s") {
			if (S_VOWELS.has(lnc)) {
				result.push(char + nextChar);
				l += 2;
			} else if (lnc === "h" && l + 2 < ln) {
				result.push(char + nextChar + karaText[l + 2]);
				l += 3;
			} else {
				result.push(char);
				l++;
			}
		} else if (lc === "f") {
			if (lnc === "u") {
				result.push(char + nextChar);
				l += 2;
			} else {
				result.push(char);
				l++;
			}
		} else if (VOWELS.has(lc)) {
			result.push(char);
			l++;
		} else {
			// Default: check if next is a vowel
			if (VOWELS.has(lnc)) {
				result.push(char + nextChar);
				l += 2;
			} else {
				result.push(char);
				l++;
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

export interface ProcessOptions {
	selector: "all" | "actor" | "style";
	selectorValue?: string;
	mode: SplitMode;
	cleanKTime?: boolean;
}

export function processAssFile(
	content: string,
	options: ProcessOptions,
): { content: string; error: string | null } {
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
						const duration = aegiTimeTOds(parts[2]) - aegiTimeTOds(parts[1]);
						const textLen = karaRawText.length;
						if (textLen > 0) {
							const timePerletter = Math.floor(duration / textLen);
							const split = str_TOkara_array(karaRawText, options.mode);
							outputLines.push(prefix + arrTOk_str(split, timePerletter));
						} else {
							outputLines.push(input);
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
