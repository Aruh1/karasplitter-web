import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Karasplitter Web - Karaoke Line Splitter",
	description:
		"Split your .ass karaoke lines with ease. A web-based tool for Aegisub karaoke timing.",
	keywords: [
		"karaoke",
		"aegisub",
		"ass",
		"splitter",
		"lyrics",
		"timing",
		"fansub",
	],
	authors: [{ name: "Karasplitter Web" }],
	openGraph: {
		title: "Karasplitter Web",
		description:
			"Split your .ass karaoke lines with ease. A web-based tool for Aegisub karaoke timing.",
		type: "website",
		siteName: "Karasplitter Web",
		images: [
			{
				url: "https://cdn.jsdelivr.net/gh/Aruh1/karasplitter-web@master/public/preview.png",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Karasplitter Web",
		description: "Split your .ass karaoke lines with ease.",
		images: [
			{
				url: "https://cdn.jsdelivr.net/gh/Aruh1/karasplitter-web@master/public/preview.png",
			},
		],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
