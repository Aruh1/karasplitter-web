"use client";

import type { SplitMode } from "@/lib/ksplitter";
import type { SelectorType, KTimeOption, AppMode } from "@/lib/types";
import {
	SPLIT_MODE_LABELS,
	K_TIME_OPTION_LABELS,
	APP_MODE_LABELS,
} from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface SplitOptionsProps {
	appMode: AppMode;
	setAppMode: (mode: AppMode) => void;
	mode: SplitMode;
	setMode: (mode: SplitMode) => void;
	selector: SelectorType;
	setSelector: (selector: SelectorType) => void;
	selectorValue: string;
	setSelectorValue: (value: string) => void;
	actorOptions: string[];
	styleOptions: string[];
	cleanKTime: boolean;
	setCleanKTime: (enabled: boolean) => void;
	kTimeOption: KTimeOption;
	setKTimeOption: (option: KTimeOption) => void;
	// Kanji Timer specific
	sourceStyle: string;
	setSourceStyle: (style: string) => void;
	destStyle: string;
	setDestStyle: (style: string) => void;
}

const SPLIT_MODES: SplitMode[] = ["syl", "char", "word"];
const SELECTOR_TYPES: SelectorType[] = ["all", "actor", "style"];
const K_TIME_OPTIONS: KTimeOption[] = ["calculated", "k1"];
const APP_MODES: AppMode[] = ["splitter", "kanjitimer"];

export function SplitOptions({
	appMode,
	setAppMode,
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
	kTimeOption,
	setKTimeOption,
	sourceStyle,
	setSourceStyle,
	destStyle,
	setDestStyle,
}: SplitOptionsProps) {
	const currentOptions = selector === "actor" ? actorOptions : styleOptions;
	const hasOptions = currentOptions.length > 0;
	const showKTimeOption = (mode === "char" || mode === "word") && !cleanKTime;
	const isSplitterMode = appMode === "splitter";
	const isKanjiTimerMode = appMode === "kanjitimer";

	return (
		<Card>
			<CardContent className="pt-6 space-y-6">
				{/* App Mode Selector */}
				<div>
					<h2 className="text-lg font-semibold mb-3 text-[hsl(var(--foreground))]">
						Mode
					</h2>
					<RadioGroup
						value={appMode}
						onValueChange={(val) => setAppMode(val as AppMode)}
						className="flex flex-wrap gap-3"
					>
						{APP_MODES.map((m) => (
							<div
								key={m}
								className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors ${
									appMode === m
										? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
										: "border-[hsl(var(--border))] bg-[hsl(var(--accent))]"
								}`}
							>
								<RadioGroupItem
									value={m}
									id={`appmode-${m}`}
									aria-label={APP_MODE_LABELS[m]}
								/>
								<Label htmlFor={`appmode-${m}`} className="cursor-pointer">
									{APP_MODE_LABELS[m]}
								</Label>
							</div>
						))}
					</RadioGroup>
				</div>

				{/* Kanji Timer Style Selection */}
				{isKanjiTimerMode && (
					<div className="space-y-4">
						<h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
							Style Selection
						</h2>
						<div className="grid grid-cols-1 gap-4">
							<div>
								<Label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">
									Source Style (with timing)
								</Label>
								<Select value={sourceStyle} onValueChange={setSourceStyle}>
									<SelectTrigger>
										<SelectValue placeholder="Select source style..." />
									</SelectTrigger>
									<SelectContent>
										{styleOptions.map((style) => (
											<SelectItem
												key={style}
												value={style}
												disabled={style === destStyle}
											>
												{style}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">
									Destination Style (to apply timing)
								</Label>
								<Select value={destStyle} onValueChange={setDestStyle}>
									<SelectTrigger>
										<SelectValue placeholder="Select destination style..." />
									</SelectTrigger>
									<SelectContent>
										{styleOptions.map((style) => (
											<SelectItem
												key={style}
												value={style}
												disabled={style === sourceStyle}
											>
												{style}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						{styleOptions.length === 0 && (
							<p className="text-sm italic text-[hsl(var(--muted-foreground))]">
								No styles found. Paste your .ass content first.
							</p>
						)}
						{sourceStyle && destStyle && sourceStyle === destStyle && (
							<p className="text-sm text-red-500">
								Source and destination styles must be different.
							</p>
						)}
					</div>
				)}

				{/* Splitter Mode Options */}
				{isSplitterMode && (
					<>
						<div>
							<h2 className="text-lg font-semibold mb-3 text-[hsl(var(--foreground))]">
								Splitting Mode
							</h2>
							<RadioGroup
								value={mode}
								onValueChange={(val) => setMode(val as SplitMode)}
								disabled={cleanKTime}
								className="flex flex-wrap gap-3"
							>
								{SPLIT_MODES.map((m) => (
									<div
										key={m}
										className={`flex items-center space-x-2 px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--accent))] transition-opacity ${
											cleanKTime ? "opacity-50 cursor-not-allowed" : ""
										}`}
									>
										<RadioGroupItem
											value={m}
											id={`mode-${m}`}
											aria-label={SPLIT_MODE_LABELS[m]}
										/>
										<Label
											htmlFor={`mode-${m}`}
											className={
												cleanKTime ? "cursor-not-allowed" : "cursor-pointer"
											}
										>
											{SPLIT_MODE_LABELS[m]}
										</Label>
									</div>
								))}
							</RadioGroup>

							<div
								className={`grid transition-all duration-300 ease-out ${
									showKTimeOption
										? "grid-rows-[1fr] opacity-100"
										: "grid-rows-[0fr] opacity-0"
								}`}
							>
								<div className="overflow-hidden">
									<div className="mt-3">
										<Label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">
											Timing Option
										</Label>
										<Select
											value={kTimeOption}
											onValueChange={(val) =>
												setKTimeOption(val as KTimeOption)
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select timing option..." />
											</SelectTrigger>
											<SelectContent>
												{K_TIME_OPTIONS.map((option) => (
													<SelectItem key={option} value={option}>
														{K_TIME_OPTION_LABELS[option]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</div>

						<div
							className={`flex items-center justify-between p-3 rounded-lg transition-colors ${cleanKTime ? "bg-[hsl(var(--primary))]/10" : "bg-[hsl(var(--accent))]"}`}
						>
							<Label
								htmlFor="clean-ktime"
								className={`cursor-pointer ${cleanKTime ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--foreground))]"}`}
							>
								Cleaner (De-ktime)
							</Label>
							<Switch
								id="clean-ktime"
								checked={cleanKTime}
								onCheckedChange={setCleanKTime}
								aria-label="Toggle cleaner mode (De-ktime)"
							/>
						</div>

						<div>
							<h2 className="text-lg font-semibold mb-3 text-[hsl(var(--foreground))]">
								Filter Lines
							</h2>
							<div className="flex flex-col gap-3">
								<RadioGroup
									value={selector}
									onValueChange={(val) => setSelector(val as SelectorType)}
									className="flex flex-wrap gap-3"
								>
									{SELECTOR_TYPES.map((s) => (
										<div
											key={s}
											className="flex items-center space-x-2 px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--accent))]"
										>
											<RadioGroupItem
												value={s}
												id={`selector-${s}`}
												aria-label={`Filter by ${s}`}
											/>
											<Label
												htmlFor={`selector-${s}`}
												className="cursor-pointer capitalize"
											>
												{s}
											</Label>
										</div>
									))}
								</RadioGroup>

								<div
									className={`grid transition-all duration-300 ease-out ${
										selector !== "all" && hasOptions
											? "grid-rows-[1fr] opacity-100"
											: "grid-rows-[0fr] opacity-0"
									}`}
								>
									<div className="overflow-hidden">
										<div className="mt-3">
											<Select
												value={selectorValue}
												onValueChange={setSelectorValue}
											>
												<SelectTrigger>
													<SelectValue placeholder={`Select ${selector}...`} />
												</SelectTrigger>
												<SelectContent>
													{currentOptions.map((option) => (
														<SelectItem key={option} value={option}>
															{option}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>

								{selector !== "all" && !hasOptions && (
									<p className="text-sm italic text-[hsl(var(--muted-foreground))]">
										No {selector}s found. Check your .ass content.
									</p>
								)}
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
