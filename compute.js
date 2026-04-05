/**
 * Compute Module - Data parsing and statistics
 */

/**
 * Filter games to only included rated standard chess
 */
function filterRatedGames(games, opponentUsername) {
  return games.filter((game) => {
    // Only rated games
    if (!game.rated) return false;
    
    // Only standard chess (not chess960, bughouse, etc.)
    if (game.rules !== 'chess') return false;
    
    // Verify opponent is in the game
    const whiteUsername = game.white?.username?.toLowerCase();
    const blackUsername = game.black?.username?.toLowerCase();
    const opponent = opponentUsername.toLowerCase();
    
    return whiteUsername === opponent || blackUsername === opponent;
  });
}

/**
 * Determine which color opponent played in a game
 */
function getOpponentColor(game, opponentUsername) {
  const opponent = opponentUsername.toLowerCase();
  if (game.white?.username?.toLowerCase() === opponent) return 'white';
  if (game.black?.username?.toLowerCase() === opponent) return 'black';
  return null;
}

/**
 * Parse opening name from ECO URL
 * Example: https://www.chess.com/openings/Sicilian-Defense-Najdorf-Variation → "Sicilian Defense Najdorf Variation"
 */
function parseOpeningName(ecoUrl) {
  if (!ecoUrl) return null;
  const last = ecoUrl.split('/').pop();
  return last.replace(/-/g, ' ');
}

/**
 * Extract opening data from PGN headers
 */
function extractOpeningFromPgn(pgn) {
  const match = pgn.match(/\[ECOUrl "([^"]+)"\]/);
  if (!match) return null;
  return parseOpeningName(match[1]);
}

/**
 * Compute opening repertoire (top 3 per color)
 */
function computeOpeningRepertoire(games, opponentUsername) {
  const white = {};
  const black = {};
  
  games.forEach((game) => {
    const color = getOpponentColor(game, opponentUsername);
    if (!color) return;
    
    const opening = extractOpeningFromPgn(game.pgn);
    if (!opening) return;
    
    const target = color === 'white' ? white : black;
    
    if (!target[opening]) {
      target[opening] = {
        name: opening,
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0
      };
    }
    
    target[opening].played++;
    
    const result = color === 'white' ? game.white?.result : game.black?.result;
    if (result === 'win') {
      target[opening].wins++;
    } else if (result === 'loss') {
      target[opening].losses++;
    } else if (result === 'draw') {
      target[opening].draws++;
    }
  });
  
  // Compute win% and get top 3 for each color
  const computeStats = (obj) => {
    return Object.values(obj)
      .map((opening) => ({
        ...opening,
        winPercent: opening.played > 0 ? (opening.wins / opening.played) * 100 : 0
      }))
      .sort((a, b) => b.played - a.played)
      .slice(0, 3);
  };
  
  return {
    asWhite: computeStats(white),
    asBlack: computeStats(black)
  };
}

/**
 * Compute accuracy trend
 */
function computeAccuracyTrend(games, opponentUsername) {
  const accuracies = games
    .map((game) => {
      const color = getOpponentColor(game, opponentUsername);
      if (!color) return null;
      
      const acc = game.accuracies?.[color];
      return typeof acc === 'number' ? acc : null;
    })
    .filter((acc) => acc !== null)
    .reverse(); // Most recent first
  
  if (accuracies.length === 0) {
    return { avg: null, trend: null };
  }
  
  const last20 = accuracies.slice(0, 20);
  const avg = last20.reduce((a, b) => a + b, 0) / last20.length;
  
  let trend = null;
  if (last20.length >= 6) {
    const last5 = last20.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const prev15 = last20.slice(5, 20).reduce((a, b) => a + b, 0) / 15;
    trend = last5 > prev15 ? 'improving' : last5 < prev15 ? 'declining' : 'stable';
  }
  
  return { avg: Math.round(avg * 10) / 10, trend };
}

/**
 * Compute W/L/D record by time control
 */
function computeRecord(games, opponentUsername) {
  const record = {
    rapid: { win: 0, loss: 0, draw: 0 },
    blitz: { win: 0, loss: 0, draw: 0 },
    bullet: { win: 0, loss: 0, draw: 0 }
  };
  
  games.forEach((game) => {
    const color = getOpponentColor(game, opponentUsername);
    if (!color) return;
    
    const timeControl = game.time_class || 'blitz';
    if (!record[timeControl]) return;
    
    const result = color === 'white' ? game.white?.result : game.black?.result;
    if (result === 'win' || result === 'loss' || result === 'draw') {
      record[timeControl][result]++;
    }
  });
  
  return record;
}

/**
 * Compute average game length (in moves)
 */
function computeAvgGameLength(games) {
  const lengths = games
    .map((game) => {
      if (!game.pgn) return null;
      // Count moves by splitting on numbers followed by dots (1. 2. etc.)
      const moves = game.pgn.match(/\d+\./g);
      return moves ? moves.length : null;
    })
    .filter((len) => len !== null);
  
  if (lengths.length === 0) return null;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

/**
 * Compute current winning/losing streak
 */
function computeStreak(games, opponentUsername) {
  if (games.length === 0) return { type: null, count: 0 };
  
  // Sort by date descending (most recent first)
  const sorted = [...games].sort((a, b) => {
    const aDate = a.end_time || 0;
    const bDate = b.end_time || 0;
    return bDate - aDate;
  });
  
  let streak = 0;
  let streakType = null;
  
  for (const game of sorted) {
    const color = getOpponentColor(game, opponentUsername);
    if (!color) continue;
    
    const result = color === 'white' ? game.white?.result : game.black?.result;
    
    if (!streakType) {
      streakType = result;
      if (streakType === 'draw') continue; // Skip draws in streak
      streak = 1;
    } else if (result === streakType && result !== 'draw') {
      streak++;
    } else {
      break;
    }
  }
  
  return { type: streakType === 'draw' ? null : streakType, count: streak };
}

/**
 * Smurf detection: new account with high rating/accuracy
 */
function detectSmurf(profile, games, opponentUsername) {
  const accountAgeMs = Date.now() - (profile.joined * 1000);
  const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
  
  if (accountAgeDays >= 90) {
    return false; // Not a smurf
  }
  
  // Check if high skill indicators
  const stats = profile.stats || {};
  const rapidRating = stats.chess_rapid?.last?.rating;
  const accuracy = computeAccuracyTrend(games, opponentUsername).avg;
  
  const isHighRating = rapidRating && rapidRating > 1400;
  const isHighAccuracy = accuracy && accuracy > 85;
  
  return isHighRating || isHighAccuracy;
}

/**
 * Main compute function
 */
function computeScoutData(rawData, opponentUsername) {
  const { profile, stats, games } = rawData;
  
  // Filter to rated standard chess games
  const ratedGames = filterRatedGames(games, opponentUsername);
  
  return {
    profile,
    stats,
    openings: computeOpeningRepertoire(ratedGames, opponentUsername),
    accuracy: computeAccuracyTrend(ratedGames, opponentUsername),
    record: computeRecord(ratedGames, opponentUsername),
    avgGameLength: computeAvgGameLength(ratedGames),
    streak: computeStreak(ratedGames, opponentUsername),
    isSmurf: detectSmurf(profile, ratedGames, opponentUsername),
    totalRatedGames: ratedGames.length
  };
}

export { computeScoutData };
