import type { SplitMode } from "@/lib/ksplitter";

interface SplitOptionsProps {
	mode: SplitMode;
	setMode: (mode: SplitMode) => void;
	selector: "all" | "actor" | "style";
	setSelector: (selector: "all" | "actor" | "style") => void;
	selectorValue: string;
	setSelectorValue: (value: string) => void;
}

export function SplitOptions({
	mode,
	setMode,
	selector,
	setSelector,
	selectorValue,
	setSelectorValue,
}: SplitOptionsProps) {
	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-3 text-gray-800">
					Splitting Mode
				</h3>
				<div className="flex flex-wrap gap-4">
					{(["syl", "char", "word"] as SplitMode[]).map((m) => (
						<label
							key={m}
							className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
						>
							<input
								type="radio"
								name="mode"
								value={m}
								checked={mode === m}
								onChange={() => setMode(m)}
								className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
							/>
							<span className="capitalize text-gray-700">
								{m === "syl"
									? "Syllables (Romaji)"
									: m === "char"
										? "Characters"
										: "Words"}
							</span>
						</label>
					))}
				</div>
			</div>

			<div>
				<h3 className="text-lg font-semibold mb-3 text-gray-800">
					Filter Lines
				</h3>
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap gap-4">
						{(["all", "actor", "style"] as const).map((s) => (
							<label
								key={s}
								className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
							>
								<input
									type="radio"
									name="selector"
									value={s}
									checked={selector === s}
									onChange={() => setSelector(s)}
									className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
								/>
								<span className="capitalize text-gray-700">{s}</span>
							</label>
						))}
					</div>

					{selector !== "all" && (
						<div>
							<input
								type="text"
								value={selectorValue}
								onChange={(e) => setSelectorValue(e.target.value)}
								placeholder={`Enter ${selector} name...`}
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
