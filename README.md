# Karasplitter Web

A modern, web-based tool for splitting `.ass` karaoke lines for Aegisub timing. This tool allows you to easily split karaoke lines into syllables, characters, or words, replicating the functionality of the popular `ksplitter` Python script but in a convenient web interface.

![Karasplitter Web Preview](https://cdn.jsdelivr.net/gh/Aruh1/karasplitter-web@master/public/preview.png)

## Features

- **Web-Based**: No need to install Python or run command-line scripts.
- **Multiple Splitting Modes**:
  - **Syllables**: Splits by romaji syllables (e.g., "ka-ra-o-ke").
  - **Characters**: Splits by individual characters (e.g., "k-a-r-a-o-k-e").
  - **Words**: Splits by words (e.g., "karaoke").
- **Smart Filtering**: Filter lines by Actor or Style to only process specific parts of your script.
- **Instant Preview**: See the processed output immediately.
- **Copy to Clipboard**: One-click copy for easy pasting back into Aegisub.
- **Responsive Design**: Works on desktop and mobile.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Tooling**: [Biome](https://biomejs.dev/) (Formatter), [Bun](https://bun.sh/) (Package Manager)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Aruh1/karasplitter-web.git
   cd karasplitter-web
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run the development server:
   ```bash
   bun run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Paste Content**: Copy the content of your `.ass` file (or just the `[Events]` section) and paste it into the text area.
2. **Select Mode**: Choose your desired splitting mode (Syllables, Characters, or Words).
3. **Filter (Optional)**: If you only want to split lines for a specific Actor or Style, select the filter option and enter the name.
4. **Process**: Click the "Process Content" button.
5. **Copy**: Click "Copy to Clipboard" and paste the result back into your `.ass` file or Aegisub.

## Acknowledgments

- Original `ksplitter` logic by the Aegisub community.
- Built with ❤️ for fansubbers and karaoke timers.
