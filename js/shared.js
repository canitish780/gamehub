/**
 * BREAK ROOM ARCADE — shared logic
 * Loaded on every page (home, game list, and each game).
 */

const ARCADE = {
  // Paste the Apps Script Web App URL here after you deploy it (see README).
  API_URL: 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',

  GAMES: [
    { id: 'flappy',      name: 'Flappy Bounce', emoji: '🐤', color: '#FFC93C', file: 'games/flappy.html',      tagline: 'Dodge the pipes' },
    { id: 'whackamole',  name: 'Whack-a-Mole',  emoji: '🔨', color: '#FF6B6B', file: 'games/whackamole.html',  tagline: '30 second rush' },
    { id: 'quiz',        name: 'Office Quiz',   emoji: '🧠', color: '#3DDC97', file: 'games/quiz.html',        tagline: 'Test your brain' },
    { id: 'tictactoe',   name: 'Tic-Tac-Toe',   emoji: '❌', color: '#4D9DE0', file: 'games/tictactoe.html',   tagline: 'Beat the computer' },
  ],

  NAME_KEY: 'oga_player_name',
  LOCAL_BOARD_PREFIX: 'oga_localboard_',
};

function isApiConfigured() {
  return ARCADE.API_URL && !ARCADE.API_URL.startsWith('PASTE_');
}

/* ---------------- Player name ---------------- */

function getStoredName() {
  return localStorage.getItem(ARCADE.NAME_KEY);
}

function setStoredName(name) {
  localStorage.setItem(ARCADE.NAME_KEY, name);
}

/**
 * Ensures a player name exists on this device. Shows a modal if not.
 * Calls back with the name once available.
 */
function ensurePlayerName(callback) {
  const existing = getStoredName();
  if (existing) {
    callback(existing);
    return;
  }
  showNameModal(callback);
}

function showNameModal(callback, opts) {
  opts = opts || {};
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h2>👋 Welcome!</h2>
      <p>${opts.message || "What's your name? It'll show on the leaderboards."}</p>
      <input id="oga-name-input" type="text" maxlength="24" placeholder="e.g. Priya" autocomplete="off" value="${opts.prefill ? escapeHtml(opts.prefill) : ''}" />
      <button class="btn-primary" id="oga-name-submit">Save &amp; play</button>
    </div>
  `;
  document.body.appendChild(backdrop);

  const input = backdrop.querySelector('#oga-name-input');
  const submit = backdrop.querySelector('#oga-name-submit');
  input.focus();

  function commit() {
    const val = input.value.trim();
    if (!val) {
      input.style.borderColor = '#FF6B6B';
      return;
    }
    setStoredName(val);
    document.body.removeChild(backdrop);
    callback(val);
  }

  submit.addEventListener('click', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit();
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------- Leaderboard: submit ---------------- */

function submitScore(gameId, score) {
  const name = getStoredName() || 'Player';

  // Always mirror locally so the page still works before Sheets is configured
  // and as an offline fallback.
  saveLocalScore(gameId, name, score);

  if (!isApiConfigured()) return Promise.resolve({ status: 'local-only' });

  const url = `${ARCADE.API_URL}?action=submit&game=${encodeURIComponent(gameId)}&name=${encodeURIComponent(name)}&score=${encodeURIComponent(score)}`;
  return fetch(url)
    .then((r) => r.json())
    .catch((err) => {
      console.warn('Score submit failed, kept locally only.', err);
      return { status: 'error' };
    });
}

function saveLocalScore(gameId, name, score) {
  const key = ARCADE.LOCAL_BOARD_PREFIX + gameId;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.push({ name, score, date: new Date().toISOString() });
  list.sort((a, b) => b.score - a.score);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 20)));
}

function getLocalScores(gameId) {
  const key = ARCADE.LOCAL_BOARD_PREFIX + gameId;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

/* ---------------- Leaderboard: fetch ---------------- */

function fetchLeaderboard(gameId) {
  if (!isApiConfigured()) {
    return Promise.resolve(getLocalScores(gameId));
  }
  const url = `${ARCADE.API_URL}?action=leaderboard&game=${encodeURIComponent(gameId)}`;
  return fetch(url)
    .then((r) => r.json())
    .then((data) => (data && data.leaderboard) ? data.leaderboard : getLocalScores(gameId))
    .catch((err) => {
      console.warn('Leaderboard fetch failed, showing local scores.', err);
      return getLocalScores(gameId);
    });
}

/* ---------------- Leaderboard: render ---------------- */

function renderLeaderboard(container, entries, opts) {
  opts = opts || {};
  if (!entries || entries.length === 0) {
    container.innerHTML = `<div class="board-empty">No scores yet — be the first on the board! 🏆</div>`;
    return;
  }
  const medalClass = ['gold', 'silver', 'bronze'];
  container.innerHTML = entries.map((e, i) => {
    const cls = medalClass[i] || '';
    const rank = i + 1;
    const highlight = opts.highlightName && e.name === opts.highlightName ? 'style="color:var(--yellow)"' : '';
    return `
      <div class="board-row ${cls}">
        <div class="rank">${rank}</div>
        <div class="rname" ${highlight}>${escapeHtml(e.name)}</div>
        <div class="rscore">${e.score}</div>
      </div>
    `;
  }).join('');
}

/* ---------------- Player badge (shown on every page) ---------------- */

function renderPlayerBadge(container) {
  const name = getStoredName();
  if (!name) return;
  container.innerHTML = `
    <span class="who">PLAYER 1 &nbsp; <span class="name">${escapeHtml(name)}</span></span>
    <button id="oga-change-name">change</button>
  `;
  container.querySelector('#oga-change-name').addEventListener('click', () => {
    showNameModal((newName) => renderPlayerBadge(container), { message: 'Update your display name', prefill: name });
  });
}

/* ---------------- PWA service worker registration ---------------- */

function registerServiceWorker(swPath) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swPath).catch((err) => {
        console.warn('Service worker registration failed', err);
      });
    });
  }
}
