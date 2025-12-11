export const getCommitHash = () => {
	return process.env.GIT_COMMIT_HASH || "development";
};
