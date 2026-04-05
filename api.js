/**
 * API Module - Chess.com API calls with caching
 */

const API_BASE = 'https://api.chess.com/pub';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const FETCH_DELAY = 300; // ms delay between monthly archive fetches

/**
 * Get cached data or return null if expired
 */
async function getCachedData(username) {
  return new Promise((resolve) => {
    chrome.storage.local.get(`cache_${username}`, (result) => {
      const cached = result[`cache_${username}`];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        resolve(cached.data);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Store data in cache with timestamp
 */
async function setCachedData(username, data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [`cache_${username}`]: {
          data,
          timestamp: Date.now()
        }
      },
      resolve
    );
  });
}

/**
 * Fetch player profile
 */
async function fetchPlayerProfile(username) {
  const response = await fetch(`${API_BASE}/player/${username}`);
  if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`);
  return response.json();
}

/**
 * Fetch player stats
 */
async function fetchPlayerStats(username) {
  const response = await fetch(`${API_BASE}/player/${username}/stats`);
  if (!response.ok) throw new Error(`Stats fetch failed: ${response.status}`);
  return response.json();
}

/**
 * Fetch game archives list
 */
async function fetchGameArchives(username) {
  const response = await fetch(`${API_BASE}/player/${username}/games/archives`);
  if (!response.ok) throw new Error(`Archives fetch failed: ${response.status}`);
  return response.json();
}

/**
 * Fetch games for a specific month
 */
async function fetchGamesMonth(username, year, month) {
  const monthStr = String(month).padStart(2, '0');
  const response = await fetch(
    `${API_BASE}/player/${username}/games/${year}/${monthStr}`
  );
  if (!response.ok) return null; // Silently skip 404s
  return response.json();
}

/**
 * Get the last 3 months of archives from the archive list
 */
function getLastThreeMonths(archives) {
  if (!archives || archives.length === 0) return [];
  
  // Archives come in format: https://api.chess.com/pub/player/{username}/games/YYYY/MM
  // Extract and return the last 3
  return archives.slice(-3).map((url) => {
    const match = url.match(/(\d{4})\/(\d{2})$/);
    if (match) {
      return { year: parseInt(match[1]), month: parseInt(match[2]) };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Fetch all games from the last 3 months
 */
async function fetchLastThreeMonthsGames(username, archives) {
  const monthsList = getLastThreeMonths(archives);
  const allGames = [];
  
  for (let i = 0; i < monthsList.length; i++) {
    const { year, month } = monthsList[i];
    try {
      const monthData = await fetchGamesMonth(username, year, month);
      if (monthData && monthData.games) {
        allGames.push(...monthData.games);
      }
    } catch (e) {
      console.error(`Failed to fetch games for ${year}/${month}:`, e);
    }
    
    // Add delay between requests to respect rate limiting
    if (i < monthsList.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY));
    }
  }
  
  return allGames;
}

/**
 * Main function: fetch all opponent data
 */
async function fetchOpponentData(username) {
  try {
    // Check cache first
    const cached = await getCachedData(username);
    if (cached) {
      console.log(`[Chess Scout] Loaded ${username} from cache`);
      return cached;
    }
    
    console.log(`[Chess Scout] Fetching fresh data for ${username}`);
    
    // Fetch profile and stats in parallel
    const [profile, stats] = await Promise.all([
      fetchPlayerProfile(username),
      fetchPlayerStats(username)
    ]);
    
    // Fetch archives
    const archivesData = await fetchGameArchives(username);
    
    // Fetch games from last 3 months
    const games = await fetchLastThreeMonthsGames(username, archivesData.archives);
    
    const result = {
      profile,
      stats,
      games
    };
    
    // Cache the result
    await setCachedData(username, result);
    
    return result;
  } catch (error) {
    console.error('[Chess Scout] API Error:', error);
    throw error;
  }
}

export { fetchOpponentData, getCachedData, setCachedData };
