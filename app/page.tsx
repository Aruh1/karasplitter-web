"use client";

import { Github, Music, HelpCircle } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ResultPreview } from "@/components/ResultPreview";
import { SplitOptions } from "@/components/SplitOptions";
import { TextInput } from "@/components/TextInput";
import {
	extractActorsAndStyles,
	processAssFile,
	type SplitMode,
} from "@/lib/ksplitter";

export default function Home() {
	const [fileContent, setFileContent] = useState<string>("");
	const [filename, _setFilename] = useState<string>("karaoke.ass");
	const [mode, setMode] = useState<SplitMode>("syl");
	const [selector, setSelector] = useState<"all" | "actor" | "style">("all");
	const [selectorValue, setSelectorValue] = useState<string>("");
	const [processedContent, setProcessedContent] = useState<string | null>(null);
	const [cleanKTime, setCleanKTime] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Extract actors and styles from pasted content
	const metadata = useMemo(() => {
		if (!fileContent.trim()) {
			return { actors: [], styles: [] };
		}
		return extractActorsAndStyles(fileContent);
	}, [fileContent]);

	const handleProcess = () => {
		if (!fileContent) return;
		const result = processAssFile(fileContent, {
			mode,
			selector,
			selectorValue,
			cleanKTime,
		});
		setProcessedContent(result.content);
		setError(result.error);
	};

	return (
		<main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
			<div className="max-w-4xl mx-auto">
				<div className="absolute top-4 left-4 flex items-center gap-4">
					<Link
						href="/how-to-use"
						className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 font-medium"
						aria-label="How to use"
					>
						<HelpCircle className="w-5 h-5" />
						<span className="hidden sm:inline">How to use</span>
					</Link>
				</div>

				<div className="absolute top-4 right-4 flex items-center gap-4">
					<a
						href="https://github.com/Aruh1/karasplitter-web"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 font-medium"
						aria-label="GitHub Repository"
					>
						<Github className="w-5 h-5" />
					</a>
					<span className="text-gray-500 font-medium text-xs">
						[{process.env.GIT_COMMIT_HASH || "development"}]
					</span>
				</div>

				<div className="text-center mb-10">
					<div className="flex justify-center mb-4">
						<div className="p-3 bg-blue-600 rounded-full shadow-lg">
							<Music className="w-8 h-8 text-white" />
						</div>
					</div>
					<h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
						Karasplitter Web
					</h1>
					<p className="text-lg text-gray-600">
						Split your .ass karaoke lines with ease.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-6">
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
							<TextInput
								value={fileContent}
								onChange={(val) => {
									setFileContent(val);
									setProcessedContent(null);
									setError(null);
									// Reset selector value when content changes
									setSelectorValue("");
								}}
							/>
						</div>
						{(processedContent || error) && (
							<ResultPreview
								processedContent={processedContent || ""}
								error={error}
							/>
						)}
					</div>

					<div className="space-y-6">
						<SplitOptions
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
						/>

						<button
							type="button"
							onClick={handleProcess}
							disabled={!fileContent.trim()}
							className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-md transition-colors text-lg"
						>
							Process Content
						</button>
					</div>
				</div>
			</div>
		</main>
	);
}
