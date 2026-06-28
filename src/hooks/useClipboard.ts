"use client";

import { useState, useCallback, useRef } from "react";

interface UseClipboardReturn {
	copied: boolean;
	copyToClipboard: (text: string) => Promise<void>;
	resetCopied: () => void;
}

export function useClipboard(timeout = 2000): UseClipboardReturn {
	const [copied, setCopied] = useState(false);
	const lastCopyTime = useRef(0);

	const copyToClipboard = useCallback(
		async (text: string) => {
			const now = Date.now();
			// Rate limit: prevent rapid successive copies (min 100ms between copies)
			if (now - lastCopyTime.current < 100) {
				return;
			}

			try {
				await navigator.clipboard.writeText(text);
				lastCopyTime.current = now;
				setCopied(true);
				setTimeout(() => setCopied(false), timeout);
			} catch (err) {
				console.error("Failed to copy text: ", err);
			}
		},
		[timeout],
	);

	const resetCopied = useCallback(() => {
		setCopied(false);
	}, []);

	return { copied, copyToClipboard, resetCopied };
}
