"use client";

import { Github, Music, Library, HelpCircle } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ResultPreview } from "@/components/ResultPreview";
import { SplitOptions } from "@/components/SplitOptions";
import { TextInput } from "@/components/TextInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	extractActorsAndStyles,
	processAssFile,
	parseSourceSyllables,
	createKanjiTimerState,
	acceptMatch,
	getOutputLine,
	isComplete,
	type SplitMode,
} from "@/lib/ksplitter";
import type { SelectorType, KTimeOption, AppMode } from "@/lib/types";

/**
 * Process Kanji Timer: Transfer timing from source style lines to destination style lines.
 * Uses 1:1 auto-matching when syllable count equals character count.
 */
function processKanjiTimer(
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

		// Parse source syllables and strip destination text
		const sourceSyllables = parseSourceSyllables(srcLine.text);
		if (sourceSyllables.length === 0) continue;

		// Strip tags from destination to get plain text
		const destText = dstLine.text.replace(/\{[^}]*\}/g, "");
		if (!destText.trim()) continue;

		// Create state and attempt auto-matching
		let state = createKanjiTimerState(srcLine.text, destText);

		// Try to auto-match: if source syllables == destination chars, do 1:1
		// Otherwise, match all syllables to all destination chars
		while (state.unmatchedSource.length > 0) {
			const nextState = acceptMatch(state);
			if (!nextState) break;
			state = nextState;
		}

		// Generate output if complete
		if (isComplete(state)) {
			const output = getOutputLine(state);

			// Reconstruct the dialogue line
			const originalLine = processedLines[dstLine.index];
			const parts = originalLine.split(",");
			if (parts.length >= 10) {
				const prefix = parts.slice(0, 9).join(",") + ",";
				processedLines[dstLine.index] = prefix + output;
				successCount++;
			}
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

export default function Home() {
	const [fileContent, setFileContent] = useState<string>("");
	const [appMode, setAppMode] = useState<AppMode>("splitter");
	const [mode, setMode] = useState<SplitMode>("syl");
	const [selector, setSelector] = useState<SelectorType>("all");
	const [selectorValue, setSelectorValue] = useState<string>("");
	const [processedContent, setProcessedContent] = useState<string | null>(null);
	const [cleanKTime, setCleanKTime] = useState<boolean>(false);
	const [kTimeOption, setKTimeOption] = useState<KTimeOption>("calculated");
	const [error, setError] = useState<string | null>(null);

	// Kanji Timer specific state
	const [sourceStyle, setSourceStyle] = useState<string>("");
	const [destStyle, setDestStyle] = useState<string>("");

	const metadata = useMemo(() => {
		if (!fileContent.trim()) {
			return { actors: [], styles: [] };
		}
		return extractActorsAndStyles(fileContent);
	}, [fileContent]);

	const handleProcess = () => {
		if (!fileContent) return;

		if (appMode === "kanjitimer") {
			const result = processKanjiTimer(fileContent, sourceStyle, destStyle);
			setProcessedContent(result.content);
			setError(result.error);
		} else {
			const result = processAssFile(fileContent, {
				mode,
				selector,
				selectorValue,
				cleanKTime,
				kTimeOption,
			});
			setProcessedContent(result.content);
			setError(result.error);
		}
	};

	const handleContentChange = (val: string) => {
		setFileContent(val);
		setProcessedContent(null);
		setError(null);
		setSelectorValue("");
		setSourceStyle("");
		setDestStyle("");
	};

	const isProcessDisabled = () => {
		if (!fileContent.trim()) return true;
		if (appMode === "kanjitimer") {
			return !sourceStyle || !destStyle || sourceStyle === destStyle;
		}
		return false;
	};

	return (
		<main
			id="main-content"
			className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans bg-[hsl(var(--background))]"
		>
			<div className="max-w-4xl mx-auto">
				<div className="absolute top-4 left-4 flex items-center gap-4">
					<Button variant="ghost" asChild>
						<Link
							href="/how-to-use"
							className="flex items-center gap-2"
							aria-label="How to use"
						>
							<HelpCircle className="w-5 h-5" />
							<span className="hidden sm:inline">How to use</span>
						</Link>
					</Button>
					<Button variant="ghost" asChild>
						<Link
							href="https://kfx.kazeuta.com"
							className="flex items-center gap-2"
							aria-label="Showcase KaraFX Indonesia"
						>
							<Library className="w-5 h-5" />
							<span className="hidden sm:inline">
								Showcase KaraFX Indonesia
							</span>
						</Link>
					</Button>
				</div>

				<div className="absolute top-4 right-4 flex items-center gap-2">
					<ThemeToggle />
					<Button variant="ghost" size="icon" asChild>
						<Link
							href="https://github.com/Yurasubs/karasplitter-web"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="GitHub Repository"
						>
							<Github className="w-5 h-5" />
						</Link>
					</Button>
					<span className="font-medium text-xs text-[hsl(var(--muted-foreground))]">
						[{process.env.GIT_COMMIT_HASH || "development"}]
					</span>
				</div>

				<div className="text-center mb-10">
					<div className="flex justify-center mb-4">
						<div className="p-3 bg-[hsl(var(--primary))] rounded-full shadow-lg">
							<Music className="w-8 h-8 text-white" />
						</div>
					</div>
					<h1 className="text-4xl font-extrabold tracking-tight mb-2 text-[hsl(var(--foreground))]">
						Karasplitter Web
					</h1>
					<p className="text-lg text-[hsl(var(--muted-foreground))]">
						{appMode === "kanjitimer"
							? "Transfer karaoke timing from Romaji to Kanji lines."
							: "Split your .ass karaoke lines with ease."}
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-6">
						<Card>
							<CardContent className="pt-6">
								<TextInput value={fileContent} onChange={handleContentChange} />
							</CardContent>
						</Card>
						{(processedContent || error) && (
							<ResultPreview
								processedContent={processedContent || ""}
								error={error}
							/>
						)}
					</div>

					<div className="space-y-6">
						<SplitOptions
							appMode={appMode}
							setAppMode={setAppMode}
							mode={mode}
							setMode={setMode}
							selector={selector}
							setSelector={setSelector}
							selectorValue={selectorValue}
							setSelectorValue={setSelectorValue}
							actorOptions={metadata.actors}
							styleOptions={metadata.styles}
							cleanKTime={cleanKTime}
							setCleanKTime={setCleanKTime}
							kTimeOption={kTimeOption}
							setKTimeOption={setKTimeOption}
							sourceStyle={sourceStyle}
							setSourceStyle={setSourceStyle}
							destStyle={destStyle}
							setDestStyle={setDestStyle}
						/>

						<Button
							onClick={handleProcess}
							disabled={isProcessDisabled()}
							className="w-full py-3 px-4 text-lg h-auto"
							size="lg"
						>
							{appMode === "kanjitimer" ? "Apply Timing" : "Process Content"}
						</Button>
					</div>
				</div>
			</div>
		</main>
	);
}
