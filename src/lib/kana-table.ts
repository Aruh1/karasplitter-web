/**
 * Kana-Romaji lookup tables for the Kanji Timer auto-matching algorithm.
 *
 * Ported from Aegisub's kana_table.cpp:
 * https://github.com/arch1t3cht/Aegisub/blob/feature/libaegisub/common/kana_table.cpp
 *
 * Copyright (c) 2013, Thomas Goyne <plorkyeran@aegisub.org>
 * Licensed under ISC License.
 */

export interface KanaPair {
	/** Kana character(s) — hiragana or katakana, may span 2 grapheme clusters */
	kana: string;
	/** Romaji reading for this kana */
	romaji: string;
}

/**
 * Combined kana-romaji table covering hiragana, katakana, digraphs, and special
 * characters. Entries with longer kana sequences (digraphs like きゃ) are listed
 * first so that longer matches are preferred when iterating.
 *
 * Used for:
 *  - Main matching loop: given romaji source, find corresponding kana at dest position.
 *  - Lookahead: given kana at dest position, enumerate possible romaji readings.
 */
export const KANA_TABLE: KanaPair[] = [
	// ── Two-codepoint digraphs (listed first for match priority) ──────────────

	// Hiragana digraphs
	{ kana: "きゃ", romaji: "kya" },
	{ kana: "きゅ", romaji: "kyu" },
	{ kana: "きょ", romaji: "kyo" },
	{ kana: "ぎゃ", romaji: "gya" },
	{ kana: "ぎゅ", romaji: "gyu" },
	{ kana: "ぎょ", romaji: "gyo" },
	{ kana: "しゃ", romaji: "sha" },
	{ kana: "しゅ", romaji: "shu" },
	{ kana: "しょ", romaji: "sho" },
	{ kana: "じゃ", romaji: "ja" },
	{ kana: "じゅ", romaji: "ju" },
	{ kana: "じょ", romaji: "jo" },
	{ kana: "ちゃ", romaji: "cha" },
	{ kana: "ちゅ", romaji: "chu" },
	{ kana: "ちょ", romaji: "cho" },
	{ kana: "ぢゃ", romaji: "ja" },
	{ kana: "ぢゅ", romaji: "ju" },
	{ kana: "ぢょ", romaji: "jo" },
	{ kana: "にゃ", romaji: "nya" },
	{ kana: "にゅ", romaji: "nyu" },
	{ kana: "にょ", romaji: "nyo" },
	{ kana: "ひゃ", romaji: "hya" },
	{ kana: "ひゅ", romaji: "hyu" },
	{ kana: "ひょ", romaji: "hyo" },
	{ kana: "びゃ", romaji: "bya" },
	{ kana: "びゅ", romaji: "byu" },
	{ kana: "びょ", romaji: "byo" },
	{ kana: "ぴゃ", romaji: "pya" },
	{ kana: "ぴゅ", romaji: "pyu" },
	{ kana: "ぴょ", romaji: "pyo" },
	{ kana: "みゃ", romaji: "mya" },
	{ kana: "みゅ", romaji: "myu" },
	{ kana: "みょ", romaji: "myo" },
	{ kana: "りゃ", romaji: "rya" },
	{ kana: "りゅ", romaji: "ryu" },
	{ kana: "りょ", romaji: "ryo" },

	// Katakana digraphs
	{ kana: "キャ", romaji: "kya" },
	{ kana: "キュ", romaji: "kyu" },
	{ kana: "キョ", romaji: "kyo" },
	{ kana: "ギャ", romaji: "gya" },
	{ kana: "ギュ", romaji: "gyu" },
	{ kana: "ギョ", romaji: "gyo" },
	{ kana: "シェ", romaji: "she" },
	{ kana: "シャ", romaji: "sha" },
	{ kana: "シュ", romaji: "shu" },
	{ kana: "ショ", romaji: "sho" },
	{ kana: "ジェ", romaji: "je" },
	{ kana: "ジャ", romaji: "ja" },
	{ kana: "ジュ", romaji: "ju" },
	{ kana: "ジョ", romaji: "jo" },
	{ kana: "チェ", romaji: "che" },
	{ kana: "チャ", romaji: "cha" },
	{ kana: "チュ", romaji: "chu" },
	{ kana: "チョ", romaji: "cho" },
	{ kana: "ヂャ", romaji: "ja" },
	{ kana: "ヂュ", romaji: "ju" },
	{ kana: "ヂョ", romaji: "jo" },
	{ kana: "ティ", romaji: "ti" },
	{ kana: "テゥ", romaji: "tu" },
	{ kana: "テュ", romaji: "tyu" },
	{ kana: "ディ", romaji: "di" },
	{ kana: "デゥ", romaji: "du" },
	{ kana: "デュ", romaji: "dyu" },
	{ kana: "ニャ", romaji: "nya" },
	{ kana: "ニュ", romaji: "nyu" },
	{ kana: "ニョ", romaji: "nyo" },
	{ kana: "ヒャ", romaji: "hya" },
	{ kana: "ヒュ", romaji: "hyu" },
	{ kana: "ヒョ", romaji: "hyo" },
	{ kana: "ビャ", romaji: "bya" },
	{ kana: "ビュ", romaji: "byu" },
	{ kana: "ビョ", romaji: "byo" },
	{ kana: "ピャ", romaji: "pya" },
	{ kana: "ピュ", romaji: "pyu" },
	{ kana: "ピョ", romaji: "pyo" },
	{ kana: "ファ", romaji: "fa" },
	{ kana: "フィ", romaji: "fi" },
	{ kana: "フェ", romaji: "fe" },
	{ kana: "フォ", romaji: "fo" },
	{ kana: "フュ", romaji: "fyu" },
	{ kana: "ミャ", romaji: "mya" },
	{ kana: "ミュ", romaji: "myu" },
	{ kana: "ミョ", romaji: "myo" },
	{ kana: "リャ", romaji: "rya" },
	{ kana: "リュ", romaji: "ryu" },
	{ kana: "リョ", romaji: "ryo" },
	{ kana: "ツァ", romaji: "tsa" },
	{ kana: "ツィ", romaji: "tsi" },
	{ kana: "ツェ", romaji: "tse" },
	{ kana: "ツォ", romaji: "tso" },
	{ kana: "ウィ", romaji: "wi" },
	{ kana: "ウェ", romaji: "we" },
	{ kana: "ウォ", romaji: "wo" },
	{ kana: "イェ", romaji: "ye" },
	{ kana: "ヴァ", romaji: "va" },
	{ kana: "ヴィ", romaji: "vi" },
	{ kana: "ヴェ", romaji: "ve" },
	{ kana: "ヴォ", romaji: "vo" },
	{ kana: "ヴャ", romaji: "vya" },
	{ kana: "ヴュ", romaji: "vyu" },
	{ kana: "ヴョ", romaji: "vyo" },

	// ── Single-codepoint kana ──────────────────────────────────────────────────

	// Hiragana vowels (small + full)
	{ kana: "ぁ", romaji: "a" },
	{ kana: "あ", romaji: "a" },
	{ kana: "ぃ", romaji: "i" },
	{ kana: "い", romaji: "i" },
	{ kana: "ぅ", romaji: "u" },
	{ kana: "う", romaji: "u" },
	{ kana: "ぇ", romaji: "e" },
	{ kana: "え", romaji: "e" },
	{ kana: "ぉ", romaji: "o" },
	{ kana: "お", romaji: "o" },

	// Hiragana k-row
	{ kana: "か", romaji: "ka" },
	{ kana: "が", romaji: "ga" },
	{ kana: "き", romaji: "ki" },
	{ kana: "ぎ", romaji: "gi" },
	{ kana: "く", romaji: "ku" },
	{ kana: "ぐ", romaji: "gu" },
	{ kana: "け", romaji: "ke" },
	{ kana: "げ", romaji: "ge" },
	{ kana: "こ", romaji: "ko" },
	{ kana: "ご", romaji: "go" },

	// Hiragana s-row
	{ kana: "さ", romaji: "sa" },
	{ kana: "ざ", romaji: "za" },
	{ kana: "し", romaji: "shi" },
	{ kana: "じ", romaji: "ji" },
	{ kana: "す", romaji: "su" },
	{ kana: "ず", romaji: "zu" },
	{ kana: "せ", romaji: "se" },
	{ kana: "ぜ", romaji: "ze" },
	{ kana: "そ", romaji: "so" },
	{ kana: "ぞ", romaji: "zo" },

	// Hiragana t-row
	{ kana: "た", romaji: "ta" },
	{ kana: "だ", romaji: "da" },
	{ kana: "ち", romaji: "chi" },
	{ kana: "ぢ", romaji: "ji" },
	{ kana: "っ", romaji: "c" },
	{ kana: "っ", romaji: "k" },
	{ kana: "っ", romaji: "p" },
	{ kana: "っ", romaji: "s" },
	{ kana: "っ", romaji: "t" },
	{ kana: "つ", romaji: "tsu" },
	{ kana: "づ", romaji: "zu" },
	{ kana: "て", romaji: "te" },
	{ kana: "で", romaji: "de" },
	{ kana: "と", romaji: "to" },
	{ kana: "ど", romaji: "do" },

	// Hiragana n-row
	{ kana: "な", romaji: "na" },
	{ kana: "に", romaji: "ni" },
	{ kana: "ぬ", romaji: "nu" },
	{ kana: "ね", romaji: "ne" },
	{ kana: "の", romaji: "no" },

	// Hiragana h-row
	{ kana: "は", romaji: "ha" },
	{ kana: "は", romaji: "wa" },
	{ kana: "ば", romaji: "ba" },
	{ kana: "ぱ", romaji: "pa" },
	{ kana: "ひ", romaji: "hi" },
	{ kana: "び", romaji: "bi" },
	{ kana: "ぴ", romaji: "pi" },
	{ kana: "ふ", romaji: "fu" },
	{ kana: "ぶ", romaji: "bu" },
	{ kana: "ぷ", romaji: "pu" },
	{ kana: "へ", romaji: "he" },
	{ kana: "へ", romaji: "e" },
	{ kana: "べ", romaji: "be" },
	{ kana: "ぺ", romaji: "pe" },
	{ kana: "ほ", romaji: "ho" },
	{ kana: "ぼ", romaji: "bo" },
	{ kana: "ぽ", romaji: "po" },

	// Hiragana m-row
	{ kana: "ま", romaji: "ma" },
	{ kana: "み", romaji: "mi" },
	{ kana: "む", romaji: "mu" },
	{ kana: "め", romaji: "me" },
	{ kana: "も", romaji: "mo" },

	// Hiragana y-row
	{ kana: "や", romaji: "ya" },
	{ kana: "ゆ", romaji: "yu" },
	{ kana: "よ", romaji: "yo" },

	// Hiragana r-row
	{ kana: "ら", romaji: "ra" },
	{ kana: "り", romaji: "ri" },
	{ kana: "る", romaji: "ru" },
	{ kana: "れ", romaji: "re" },
	{ kana: "ろ", romaji: "ro" },

	// Hiragana w-row / special
	{ kana: "わ", romaji: "wa" },
	{ kana: "ゐ", romaji: "wi" },
	{ kana: "ゑ", romaji: "we" },
	{ kana: "を", romaji: "wo" },
	{ kana: "ん", romaji: "n" },
	{ kana: "ん", romaji: "m" },

	// Katakana vowels (small + full)
	{ kana: "ァ", romaji: "a" },
	{ kana: "ア", romaji: "a" },
	{ kana: "ィ", romaji: "i" },
	{ kana: "イ", romaji: "i" },
	{ kana: "ゥ", romaji: "u" },
	{ kana: "ウ", romaji: "u" },
	{ kana: "ェ", romaji: "e" },
	{ kana: "エ", romaji: "e" },
	{ kana: "ォ", romaji: "o" },
	{ kana: "オ", romaji: "o" },

	// Katakana k-row
	{ kana: "カ", romaji: "ka" },
	{ kana: "ガ", romaji: "ga" },
	{ kana: "キ", romaji: "ki" },
	{ kana: "ギ", romaji: "gi" },
	{ kana: "ク", romaji: "ku" },
	{ kana: "グ", romaji: "gu" },
	{ kana: "ケ", romaji: "ke" },
	{ kana: "ゲ", romaji: "ge" },
	{ kana: "コ", romaji: "ko" },
	{ kana: "ゴ", romaji: "go" },

	// Katakana s-row
	{ kana: "サ", romaji: "sa" },
	{ kana: "ザ", romaji: "za" },
	{ kana: "シ", romaji: "shi" },
	{ kana: "ジ", romaji: "ji" },
	{ kana: "ス", romaji: "su" },
	{ kana: "ズ", romaji: "zu" },
	{ kana: "セ", romaji: "se" },
	{ kana: "ゼ", romaji: "ze" },
	{ kana: "ソ", romaji: "so" },
	{ kana: "ゾ", romaji: "zo" },

	// Katakana t-row
	{ kana: "タ", romaji: "ta" },
	{ kana: "ダ", romaji: "da" },
	{ kana: "チ", romaji: "chi" },
	{ kana: "ヂ", romaji: "ji" },
	{ kana: "ッ", romaji: "c" },
	{ kana: "ッ", romaji: "k" },
	{ kana: "ッ", romaji: "p" },
	{ kana: "ッ", romaji: "s" },
	{ kana: "ッ", romaji: "t" },
	{ kana: "ツ", romaji: "tsu" },
	{ kana: "ヅ", romaji: "zu" },
	{ kana: "テ", romaji: "te" },
	{ kana: "デ", romaji: "de" },
	{ kana: "ト", romaji: "to" },
	{ kana: "ド", romaji: "do" },

	// Katakana n-row
	{ kana: "ナ", romaji: "na" },
	{ kana: "ニ", romaji: "ni" },
	{ kana: "ヌ", romaji: "nu" },
	{ kana: "ネ", romaji: "ne" },
	{ kana: "ノ", romaji: "no" },

	// Katakana h-row
	{ kana: "ハ", romaji: "ha" },
	{ kana: "バ", romaji: "ba" },
	{ kana: "パ", romaji: "pa" },
	{ kana: "ヒ", romaji: "hi" },
	{ kana: "ビ", romaji: "bi" },
	{ kana: "ピ", romaji: "pi" },
	{ kana: "フ", romaji: "fu" },
	{ kana: "ブ", romaji: "bu" },
	{ kana: "プ", romaji: "pu" },
	{ kana: "ヘ", romaji: "he" },
	{ kana: "ベ", romaji: "be" },
	{ kana: "ペ", romaji: "pe" },
	{ kana: "ホ", romaji: "ho" },
	{ kana: "ボ", romaji: "bo" },
	{ kana: "ポ", romaji: "po" },

	// Katakana m-row
	{ kana: "マ", romaji: "ma" },
	{ kana: "ミ", romaji: "mi" },
	{ kana: "ム", romaji: "mu" },
	{ kana: "メ", romaji: "me" },
	{ kana: "モ", romaji: "mo" },

	// Katakana y-row
	{ kana: "ヤ", romaji: "ya" },
	{ kana: "ユ", romaji: "yu" },
	{ kana: "ヨ", romaji: "yo" },

	// Katakana r-row
	{ kana: "ラ", romaji: "ra" },
	{ kana: "リ", romaji: "ri" },
	{ kana: "ル", romaji: "ru" },
	{ kana: "レ", romaji: "re" },
	{ kana: "ロ", romaji: "ro" },

	// Katakana w-row / special
	{ kana: "ワ", romaji: "wa" },
	{ kana: "ヰ", romaji: "wi" },
	{ kana: "ヱ", romaji: "we" },
	{ kana: "ヲ", romaji: "wo" },
	{ kana: "ン", romaji: "n" },
	{ kana: "ン", romaji: "m" },
	{ kana: "ヴ", romaji: "vu" },

	// Long vowel mark — can represent any vowel prolongation
	{ kana: "ー", romaji: "a" },
	{ kana: "ー", romaji: "e" },
	{ kana: "ー", romaji: "i" },
	{ kana: "ー", romaji: "o" },
	{ kana: "ー", romaji: "u" },
];
