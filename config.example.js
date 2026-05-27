// Copy to config.local.js and fill in. config.local.js is gitignored.
export const config = {
  // From Google Cloud Console > Credentials > OAuth 2.0 Client IDs
  googleClientId: "YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com",

  // Drive folder containing program.md and log.md
  // Get the ID from the folder URL: drive.google.com/drive/folders/<this-id>
  driveFolderId: "YOUR_DRIVE_FOLDER_ID",

  // Filenames within that folder. Defaults usually fine.
  programFilename: "program.md",
  logFilename: "log.md",

  // Program start date — drives day/phase/week computation
  programStartDate: "2026-05-14",
};
