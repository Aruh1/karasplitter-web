import type { NextConfig } from "next";
import { execSync } from "child_process";

const getGitCommitHash = () => {
	try {
		return execSync("git rev-parse --short HEAD").toString().trim();
	} catch (e) {
		return "unknown";
	}
};

const nextConfig: NextConfig = {
	env: {
		GIT_COMMIT_HASH: getGitCommitHash(),
	},
};

export default nextConfig;
