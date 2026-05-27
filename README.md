# Training Log PWA

Phone-first PWA for daily workout logging, paired with a Claude Project for
evening analysis. See the spec at
`/Users/admin/Documents/Claude Sandbox/specs/2026-05-27-training-log-pwa-design.md`
for the full design.

## Architecture (one-paragraph)

The PWA reads `program.md` (static program) and `log.md` (live training data) from
your Google Drive. You log sessions in the PWA; entries are appended to `log.md`.
Each evening (~22:00) your Claude Project reads `log.md`, proposes load
adjustments and pattern flags, and writes them back to `log.md`. The next morning,
the PWA reflects those adjustments in today's prescribed values.

## Setup

### 1. Google Cloud OAuth (one-time, ~15 min)

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or pick existing). Name: "Training Log PWA".
3. APIs & Services → Library → search "Google Drive API" → Enable.
4. APIs & Services → OAuth consent screen → External → fill required fields
   (app name, support email, developer email). Skip scopes. Add yourself as a test user.
5. APIs & Services → Credentials → Create credentials → OAuth client ID:
   - Application type: **Web application**
   - Name: "Training Log PWA"
   - Authorized JavaScript origins: add
     - `http://localhost:8080` (for local testing)
     - `https://<your-github-username>.github.io` (for deployed)
   - No redirect URIs needed (token client flow).
6. Copy the **Client ID** (looks like `123-abc.apps.googleusercontent.com`).

### 2. Drive folder

1. Create a folder in your Google Drive named "Training" (or anything).
2. Copy `/Users/admin/Documents/Claude Sandbox/hybrid-athlete-program.md` into it
   as `program.md`. (The PWA looks for `program.md` by exact filename.)
3. Get the folder ID from the URL: `drive.google.com/drive/folders/<this-id>`.

### 3. Local config

```bash
cd training-log-pwa
cp config.example.js config.local.js
```

Edit `config.local.js` with your Client ID, folder ID, and program start date.

### 4. Run locally

```bash
npm install
npx http-server -p 8080 --cors -c-1
```

Open http://localhost:8080. Sign in with Google. Today's session appears.

### 5. Deploy to GitHub Pages

1. Push the repo to GitHub.
2. Repo Settings → Pages → Source: deploy from branch `main` / root.
3. Wait ~1 min, your PWA is at `https://<username>.github.io/<repo>/`.
4. Update the OAuth Authorized JavaScript origins to include the Pages URL.
5. On your phone, open the URL in Safari/Chrome → share → "Add to Home Screen".

### 6. Claude Project

1. Create a new Claude Project named "Hybrid Athlete Training".
2. Upload `program.md` to project knowledge.
3. Enable the **Google Drive** MCP connector for the project; grant it access to
   the same Training folder.
4. Paste the system prompt from `docs/claude-system-prompt.md` (Task 22).
5. Star the project for quick access.
6. Configure the scheduled task (Task 23) to run `review today` daily at 22:00.

## Daily usage

- During day: open PWA → fill today's session → Save.
- 22:00: Claude posts review in the project chat → confirm with `y`.
- Tomorrow morning: PWA reflects the new adjustments.

## Editing a recent entry

From the Log tab, the most recent session shows an "edit" link if within 24h
of its date. Tap → modify → Save edits. The block is replaced in-place and
gets an `_(edited <timestamp>)_` marker.

## Tests

```bash
npx vitest run
```

## File layout

See spec Section 6 + the project root.
