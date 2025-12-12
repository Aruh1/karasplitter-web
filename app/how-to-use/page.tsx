import Link from "next/link";
import { ArrowLeft, Book, HelpCircle, FileText } from "lucide-react";

export default function HowToUse() {
	return (
		<main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
			<div className="max-w-3xl mx-auto">
				{/* Back Button */}
				<div className="mb-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-blue-50 transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Home
					</Link>
				</div>

				{/* Header */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
					<div className="bg-blue-600 p-8 text-center text-white">
						<HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
						<h1 className="text-3xl font-bold mb-2">How to Use</h1>
						<p className="text-blue-100 text-lg">
							Everything you need to know about Karasplitter Web
						</p>
					</div>
				</div>

				{/* Content */}
				<div className="space-y-6">
					{/* About Section */}
					<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
						<div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
							<div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
								<Book className="w-6 h-6" />
							</div>
							<h2 className="text-xl font-bold text-gray-900">
								About Karasplitter
							</h2>
						</div>
						<div className="prose prose-blue max-w-none text-gray-600">
							<p>
								Karasplitter Web is a specialized tool designed for karaoke
								timing. It automates the process of splitting karaoke lines in{" "}
								<strong>.ass</strong> (Advanced Substation Alpha) subtitle
								files.
							</p>
							<p className="mt-2">
								Instead of manually timing every syllable, you can paste your
								Dialogue lines, and this tool will automatically calculate and
								insert <code>{"{\\k}"}</code> tags based on the line duration
								and your chosen split mode (Syllables, Words, or Characters).
							</p>
						</div>
					</div>

					{/* How to Use Section */}
					<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
						<div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
							<div className="p-2 bg-green-100 text-green-600 rounded-lg">
								<FileText className="w-6 h-6" />
							</div>
							<h2 className="text-xl font-bold text-gray-900">How to Use</h2>
						</div>

						<div className="space-y-6">
							<div className="flex gap-4">
								<div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
									1
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-1">
										Paste Content
									</h3>
									<p className="text-gray-600 text-sm">
										Copy the lines starting with <code>Dialogue:</code> or{" "}
										<code>Comment:</code> from your .ass file and paste them
										into the text input area.
									</p>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
									2
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-1">
										Configure Metadata
									</h3>
									<p className="text-gray-600 text-sm">
										The tool automatically detects <strong>Actors</strong> and{" "}
										<strong>Styles</strong> from your pasted content. You can
										use the dropdowns to filter which lines to process (e.g.,
										only lines with the "Default" style or specific actor).
									</p>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
									3
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-1">
										Select Split Mode
									</h3>
									<p className="text-gray-600 text-sm">
										Choose how you want to split the lyrics:
									</p>
									<ul className="list-disc list-inside text-sm text-gray-600 mt-2 ml-1 space-y-1">
										<li>
											<strong>Syllables (syl)</strong>: Smarter splitting based
											on Japanese romaji rules (e.g., "ka", "shi", "tsu").
										</li>
										<li>
											<strong>Words</strong>: Splits by whitespace.
										</li>
										<li>
											<strong>Characters (char)</strong>: Splits every single
											character.
										</li>
									</ul>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
									4
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-1">Process</h3>
									<p className="text-gray-600 text-sm">
										Click the <strong>Process Content</strong> button. The
										result will appear below the input area, complete with
										timing tags.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
