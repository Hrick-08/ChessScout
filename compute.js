/**
 * Compute Module - Data parsing and statistics
 */

function getOpponentColor(game, opponentUsername) {
  const opp = opponentUsername.toLowerCase();
  if (game.white?.username?.toLowerCase() === opp) return 'white';
  if (game.black?.username?.toLowerCase() === opp) return 'black';
  return null;
}

function computeScoutData(rawData, opponentUsername) {
  const { profile, stats, games } = rawData;
  const opp = opponentUsername.toLowerCase();

  const ratedGames = games.filter(g =>
    g.rated && g.rules === 'chess' &&
    (g.white?.username?.toLowerCase() === opp || g.black?.username?.toLowerCase() === opp)
  );

  const getColor = g => getOpponentColor(g, opponentUsername);

  // Openings - Top 3 per color
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

  // Ratings history
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

  // Outcome categorization
  const getOutcomes = (color) => {
    const map = {};
    ratedGames.filter(g => getColor(g) === color).forEach(g => {
      const res = color === 'white' ? g.white?.result : g.black?.result;
      const oppRes = color === 'white' ? g.black?.result : g.white?.result;
      let label = 'Drawn';
      if (res === 'win') {
        const reason = oppRes === 'resigned' ? 'resignation' : oppRes === 'checkmated' ? 'checkmate' : oppRes === 'timeout' ? 'time' : oppRes === 'abandoned' ? 'abandonment' : 'other';
        label = `Won by ${reason}`;
      } else if (res === 'draw') {
        label = 'Drawn';
      } else {
        const reason = res === 'resigned' ? 'resignation' : res === 'checkmated' ? 'checkmate' : res === 'timeout' ? 'time' : res === 'abandoned' ? 'abandonment' : 'other';
        label = `Lost by ${reason}`;
      }
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  // Streak detection
  let streakCount = 0, streakType = null;
  const latest = [...chron].reverse();
  for (const g of latest) {
    const c = getColor(g);
    const res = c === 'white' ? g.white?.result : g.black?.result;
    if (!streakType) {
      if (res === 'draw') continue;
      streakType = res === 'win' ? 'win' : 'loss';
      streakCount = 1;
    } else if ((streakType === 'win' && res === 'win') || (streakType === 'loss' && res !== 'win' && res !== 'draw')) {
      streakCount++;
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
    streak: { type: streakType, count: streakCount },
    isSmurf: ((Date.now() - profile.joined * 1000) / 86400000 < 90) && ((stats.chess_rapid?.last?.rating > 1400) || (accW.length > 0 && Math.round(accW.reduce((a,b)=>a+b,0)/accW.length) > 85)),
    games: ratedGames
  };
}
