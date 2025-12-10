import { Check, Copy, FileCheck } from "lucide-react";
import { useState } from "react";

interface ResultPreviewProps {
	originalFilename: string;
	processedContent: string;
}

export function ResultPreview({ processedContent }: ResultPreviewProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(processedContent);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
			<div className="flex items-center justify-between mb-4 flex-wrap gap-4">
				<div className="flex items-center gap-2 text-green-600">
					<FileCheck className="w-6 h-6" />
					<span className="font-semibold">Processing Complete</span>
				</div>
				<button
					type="button"
					onClick={handleCopy}
					className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md active:scale-95 transform"
				>
					{copied ? (
						<Check className="w-4 h-4" />
					) : (
						<Copy className="w-4 h-4" />
					)}
					{copied ? "Copied!" : "Copy to Clipboard"}
				</button>
			</div>

			<div className="mt-4">
				<h4 className="text-sm font-medium text-gray-500 mb-2">
					Preview (First 20 lines)
				</h4>
				<pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono max-h-96 whitespace-pre-wrap break-all">
					{processedContent.split("\n").slice(0, 20).join("\n")}
					{processedContent.split("\n").length > 20 && "\n..."}
				</pre>
			</div>
		</div>
	);
}
