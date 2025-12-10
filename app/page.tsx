"use client";

import { Github, Music } from 'lucide-react';
import { useState } from "react";
import { ResultPreview } from "@/components/ResultPreview";
import { SplitOptions } from "@/components/SplitOptions";
import { TextInput } from "@/components/TextInput";
import { processAssFile, type SplitMode } from "@/lib/ksplitter";

export default function Home() {
	const [fileContent, setFileContent] = useState<string>("");
	const [filename, _setFilename] = useState<string>("karaoke.ass");
	const [mode, setMode] = useState<SplitMode>("syl");
	const [selector, setSelector] = useState<"all" | "actor" | "style">("all");
	const [selectorValue, setSelectorValue] = useState<string>("");
	const [processedContent, setProcessedContent] = useState<string | null>(null);

	const handleProcess = () => {
		if (!fileContent.trim()) return;

		const result = processAssFile(fileContent, {
			mode,
			selector,
			selectorValue,
		});
		setProcessedContent(result);
	};

	return (
		<main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
			<div className="max-w-4xl mx-auto">
				<div className="absolute top-4 right-4 flex items-center gap-4">
					<a
						href="https://github.com/Aruh1/karasplitter-web"
						target="_blank"
						rel="noopener noreferrer"
						className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
						aria-label="GitHub Repository"
					>
						<Github className="w-5 h-5" />
					</a>
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
								}}
							/>
						</div>

						{processedContent && (
							<ResultPreview
								originalFilename={filename}
								processedContent={processedContent}
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
