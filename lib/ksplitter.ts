export type SplitMode = "char" | "word" | "syl";

export function aegiTimeTOds(timestr: string): number {
	const [h, m, sms] = timestr.split(":");
	const [s, ms] = sms.split(".");
	// Python: int(ms) + (int(h) * 3600 + int(m) * 60 + int(s)) * 100
	// Note: Python's int(ms) on "00" is 0.
	// If ms is "50", int("50") is 50.
	// In the python script, ms seems to be centiseconds (cs) or similar if it's .ass format?
	// Standard .ass format is h:mm:ss.cc (centiseconds).
	// Let's assume input is strictly formatted like the python script expects.

	return (
		parseInt(ms, 10) +
		(parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10)) * 100
	);
}

export function str_TOkara_array(karaText: string, mode: SplitMode): string[] {
	if (mode === "char") {
		return k_array_char(karaText);
	}
	if (mode === "word") {
		return k_array_word(karaText);
	}
	if (mode === "syl") {
		return k_array_syl(karaText);
	}
	return [];
}

export function k_array_char(karaText: string): string[] {
	const karaSplit_array: string[] = [];
	for (const letter of karaText) {
		if ([" ", "!", "?", ",", ";", ":"].includes(letter)) {
			if (karaSplit_array.length > 0) {
				karaSplit_array[karaSplit_array.length - 1] =
					karaSplit_array[karaSplit_array.length - 1] + letter;
			} else {
				karaSplit_array.push(letter);
			}
		} else {
			karaSplit_array.push(letter);
		}
	}
	return karaSplit_array;
}

export function k_array_word(karaText: string): string[] {
	const karaSplit_array: string[] = [];
	const _array_nospace = karaText.split(/\s+/).filter(Boolean); // Python split() splits by whitespace
	// Python: array_nospace = karaText.split()
	// Python's split() without arguments splits by any whitespace and discards empty strings.
	// JS split(' ') preserves empty strings if multiple spaces.
	// We should match Python's behavior.

	// Actually, let's look at the python code:
	// array_nospace = karaText.split()
	// for i in range(len(array_nospace)):
	//    karaSplit_array.append(array_nospace[i] + " ")

	// Wait, if I split by space, I lose the spaces. The python script appends " " to every word.
	// This implies the output always has a trailing space for every word.

	const words = karaText.trim().split(/\s+/);
	if (words.length === 1 && words[0] === "") return [];

	for (const word of words) {
		karaSplit_array.push(`${word} `);
	}

	return karaSplit_array;
}

export function k_array_syl(karaText: string): string[] {
	const karaSplit_array: string[] = [];
	const ln = karaText.length;
	let l = 0;

	while (l < ln) {
		const letter = karaText[l];
		let letter1 = "";
		if (l + 1 < ln) {
			letter1 = karaText[l + 1];
		}

		const lowerLetter = letter.toLowerCase();
		const lowerLetter1 = letter1.toLowerCase();

		if ("rymnhk".includes(lowerLetter)) {
			if ("aeiouō".includes(lowerLetter1)) {
				karaSplit_array.push(letter + letter1);
				l = l + 2;
			} else {
				karaSplit_array.push(letter);
				l = l + 1;
			}
		} else if (lowerLetter === "w") {
			if ("aoō".includes(lowerLetter1)) {
				karaSplit_array.push(letter + letter1);
				l = l + 2;
			} else {
				karaSplit_array.push(letter);
				l = l + 1;
			}
		} else if (lowerLetter === "t") {
			if ("aeoō".includes(lowerLetter1)) {
				karaSplit_array.push(letter + letter1);
				l = l + 2;
			} else if (lowerLetter1 === "s") {
				if (l + 2 < ln) {
					const letter2 = karaText[l + 2];
					karaSplit_array.push(letter + letter1 + letter2);
				} else {
					// Fallback if not enough chars? Python code:
					// if 0 <= l + 2 < len(karaText): ...
					// It doesn't handle the else case explicitly for the append,
					// but it does l = l + 3.
					// Wait, if l+2 is out of bounds, it doesn't append anything?
					// Python:
					// if 0 <= l + 2 < len(karaText):
					//    letter2 = karaText[l + 2]
					//    karaSplit_array.append(letter + letter1 + letter2)
					// l = l + 3

					// If l+2 is out of bounds, it increments l by 3 and appends NOTHING.
					// This seems like a bug or edge case in the original script, but I should probably replicate it or fix it safely.
					// If l+2 is out of bounds, l+1 is the last char.
					// So we are at "ts" at the end of string.
					// If we skip 3, we finish the loop.
					// So "ts" at end of string is ignored?
					// Let's assume valid input for now or try to be safe.
					// I will replicate the logic but maybe add a check.
					if (l + 2 < ln) {
						const letter2 = karaText[l + 2];
						karaSplit_array.push(letter + letter1 + letter2);
					}
				}
				l = l + 3;
			} else {
				karaSplit_array.push(letter);
				l = l + 1;
			}
		} else if (lowerLetter === "c") {
			if (lowerLetter1 === "h") {
				if (l + 2 < ln) {
					const letter2 = karaText[l + 2];
					karaSplit_array.push(letter + letter1 + letter2);
				}
				l = l + 3;
			} else {
				karaSplit_array.push(letter + letter1);
				l = l + 2;
			}
		} else if (lowerLetter === "s") {
			if ("aueoō".includes(lowerLetter1)) {
				karaSplit_array.push(letter + letter1);
				l = l + 2;
			} else if (lowerLetter1 === "h") {
				if (l + 2 < ln) {
					const letter2 = karaText[l + 2];
					karaSplit_array.push(letter + letter1 + letter2);
				}
				l = l + 3;
			} else {
				karaSplit_array.push(letter);
				l = l + 1;
			}
		} else if (lowerLetter === "f") {
			if (lowerLetter1 === "u") {
				// Python: if letter1 == "u": (case sensitive in python script? No, it says letter1 without lower())
				// Python: if letter1 == "u":
				// But earlier: letter1 = karaText[l + 1]
				// So it is case sensitive for 'u'.
				karaSplit_array.push(letter + letter1);
				l = l + 2;
			} else {
				karaSplit_array.push(letter);
				l = l + 1;
			}
		} else if ("aeiou".includes(lowerLetter)) {
			if ("aeiou".includes(lowerLetter1)) {
				karaSplit_array.push(letter);
				l = l + 1;
			} else {
				karaSplit_array.push(letter);
				l = l + 1;
			}
		} else if (letter === "{") {
			let nxindx = 1;
			if (karaSplit_array.length > 0) {
				karaSplit_array[karaSplit_array.length - 1] += letter;
			} else {
				karaSplit_array.push(letter);
			}

			if (l + nxindx < ln) {
				let ltr = karaText[l + nxindx];
				while (ltr !== "}") {
					// In python: ltr = karaText[l + nxindx] is updated inside loop?
					// Python:
					// ltr = karaText[l + nxindx]
					// while ltr != "}":
					//    ltr = karaText[l + nxindx]  <-- this is just getting the same char if nxindx doesn't change before this line?
					//    ...
					//    nxindx = nxindx + 1

					// It updates nxindx, then checks loop condition with OLD ltr?
					// No, ltr is updated at start of loop in Python?
					// Python:
					// if l + nxindx < len(karaText):
					//    ltr = karaText[l + nxindx]
					//    while ltr != "}":
					//        ltr = karaText[l + nxindx]  <-- Updates ltr based on CURRENT nxindx
					//        karaSplit_array[...] += ltr
					//        nxindx = nxindx + 1
					//        if not ... break

					// So it appends the char, THEN increments.
					// Wait, the first char (at nxindx=1) is assigned to ltr before loop.
					// Inside loop, it re-assigns ltr (redundant for first iter), appends it, then increments.
					// So it appends everything until '}' is found?
					// But it checks `ltr != "}"`.
					// If the first char is '}', loop doesn't run.
					// If first char is 'k', loop runs.
					// Inside: ltr='k', append 'k', nxindx=2.
					// Next iter: ltr='a' (if next is 'a'), append 'a', nxindx=3.
					// ...
					// If it encounters '}', ltr becomes '}'.
					// Loop condition `ltr != "}"` is checked at start.
					// So if ltr becomes '}', the loop terminates?
					// BUT, the assignment `ltr = karaText[l + nxindx]` happens INSIDE the loop at the top.
					// So if we are at '}', we assign ltr='}', append '}', increment.
					// Then loop checks `ltr != "}"` -> False -> Exit.
					// So '}' IS appended.

					ltr = karaText[l + nxindx];
					karaSplit_array[karaSplit_array.length - 1] += ltr;
					nxindx++;
					if (!(l + nxindx < ln)) break;

					// We need to check if the NEW ltr is '}' to break?
					// The python loop structure is:
					// while ltr != "}":
					//    ltr = ... (get char)
					//    append ltr
					//    increment

					// If the char retrieved is '}', it is appended, and then the loop checks `}` != `}` which is false, so it stops.
					// So yes, '}' is included.

					if (ltr === "}") break; // Wait, if I break here, I already appended it.
					// The python `while` check happens BEFORE the body.
					// But `ltr` is updated INSIDE the body.
					// So:
					// 1. Init ltr (e.g. 'k')
					// 2. 'k' != '}' -> True
					// 3. Update ltr = 'k'
					// 4. Append 'k'
					// 5. Increment
					// ...
					// N. Init ltr (from previous iter? No, it's a local var in python loop scope? No, python vars are function scope)
					// The `ltr` variable holds the value from the LAST iteration check?
					// No, `ltr` is updated at the very first line of the while block.
					// So the `while ltr != "}"` check uses the value from the PREVIOUS iteration (or the init).

					// Example: "{k}"
					// l points to '{'.
					// Append '{'.
					// nxindx = 1.
					// ltr = 'k'.
					// Loop: 'k' != '}' -> True.
					//   ltr = 'k'.
					//   Append 'k'.
					//   nxindx = 2.
					//   Next char is '}'.
					// Loop: 'k' != '}' -> True (ltr is still 'k' from line 136 in prev iter? No, line 136 updates it).
					//   ltr = '}'.
					//   Append '}'.
					//   nxindx = 3.
					// Loop: '}' != '}' -> False.
					// Break.

					// So yes, '}' is appended.
				}
			}
			l = l + nxindx;
		} else if ([" ", "!", "?", ",", ";", ":", "}"].includes(letter)) {
			if (karaSplit_array.length > 0) {
				karaSplit_array[karaSplit_array.length - 1] += letter;
				l = l + 1;
			} else {
				karaSplit_array.push(letter);
				l = l + 1;
			}
		} else {
			if ("aeiou".includes(lowerLetter1)) {
				karaSplit_array.push(letter + letter1);
				l = l + 2;
			} else {
				karaSplit_array.push(letter);
				l = l + 1;
			}
		}
	}

	return karaSplit_array;
}

export function arrTOk_str(
	karaSplit_array: string[],
	timePerletter: number,
): string {
	let finalKaraStr = "";
	for (const syl of karaSplit_array) {
		const l = timePerletter * syl.length;
		const k = `{\\k${l}}`;
		finalKaraStr += k + syl;
	}
	return finalKaraStr;
}

export interface ProcessOptions {
	selector: "all" | "actor" | "style";
	selectorValue?: string;
	mode: SplitMode;
}

export function processAssFile(
	content: string,
	options: ProcessOptions,
): string {
	const lines = content.split(/\r?\n/);
	const outputLines: string[] = [];
	let counter = 0;

	for (const line of lines) {
		const input = line.trim();
		if (input.includes("Dialogue")) {
			// Python: input.split(",", 9) -> maxsplit 9
			const inputarray = input.split(",");
			// We need to handle the maxsplit behavior manually if we want to preserve commas in the text
			// The text is the 10th element (index 9).
			// So we take the first 9 elements, and the rest is the text.

			if (inputarray.length >= 10) {
				const first9 = inputarray.slice(0, 9);
				const karaRawText = inputarray.slice(9).join(","); // Re-join the rest

				let match = "";
				let selectorValue = options.selectorValue || "";

				if (options.selector === "actor") {
					match = first9[4];
				} else if (options.selector === "style") {
					match = first9[3];
				} else if (options.selector === "all") {
					match = "True";
					selectorValue = "True";
				}

				let finalKaraStr = input;

				if (match.toLowerCase() === selectorValue.toLowerCase()) {
					const duration_ds = aegiTimeTOds(first9[2]) - aegiTimeTOds(first9[1]);
					const text_len = karaRawText.length;
					counter++;

					if (text_len > 0) {
						const timePerletter = Math.floor(duration_ds / text_len);
						const karaSplit_array = str_TOkara_array(karaRawText, options.mode);

						let prefix = "";
						for (let x = 0; x < 9; x++) {
							prefix += `${first9[x]},`;
						}

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
	return outputLines.join("\n");
}
