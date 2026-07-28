# Break Room Arcade 🕹️

A installable (PWA) office game hub with four games, each with its own
Google-Sheets-backed leaderboard.

- **Home page** — asks for the player's name once per device, then shows a
  start button and leaderboard tabs (one per game).
- **Games** — Flappy Bounce, Whack-a-Mole, Office Quiz, Tic-Tac-Toe (vs an
  unbeatable computer).
- **Leaderboards** — stored in a Google Sheet, one tab per game, via a free
  Google Apps Script "Web App" endpoint. No paid backend needed.

## 1. Set up the Google Sheet (5 minutes)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like **Break Room Arcade Scores**.
2. In the menu, click **Extensions → Apps Script**.
3. Delete anything in the editor and paste in the contents of
   [`apps-script/Code.gs`](apps-script/Code.gs) from this project.
4. Click **Save** (the floppy disk icon), then **Deploy → New deployment**.
5. Click the gear icon next to "Select type" and choose **Web app**.
6. Set:
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone
7. Click **Deploy**. Google will ask you to authorize the script — approve it
   (you may need to click "Advanced" → "Go to [project] (unsafe)" since it's
   your own unpublished script).
8. Copy the **Web app URL** it gives you. It looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

That's your leaderboard API. Each game tab (Flappy, Whackamole, Quiz,
Tictactoe) will be created automatically in the sheet the first time someone
submits a score.

## 2. Connect the app to your sheet

Open [`js/shared.js`](js/shared.js) and paste your Web App URL into:

```js
API_URL: 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',
```

so it reads something like:

```js
API_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
```

Until you do this, the app still works fine — scores are just kept locally
on each device instead of on the shared sheet.

## 3. Publish it on GitHub Pages

1. Create a new **public** GitHub repo (e.g. `break-room-arcade`).
2. Upload every file/folder in this project, keeping the folder structure
   (`index.html`, `games.html`, `css/`, `js/`, `games/`, `icons/`,
   `manifest.json`, `service-worker.js`).
3. Go to the repo's **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
5. GitHub gives you a URL like:
   `https://yourusername.github.io/break-room-arcade/`
6. Share that link with your colleagues. On a phone, opening it and choosing
   "Add to Home Screen" installs it as a PWA with its own icon.

## 4. Redeploying after you edit `Code.gs`

If you ever change the Apps Script code, you need to create a **new
deployment version** (Deploy → Manage deployments → edit → New version) for
the changes to go live — saving the script alone isn't enough.

## Notes

- Player names are stored in the browser's local storage per device — this
  is what makes "one prompt per device" work without a login system.
- If someone is offline or the Sheet isn't configured yet, scores are kept
  in that browser's local storage as a fallback, and shown as the
  leaderboard until Sheets syncing is available.
- Want more games later? Add a new entry to the `GAMES` array in
  `js/shared.js`, drop a new HTML file in `games/`, and it'll show up on the
  game-selection page and get its own leaderboard tab automatically (as
  soon as it calls `submitScore('yourGameId', score)`).
