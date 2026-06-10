export const config = {
  // Public GitHub raw URL for log.md (Claude commits adjustments here).
  // The PWA fetches this on launch to pick up Claude's adjustments + reviews.
  githubRawLogUrl: "https://raw.githubusercontent.com/goiaagent/training-log-pwa/main/log.md",

  // Repo coordinates for direct sync (PWA writes log.md back via the
  // Contents API, authenticated with a fine-grained PAT pasted in Settings).
  githubRepo: "goiaagent/training-log-pwa",
  githubBranch: "main",
  githubLogPath: "log.md",

  // Program start date — drives day/phase/week computation.
  programStartDate: "2026-05-25",
};
