export const config = {
  // Public GitHub raw URL for log.md (Claude commits adjustments here).
  // The PWA fetches this on launch to pick up Claude's adjustments + reviews.
  githubRawLogUrl: "https://raw.githubusercontent.com/goiaagent/training-log-pwa/main/log.md",

  // Program start date — drives day/phase/week computation.
  programStartDate: "2026-05-14",
};
