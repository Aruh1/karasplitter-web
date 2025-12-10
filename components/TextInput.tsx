import { FileText } from "lucide-react";

interface TextInputProps {
	value: string;
	onChange: (value: string) => void;
}

export function TextInput({ value, onChange }: TextInputProps) {
	return (
		<div className="w-full space-y-2">
			<label
				htmlFor="ass-input"
				className="block text-sm font-medium text-gray-700"
			>
				Paste .ass file content here
			</label>
			<div className="relative">
				<textarea
					id="ass-input"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="[Script Info]..."
					className="w-full h-64 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-y text-black"
				/>
				<div className="absolute top-3 right-3 text-gray-400 pointer-events-none">
					<FileText className="w-5 h-5" />
				</div>
			</div>
			<p className="text-xs text-gray-500">
				Copy the entire content of your .ass file and paste it above.
			</p>
		</div>
	);
}
