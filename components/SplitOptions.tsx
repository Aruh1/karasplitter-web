import type { SplitMode } from "@/lib/ksplitter";

interface SplitOptionsProps {
	mode: SplitMode;
	setMode: (mode: SplitMode) => void;
	selector: "all" | "actor" | "style";
	setSelector: (selector: "all" | "actor" | "style") => void;
	selectorValue: string;
	setSelectorValue: (value: string) => void;
	actorOptions: string[];
	styleOptions: string[];
	cleanKTime: boolean;
	setCleanKTime: (enabled: boolean) => void;
}

export function SplitOptions({
	mode,
	setMode,
	selector,
	setSelector,
	selectorValue,
	setSelectorValue,
	actorOptions,
	styleOptions,
	cleanKTime,
	setCleanKTime,
}: SplitOptionsProps) {
	const currentOptions = selector === "actor" ? actorOptions : styleOptions;
	const hasOptions = currentOptions.length > 0;

	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-3 text-gray-800">
					Splitting Mode
				</h3>
				<div
					className={`flex flex-wrap gap-4 transition-opacity ${cleanKTime ? "opacity-50 pointer-events-none" : ""}`}
				>
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

			<div
				className={`p-2 rounded-lg transition-colors ${cleanKTime ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}
			>
				<label className="flex items-center justify-between cursor-pointer group">
					<div>
						<span
							className={`font-small block ${cleanKTime ? "text-blue-900" : "text-gray-700"}`}
						>
							Cleaner (De-Ktime)
						</span>
					</div>
					<div className="relative">
						<input
							type="checkbox"
							checked={cleanKTime}
							onChange={(e) => setCleanKTime(e.target.checked)}
							className="sr-only peer"
						/>
						<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
					</div>
				</label>
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

					{selector !== "all" && hasOptions && (
						<div>
							<select
								value={selectorValue}
								onChange={(e) => setSelectorValue(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black bg-white cursor-pointer"
							>
								<option value="">Select {selector}...</option>
								{currentOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</div>
					)}

					{selector !== "all" && !hasOptions && (
						<p className="text-sm text-gray-500 italic">
							No {selector}s found. Check your .ass content.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
