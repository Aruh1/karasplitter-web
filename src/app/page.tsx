"use client";

import { Music, Library, HelpCircle } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={className}
		>
			<title>GitHub</title>
			<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
		</svg>
	);
}
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
	type SplitMode,
} from "@/lib/ksplitter";
import type { SelectorType, KTimeOption, AppMode } from "@/lib/types";
import { processKanjiTimer } from "@/lib/kanjitimer";

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
							<GithubIcon className="w-5 h-5" />
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
