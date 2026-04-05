/**
 * API Module - Chess.com API calls with caching
 */

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
