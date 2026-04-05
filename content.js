/**
 * Chess Scout - Content Script
 * Displays opponent scouting card on chess.com
 */

// ===== STYLES =====

function injectStyles() {
  if (document.getElementById('chess-scout-styles')) return;
  const style = document.createElement('style');
  style.id = 'chess-scout-styles';
  style.textContent = `
  .chess-scout-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: 50%;
    background: #1D9E75; color: white; font-size: 14px;
    cursor: pointer; margin-left: 8px; transition: all 0.2s;
    flex-shrink: 0; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .chess-scout-badge:hover { transform: scale(1.2); background: #25c08e; }
  .chess-scout-badge::after { content: '♟'; }

  .cs-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    z-index: 99998; display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(3px); animation: cs-fade 0.2s ease;
  }
  @keyframes cs-fade { from { opacity: 0; } to { opacity: 1; } }

  .cs-card {
    width: 720px; max-height: 90vh; overflow-y: auto;
    background: #1e1e1e; border: 1px solid #333; border-radius: 12px;
    color: #fff; font-family: 'Inter', -apple-system, sans-serif;
    font-size: 14px; animation: cs-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    scrollbar-width: thin; scrollbar-color: #444 transparent;
  }
  .cs-card::-webkit-scrollbar { width: 5px; }
  .cs-card::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
  @keyframes cs-slide { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  /* New Dashboard Modules */
  .cs-header {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 24px 16px; position: relative;
  }
  .cs-username { font-size: 18px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
  .cs-online { width: 8px; height: 8px; border-radius: 50%; background: #4caf50; }
  .cs-close {
    background: none; border: none; color: #666; font-size: 24px;
    cursor: pointer; position: absolute; top: 18px; right: 20px; transition: color 0.15s;
  }
  .cs-close:hover { color: #fff; }

  /* Top Stats Row */
  .cs-stats-row {
    display: grid; grid-template-columns: repeat(4, 1fr);
    padding: 0 24px 24px; gap: 12px;
  }
  .cs-stat-box .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .cs-stat-box .val { font-size: 28px; font-weight: 700; }
  .cs-stat-box.win .val { color: #4caf50; }
  .cs-stat-box.loss .val { color: #e57373; }
  .cs-stat-box.draw .val { color: #999; }

  /* Rating & Accuracy Section */
  .cs-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding: 24px; border-top: 1px solid #2a2a2a; }
  .cs-section-head { font-size: 12px; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 16px; }
  
  .cs-rating-display { display: flex; gap: 40px; }
  .cs-rating-item .lbl { font-size: 11px; color: #666; margin-bottom: 4px; }
  .cs-rating-item .val { font-size: 24px; font-weight: 600; }

  /* Openings Side-by-Side */
  .cs-openings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding: 24px; border-top: 1px solid #2a2a2a; }
  .cs-op-row { display: grid; grid-template-columns: 1fr 80px 36px; align-items: center; gap: 12px; margin-bottom: 10px; }
  .cs-op-name { font-size: 13px; font-weight: 600; color: #eee; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cs-op-bar { height: 6px; background: #2a2a2a; border-radius: 3px; overflow: hidden; }
  .cs-op-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
  .cs-op-pct { font-size: 12px; text-align: right; font-weight: 600; }

  /* Chart Styles */
  .cs-chart-container { padding: 24px; border-top: 1px solid #2a2a2a; }
  .cs-chart-svg { width: 100%; height: 160px; overflow: visible; }
  .cs-chart-line { fill: none; stroke: #1D9E75; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
  .cs-chart-point { fill: #1D9E75; stroke: #1e1e1e; stroke-width: 2; }
  .cs-chart-axis { stroke: #333; stroke-width: 1; }
  .cs-chart-label { font-size: 10px; fill: #666; text-anchor: middle; }

  /* Outcome List */
  .cs-outcomes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding: 24px; border-top: 1px solid #2a2a2a; }
  .cs-outcome-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #252525; font-size: 13px; }
  .cs-outcome-row:last-child { border-bottom: none; }
  .cs-outcome-row .val { font-weight: 700; color: #4caf50; }
  .cs-outcome-row.loss .val { color: #e57373; }
  
  /* Utilities */
  .cs-footer { padding: 16px 24px; font-size: 11px; color: #444; border-top: 1px solid #2a2a2a; display: flex; justify-content: space-between; }
  `;
  document.head.appendChild(style);
}

// ===== UTILITY =====

function detectPageType() {
  const url = window.location.href;
  if (url.includes('/game/')) return 'game';
  if (url.includes('/member/') || url.includes('/profile/')) return 'profile';
  return null;
}

function extractUsernameFromUrl() {
  const match = window.location.href.match(/\/(?:member|profile)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1].toLowerCase() : null;
}

function extractOpponentUsernameFromGame() {
  const links = document.querySelectorAll('a[href*="/member/"], a[href*="/profile/"]');
  for (const link of links) {
    const username = link.textContent?.trim();
    if (username && username.length > 2 && username.length < 50) {
      return username.toLowerCase();
    }
  }
  return null;
}

function buildHeader(d) {
  const { profile } = d;
  return `
    <div class="cs-header">
      <div class="cs-username">
        ${profile.username} ${profile.status === 'online' ? '<span class="cs-online"></span>' : ''}
      </div>
      <button class="cs-close" title="Close">×</button>
    </div>`;
}

function buildTopStatsRow(d) {
  return `
    <div class="cs-stats-row">
      <div class="cs-stat-box">
        <div class="label">Games</div>
        <div class="val">${d.totalGames}</div>
      </div>
      <div class="cs-stat-box win">
        <div class="label">Wins</div>
        <div class="val">${d.wins}</div>
      </div>
      <div class="cs-stat-box loss">
        <div class="label">Losses</div>
        <div class="val">${d.losses}</div>
      </div>
      <div class="cs-stat-box draw">
        <div class="label">Draws</div>
        <div class="val">${d.draws}</div>
      </div>
    </div>`;
}

function buildRatingAccuracy(d) {
  const fmt = (v) => v || '—';
  return `
    <div class="cs-grid-2">
      <div>
        <div class="cs-section-head">Rating & Accuracy</div>
        <div class="cs-rating-display">
          <div class="cs-rating-item">
            <div class="lbl">start rating</div>
            <div class="val">${fmt(d.startRating)}</div>
          </div>
          <div class="cs-rating-item">
            <div class="lbl">end rating</div>
            <div class="val">${fmt(d.endRating)}</div>
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end;">
        <div class="cs-rating-item" style="text-align: right;">
          <div class="lbl">avg accuracy (white)</div>
          <div class="val" style="color: #1D9E75;">${d.avgAccWhite}%</div>
        </div>
      </div>
    </div>`;
}

function buildOpeningsDashboard(d) {
  const renderList = (title, list) => {
    const rows = list.map(o => {
      const color = o.winPercent >= 60 ? '#4caf50' : o.winPercent >= 40 ? '#ffa726' : '#e57373';
      return `
        <div class="cs-op-row">
          <div class="cs-op-name" title="${o.name}">${o.name}</div>
          <div class="cs-op-bar"><div class="cs-op-fill" style="width:${o.winPercent}%; background:${color}"></div></div>
          <div class="cs-op-pct">${Math.round(o.winPercent)}%</div>
        </div>`;
    }).join('');
    return `<div><div class="cs-section-head">${title}</div>${rows || '<div style="color:#444">No data</div>'}</div>`;
  };

  return `
    <div class="cs-openings-grid">
      ${renderList('Openings as white', d.openings.asWhite)}
      ${renderList('Openings as black', d.openings.asBlack)}
    </div>`;
}

function buildAccuracyChart(d) {
  if (!d.accuracyHistory || d.accuracyHistory.length < 2) return '';
  
  const history = d.accuracyHistory;
  const width = 640;
  const height = 120;
  const padding = 20;
  
  const minAcc = 50; 
  const maxAcc = 100;
  
  const getX = (i) => padding + (i * ((width - 2 * padding) / (history.length - 1)));
  const getY = (v) => height - padding - (((v - minAcc) / (maxAcc - minAcc)) * (height - 2 * padding));
  
  const points = history.map((p, i) => `${getX(i)},${getY(p.val)}`).join(' ');
  const labels = history.map((p, i) => `<text x="${getX(i)}" y="${height}" class="cs-chart-label">${p.label}</text>`).join('');
  const dots = history.map((p, i) => `<circle cx="${getX(i)}" cy="${getY(p.val)}" r="4" class="cs-chart-point" />`).join('');

  return `
    <div class="cs-chart-container">
      <div class="cs-section-head">Accuracy by Game (White Games)</div>
      <svg class="cs-chart-svg" viewBox="0 0 ${width} ${height}">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="cs-chart-axis" />
        <polyline points="${points}" class="cs-chart-line" />
        ${dots}
        ${labels}
      </svg>
    </div>`;
}

function buildOutcomesDashboard(d) {
  const renderList = (title, list) => {
    const rows = list.map(([label, count]) => `
      <div class="cs-outcome-row ${label.toLowerCase().includes('lost') ? 'loss' : ''}">
        <span>${label}</span>
        <span class="val">${count}</span>
      </div>`).join('');
    return `<div><div class="cs-section-head">${title}</div>${rows || '<div style="color:#444">No data</div>'}</div>`;
  };

  return `
    <div class="cs-outcomes-grid">
      ${renderList('How games ended (as white)', d.outcomesWhite)}
      ${renderList('How games ended (as black)', d.outcomesBlack)}
    </div>`;
}

function buildSmurf(isSmurf) {
  if (!isSmurf) return '';
  return `<div class="cs-smurf"><b>⚠ New account</b>High skill on a recent account. Play with caution.</div>`;
}

function buildSkeleton() {
  return `
    <div style="padding:24px; width: 700px;">
      <div class="cs-skeleton-pulse" style="height:30px; width:40%; margin-bottom:20px;"></div>
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-bottom:30px;">
        <div class="cs-skeleton-pulse" style="height:60px;"></div>
        <div class="cs-skeleton-pulse" style="height:60px;"></div>
        <div class="cs-skeleton-pulse" style="height:60px;"></div>
        <div class="cs-skeleton-pulse" style="height:60px;"></div>
      </div>
      <div class="cs-skeleton-pulse" style="height:100px; margin-bottom:20px;"></div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:40px;">
        <div class="cs-skeleton-pulse" style="height:150px;"></div>
        <div class="cs-skeleton-pulse" style="height:150px;"></div>
      </div>
    </div>`;
}

function createCard(d) {
  const card = document.createElement('div');
  card.className = 'cs-card';
  card.innerHTML = `
    ${buildHeader(d)}
    ${buildTopStatsRow(d)}
    ${buildRatingAccuracy(d)}
    ${buildOpeningsDashboard(d)}
    ${buildAccuracyChart(d)}
    ${buildOutcomesDashboard(d)}
    ${buildSmurf(d.isSmurf)}
    <div class="cs-footer">
      <span>Chess Scout · stats from last 3 months</span>
      <span>${d.streak?.count >= 2 ? `${d.streak.type.toUpperCase()}${d.streak.count} streak` : ''}</span>
    </div>`;

  card.querySelector('.cs-close').addEventListener('click', () => {
    document.getElementById('cs-backdrop')?.remove();
  });
  return card;
}

// ===== MODAL =====

function showModal(cardEl) {
  document.getElementById('cs-backdrop')?.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'cs-backdrop';
  backdrop.className = 'cs-backdrop';
  backdrop.appendChild(cardEl);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  document.body.appendChild(backdrop);
}

function showLoading() {
  document.getElementById('cs-backdrop')?.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'cs-backdrop';
  backdrop.className = 'cs-backdrop';

  const card = document.createElement('div');
  card.className = 'cs-card';
  card.innerHTML = buildSkeleton();
  backdrop.appendChild(card);

  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  document.body.appendChild(backdrop);
}

// ===== API =====

const API_BASE = 'https://api.chess.com/pub';
const CACHE_TTL = 24 * 60 * 60 * 1000;
const FETCH_DELAY = 300;

async function getCached(username) {
  return new Promise(resolve => {
    chrome.storage.local.get(`cs_${username}`, r => {
      const c = r[`cs_${username}`];
      resolve(c && Date.now() - c.ts < CACHE_TTL ? c.data : null);
    });
  });
}

async function setCache(username, data) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [`cs_${username}`]: { data, ts: Date.now() } }, resolve);
  });
}

async function apiFetch(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function fetchLastThreeMonths(username, archives) {
  const months = (archives || []).slice(-3).map(url => {
    const m = url.match(/(\d{4})\/(\d{2})$/);
    return m ? { year: parseInt(m[1]), month: parseInt(m[2]) } : null;
  }).filter(Boolean);

  const games = [];
  for (let i = 0; i < months.length; i++) {
    const { year, month } = months[i];
    try {
      const d = await fetch(`${API_BASE}/player/${username}/games/${year}/${String(month).padStart(2,'0')}`);
      if (d.ok) {
        const j = await d.json();
        if (j.games) games.push(...j.games);
      }
    } catch(e) { /* skip */ }
    if (i < months.length - 1) await new Promise(r => setTimeout(r, FETCH_DELAY));
  }
  return games;
}

async function fetchOpponentData(username) {
  const cached = await getCached(username);
  if (cached) return cached;

  const [profile, stats] = await Promise.all([
    apiFetch(`${API_BASE}/player/${username}`),
    apiFetch(`${API_BASE}/player/${username}/stats`)
  ]);

  const archivesData = await apiFetch(`${API_BASE}/player/${username}/games/archives`);
  const games = await fetchLastThreeMonths(username, archivesData.archives);

  const result = { profile, stats, games };
  await setCache(username, result);
  return result;
}

// ===== COMPUTE =====

function computeScoutData(rawData, opponentUsername) {
  const { profile, stats, games } = rawData;
  const opp = opponentUsername.toLowerCase();

  const ratedGames = games.filter(g =>
    g.rated && g.rules === 'chess' &&
    (g.white?.username?.toLowerCase() === opp || g.black?.username?.toLowerCase() === opp)
  );

  const getColor = g => {
    if (g.white?.username?.toLowerCase() === opp) return 'white';
    if (g.black?.username?.toLowerCase() === opp) return 'black';
    return null;
  };

  // Openings - Refined for top 3
  const whiteOps = {}, blackOps = {};
  ratedGames.forEach(g => {
    const color = getColor(g);
    if (!color) return;
    const m = g.pgn?.match(/\[ECOUrl "([^"]+)"\]/);
    const name = m ? m[1].split('/').pop().replace(/-/g, ' ') : 'Unknown';
    const t = color === 'white' ? whiteOps : blackOps;
    if (!t[name]) t[name] = { name, played: 0, wins: 0, losses: 0, draws: 0 };
    t[name].played++;
    const res = color === 'white' ? g.white?.result : g.black?.result;
    if (res === 'win') t[name].wins++;
    else if (res === 'loss') t[name].losses++;
    else if (res === 'draw') t[name].draws++;
  });
  const topThree = obj => Object.values(obj)
    .map(o => ({ ...o, winPercent: o.played > 0 ? (o.wins / o.played) * 100 : 0 }))
    .sort((a, b) => b.played - a.played).slice(0, 3);

  // Stats basics
  let wins = 0, losses = 0, draws = 0;
  ratedGames.forEach(g => {
    const c = getColor(g);
    const res = c === 'white' ? g.white?.result : g.black?.result;
    if (res === 'win') wins++;
    else if (res === 'loss' || ['checkmated', 'resigned', 'timeout', 'abandoned'].includes(res)) losses++;
    else draws++;
  });

  // Ratings
  const chron = [...ratedGames].sort((a, b) => (a.end_time || 0) - (b.end_time || 0));
  const getR = g => getColor(g) === 'white' ? g.white?.rating : g.black?.rating;
  const startRating = chron.length ? getR(chron[0]) : null;
  const endRating = chron.length ? getR(chron[chron.length-1]) : null;

  // Accuracy
  const accW = ratedGames.filter(g => getColor(g) === 'white').map(g => g.accuracies?.white).filter(a => typeof a === 'number');
  const accB = ratedGames.filter(g => getColor(g) === 'black').map(g => g.accuracies?.black).filter(a => typeof a === 'number');
  
  // Accuracy History for chart (White games)
  const accuracyHistory = chron
    .filter(g => getColor(g) === 'white' && typeof g.accuracies?.white === 'number')
    .slice(-10)
    .map(g => {
      const d = new Date(g.end_time * 1000);
      return { 
        label: `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`,
        val: g.accuracies.white 
      };
    });

  // Outcomes
  const getOutcomes = (color) => {
    const map = {};
    ratedGames.filter(g => getColor(g) === color).forEach(g => {
      const res = color === 'white' ? g.white?.result : g.black?.result;
      const oppRes = color === 'white' ? g.black?.result : g.white?.result;
      let label = 'Drawn';
      if (res === 'win') {
        const reason = oppRes === 'resigned' ? 'resignation' : oppRes === 'checkmated' ? 'checkmate' : oppRes === 'timeout' ? 'time' : oppRes === 'abandoned' ? 'abandonment' : 'other';
        label = `Won by ${reason}`;
      } else {
        const reason = res === 'resigned' ? 'resignation' : res === 'checkmated' ? 'checkmate' : res === 'timeout' ? 'time' : res === 'abandoned' ? 'abandonment' : 'other';
        label = `Lost by ${reason}`;
      }
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  // Streak
  let streak = 0, streakType = null;
  const latest = [...chron].reverse();
  for (const g of latest) {
    const c = getColor(g);
    const res = c === 'white' ? g.white?.result : g.black?.result;
    if (!streakType) {
      if (res === 'draw') continue;
      streakType = res === 'win' ? 'win' : 'loss';
      streak = 1;
    } else if ((streakType === 'win' && res === 'win') || (streakType === 'loss' && res !== 'win' && res !== 'draw')) {
      streak++;
    } else break;
  }

  return {
    profile,
    stats,
    totalGames: ratedGames.length,
    wins, losses, draws,
    startRating, endRating,
    avgAccWhite: accW.length ? Math.round(accW.reduce((a,b)=>a+b,0)/accW.length) : null,
    avgAccBlack: accB.length ? Math.round(accB.reduce((a,b)=>a+b,0)/accB.length) : null,
    openings: { asWhite: topThree(whiteOps), asBlack: topThree(blackOps) },
    accuracyHistory,
    outcomesWhite: getOutcomes('white'),
    outcomesBlack: getOutcomes('black'),
    streak: { type: streakType, count: streak },
    isSmurf: ((Date.now() - profile.joined * 1000) / 86400000 < 90) && ((stats.chess_rapid?.last?.rating > 1400) || (accW.length > 0 && Math.round(accW.reduce((a,b)=>a+b,0)/accW.length) > 85)),
    games: ratedGames
  };
}

// ===== BADGE =====

function injectBadge(username, container) {
  if (container.querySelector('.chess-scout-badge')) return;

  const badge = document.createElement('span');
  badge.className = 'chess-scout-badge';
  badge.title = `Scout ${username}`;

  badge.addEventListener('click', e => {
    e.stopPropagation();
    showLoading();
    fetchOpponentData(username)
      .then(raw => showModal(createCard(computeScoutData(raw, username))))
      .catch(err => {
        console.error('[Chess Scout]', err);
        document.getElementById('cs-backdrop')?.remove();
      });
  });

  container.appendChild(badge);
}

// ===== PAGE HANDLERS =====

function handleGamePage() {
  let lastUsername = null;

  const observer = new MutationObserver(() => {
    const username = extractOpponentUsernameFromGame();
    if (username && username !== lastUsername) {
      lastUsername = username;
      const links = document.querySelectorAll('a[href*="/member/"], a[href*="/profile/"]');
      for (const link of links) {
        if (link.textContent?.toLowerCase().includes(username)) {
          injectBadge(username, link.parentElement || link);
          break;
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function handleProfilePage() {
  const username = extractUsernameFromUrl();
  if (!username) return;

  setTimeout(() => {
    const headers = document.querySelectorAll('h1, h2, [class*="username"], [class*="profile"]');
    for (const header of headers) {
      if (header.textContent?.toLowerCase().includes(username)) {
        injectBadge(username, header);
        break;
      }
    }
  }, 500);
}

// ===== INIT =====

function init() {
  injectStyles();
  const page = detectPageType();
  if (page === 'game') handleGamePage();
  else if (page === 'profile') handleProfilePage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}