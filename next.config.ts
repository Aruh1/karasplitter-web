import type { NextConfig } from "next";
import { execSync } from "child_process";

const getGitCommitHash = () => {
	try {
		return execSync("git rev-parse --short HEAD").toString().trim();
	} catch (e) {
		return "unknown";
	}
};

const isStatic = process.env.NEXT_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
	output: isStatic ? "export" : undefined,
	images: {
		unoptimized: isStatic,
	},
	env: {
		GIT_COMMIT_HASH: getGitCommitHash(),
	},
	// Security headers
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "Content-Security-Policy",
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
							"style-src 'self' 'unsafe-inline'",
							"img-src 'self' data: https: blob:",
							"font-src 'self' data:",
							"connect-src 'self'",
							"frame-ancestors 'none'",
						].join("; "),
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
				],
			},
		];
	},
};

export default nextConfig;
