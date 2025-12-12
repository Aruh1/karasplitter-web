export type SplitMode = "char" | "word" | "syl";

export interface ExtractedMetadata {
	actors: string[];
	styles: string[];
}

// Pre-computed character sets for O(1) lookup instead of O(n) string.includes()
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

export function extractActorsAndStyles(content: string): ExtractedMetadata {
	const actorsSet = new Set<string>();
	const stylesSet = new Set<string>();
	const lines = content.split(/\r?\n/);

	for (let i = 0; i < lines.length; i++) {
		const input = lines[i].trim();

		// Quick check first character before doing full startsWith
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
		actors: Array.from(actorsSet).sort(),
		styles: Array.from(stylesSet).sort(),
	};
}

export function aegiTimeTOds(timestr: string): number {
	// Optimized: avoid creating intermediate arrays when possible
	const colonIdx1 = timestr.indexOf(":");
	const colonIdx2 = timestr.indexOf(":", colonIdx1 + 1);
	const dotIdx = timestr.indexOf(".");

	const h = parseInt(timestr.substring(0, colonIdx1), 10);
	const m = parseInt(timestr.substring(colonIdx1 + 1, colonIdx2), 10);
	const s = parseInt(timestr.substring(colonIdx2 + 1, dotIdx), 10);
	const ms = parseInt(timestr.substring(dotIdx + 1), 10);

	return ms + (h * 3600 + m * 60 + s) * 100;
}

export function str_TOkara_array(karaText: string, mode: SplitMode): string[] {
	switch (mode) {
		case "char":
			return k_array_char(karaText);
		case "word":
			return k_array_word(karaText);
		case "syl":
			return k_array_syl(karaText);
		default:
			return [];
	}
}

export function k_array_char(karaText: string): string[] {
	const result: string[] = [];
	const len = karaText.length;

	for (let i = 0; i < len; i++) {
		const letter = karaText[i];
		if (PUNCTUATION_CHARS.has(letter)) {
			if (result.length > 0) {
				result[result.length - 1] += letter;
			} else {
				result.push(letter);
			}
		} else {
			result.push(letter);
		}
	}
	return result;
}

export function k_array_word(karaText: string): string[] {
	const trimmed = karaText.trim();
	if (!trimmed) return [];

	const words = trimmed.split(/\s+/);
	const result = new Array<string>(words.length);

	for (let i = 0; i < words.length; i++) {
		result[i] = `${words[i]} `;
	}
	return result;
}

export function k_array_syl(karaText: string): string[] {
	const result: string[] = [];
	const ln = karaText.length;
	let l = 0;

	while (l < ln) {
		const letter = karaText[l];
		const letter1 = l + 1 < ln ? karaText[l + 1] : "";
		const lowerLetter = letter.toLowerCase();
		const lowerLetter1 = letter1.toLowerCase();

		if (CONSONANTS_WITH_VOWEL.has(lowerLetter)) {
			if (VOWELS_WITH_MACRON.has(lowerLetter1)) {
				result.push(letter + letter1);
				l += 2;
			} else {
				result.push(letter);
				l++;
			}
		} else if (lowerLetter === "w") {
			if (W_VOWELS.has(lowerLetter1)) {
				result.push(letter + letter1);
				l += 2;
			} else {
				result.push(letter);
				l++;
			}
		} else if (lowerLetter === "t") {
			if (T_VOWELS.has(lowerLetter1)) {
				result.push(letter + letter1);
				l += 2;
			} else if (lowerLetter1 === "s") {
				if (l + 2 < ln) {
					result.push(letter + letter1 + karaText[l + 2]);
				}
				l += 3;
			} else {
				result.push(letter);
				l++;
			}
		} else if (lowerLetter === "c") {
			if (lowerLetter1 === "h") {
				if (l + 2 < ln) {
					result.push(letter + letter1 + karaText[l + 2]);
				}
				l += 3;
			} else {
				result.push(letter + letter1);
				l += 2;
			}
		} else if (lowerLetter === "s") {
			if (S_VOWELS.has(lowerLetter1)) {
				result.push(letter + letter1);
				l += 2;
			} else if (lowerLetter1 === "h") {
				if (l + 2 < ln) {
					result.push(letter + letter1 + karaText[l + 2]);
				}
				l += 3;
			} else {
				result.push(letter);
				l++;
			}
		} else if (lowerLetter === "f") {
			if (lowerLetter1 === "u") {
				result.push(letter + letter1);
				l += 2;
			} else {
				result.push(letter);
				l++;
			}
		} else if (VOWELS.has(lowerLetter)) {
			result.push(letter);
			l++;
		} else if (letter === "{") {
			// Handle bracket content - attach to previous element or push new
			const startIdx = result.length > 0 ? result.length - 1 : -1;
			if (startIdx >= 0) {
				result[startIdx] += letter;
			} else {
				result.push(letter);
			}

			let nxindx = 1;
			const lastIdx = result.length - 1;
			while (l + nxindx < ln) {
				const ltr = karaText[l + nxindx];
				result[lastIdx] += ltr;
				nxindx++;
				if (ltr === "}") break;
			}
			l += nxindx;
		} else if (PUNCTUATION_CHARS_WITH_BRACE.has(letter)) {
			if (result.length > 0) {
				result[result.length - 1] += letter;
			} else {
				result.push(letter);
			}
			l++;
		} else {
			if (VOWELS.has(lowerLetter1)) {
				result.push(letter + letter1);
				l += 2;
			} else {
				result.push(letter);
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
	// Pre-calculate total length for better string allocation
	const parts = new Array<string>(karaSplit_array.length * 2);
	for (let i = 0; i < karaSplit_array.length; i++) {
		const syl = karaSplit_array[i];
		parts[i * 2] = `{\\k${timePerletter * syl.length}}`;
		parts[i * 2 + 1] = syl;
	}
	return parts.join("");
}

export interface ProcessOptions {
	selector: "all" | "actor" | "style";
	selectorValue?: string;
	mode: SplitMode;
}

export function processAssFile(
	content: string,
	options: ProcessOptions,
): { content: string; error: string | null } {
	const lines = content.split(/\r?\n/);
	const outputLines: string[] = [];
	let counter = 0;

	// Cache selector info outside loop
	const isActorSelector = options.selector === "actor";
	const isStyleSelector = options.selector === "style";
	const isAllSelector = options.selector === "all";
	const optionsSelectorValue = (options.selectorValue || "").toLowerCase();

	for (let i = 0; i < lines.length; i++) {
		const input = lines[i].trim();

		// Quick first-char check before expensive startsWith
		const firstChar = input[0];
		if (firstChar !== "D" && firstChar !== "C") continue;

		const isDialogue = input.startsWith("Dialogue:");
		const isComment = !isDialogue && input.startsWith("Comment:");

		if (!isDialogue && !isComment) continue;

		if (isDialogue) {
			const inputarray = input.split(",");

			if (inputarray.length >= 10) {
				const first9 = inputarray.slice(0, 9);
				const karaRawText = inputarray.slice(9).join(",");

				let match: string;
				let selectorValue: string;

				if (isActorSelector) {
					match = first9[4];
					selectorValue = optionsSelectorValue;
				} else if (isStyleSelector) {
					match = first9[3];
					selectorValue = optionsSelectorValue;
				} else {
					match = "true";
					selectorValue = "true";
				}

				let finalKaraStr = input;

				if (match.toLowerCase() === selectorValue) {
					const duration_ds = aegiTimeTOds(first9[2]) - aegiTimeTOds(first9[1]);
					const text_len = karaRawText.length;
					counter++;

					if (text_len > 0) {
						const timePerletter = Math.floor(duration_ds / text_len);
						const karaSplit_array = str_TOkara_array(karaRawText, options.mode);

						// Build prefix more efficiently with join
						const prefix = first9.join(",") + ",";
						finalKaraStr = prefix + arrTOk_str(karaSplit_array, timePerletter);
					}
				}
				outputLines.push(finalKaraStr);
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
