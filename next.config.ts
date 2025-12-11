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
};

export default nextConfig;
