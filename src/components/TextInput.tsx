"use client";

import { FileText, Upload, Clipboard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRef, useState } from "react";

type InputMode = "paste" | "file";

interface TextInputProps {
	value: string;
	onChange: (value: string) => void;
}

export function TextInput({ value, onChange }: TextInputProps) {
	const [inputMode, setInputMode] = useState<InputMode>("paste");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file extension
		const validExtensions = [".ass", ".ssa"];
		const fileName = file.name.toLowerCase();
		const isValidFile = validExtensions.some((ext) => fileName.endsWith(ext));

		if (!isValidFile) {
			alert("Please select a valid .ass or .ssa file.");
			e.target.value = "";
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const content = event.target?.result as string;
			onChange(content);
			// Switch to paste mode after successful file load
			setInputMode("paste");
		};
		reader.onerror = () => {
			alert("Error reading file. Please try again.");
		};
		reader.readAsText(file);
	};

	const handleModeChange = (mode: InputMode) => {
		setInputMode(mode);
		if (mode === "file") {
			fileInputRef.current?.click();
		}
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (!file) return;

		const validExtensions = [".ass", ".ssa"];
		const fileName = file.name.toLowerCase();
		const isValidFile = validExtensions.some((ext) => fileName.endsWith(ext));

		if (!isValidFile) {
			alert("Please select a valid .ass or .ssa file.");
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const content = event.target?.result as string;
			onChange(content);
			// Switch to paste mode after successful file load
			setInputMode("paste");
		};
		reader.onerror = () => {
			alert("Error reading file. Please try again.");
		};
		reader.readAsText(file);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	return (
		<div className="w-full space-y-3">
			<div className="flex items-center justify-between gap-4">
				<Label htmlFor="ass-input" className="text-base font-semibold">
					{inputMode === "paste" ? "Paste Content" : "Upload File"}
				</Label>
				<Select
					value={inputMode}
					onValueChange={(v) => handleModeChange(v as InputMode)}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select input mode" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="paste">
							<div className="flex items-center gap-2">
								<Clipboard className="w-4 h-4" />
								<span>Paste Content</span>
							</div>
						</SelectItem>
						<SelectItem value="file">
							<div className="flex items-center gap-2">
								<Upload className="w-4 h-4" />
								<span>Upload File</span>
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".ass,.ssa"
				onChange={handleFileSelect}
				className="hidden"
			/>

			{inputMode === "paste" ? (
				<div className="relative">
					<Textarea
						id="ass-input"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,kinou yori mo"
						className="h-64 font-mono text-sm resize-y"
					/>
					<div className="absolute top-3 right-3 pointer-events-none text-[hsl(var(--muted-foreground))]">
						<FileText className="w-5 h-5" />
					</div>
				</div>
			) : (
				<div
					className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg h-64 flex flex-col items-center justify-center gap-4 bg-[hsl(var(--accent))]/30 hover:bg-[hsl(var(--accent))]/50 transition-colors cursor-pointer"
					onClick={() => fileInputRef.current?.click()}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
				>
					<div className="p-4 bg-[hsl(var(--primary))]/10 rounded-full">
						<Upload className="w-8 h-8 text-[hsl(var(--primary))]" />
					</div>
					<div className="text-center">
						<p className="font-medium text-[hsl(var(--foreground))]">
							Drag & drop your file here
						</p>
						<p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
							or click to browse
						</p>
					</div>
					<p className="text-xs text-[hsl(var(--muted-foreground))]">
						Supported formats: .ass, .ssa
					</p>
				</div>
			)}

			<p className="text-xs text-[hsl(var(--muted-foreground))]">
				{inputMode === "paste"
					? "Copy the entire content of your .ass file and paste it above."
					: "Upload your .ass or .ssa subtitle file."}
			</p>
		</div>
	);
}
