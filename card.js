/**
 * Card Module - Chess Scout
 * Redesigned UI with cleaner stat visualization
 */

const CARD_STYLES = `
  #chess-scout-card {
    position: fixed;
    top: 80px;
    right: 20px;
    width: 300px;
    max-height: 90vh;
    overflow-y: auto;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    scrollbar-width: thin;
    scrollbar-color: #444 transparent;
  }
  #chess-scout-card::-webkit-scrollbar { width: 4px; }
  #chess-scout-card::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }

  .sc-inner {
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 10px;
    overflow: hidden;
  }

  /* Header */
  .sc-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 14px 10px;
    border-bottom: 1px solid #2a2a2a;
    position: relative;
  }
  .sc-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #333;
    flex-shrink: 0;
  }
  .sc-avatar-fallback {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #2a2a2a;
    border: 2px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: #888;
    flex-shrink: 0;
  }
  .sc-user-info { flex: 1; min-width: 0; }
  .sc-username {
    font-size: 15px;
    font-weight: 600;
    color: #f0f0f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sc-online-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4caf50;
    flex-shrink: 0;
  }
  .sc-league {
    font-size: 11px;
    color: #888;
    margin-top: 2px;
  }
  .sc-close {
    background: none;
    border: none;
    color: #666;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    position: absolute;
    top: 10px;
    right: 12px;
    transition: color 0.15s;
  }
  .sc-close:hover { color: #ccc; }

  /* Ratings */
  .sc-ratings {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: #2a2a2a;
    border-bottom: 1px solid #2a2a2a;
  }
  .sc-rating-chip {
    background: #1e1e1e;
    padding: 10px 8px;
    text-align: center;
  }
  .sc-rating-label {
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 3px;
  }
  .sc-rating-value {
    font-size: 17px;
    font-weight: 600;
    color: #f0f0f0;
  }
  .sc-rating-value.muted { color: #555; }

  /* Stat chips row */
  .sc-chips {
    display: flex;
    gap: 6px;
    padding: 10px 14px;
    border-bottom: 1px solid #2a2a2a;
    flex-wrap: wrap;
  }
  .sc-chip {
    background: #2a2a2a;
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 12px;
    color: #bbb;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .sc-chip-label { color: #666; font-size: 11px; }
  .sc-chip.win-streak { background: #1a2e1a; color: #4caf50; }
  .sc-chip.loss-streak { background: #2e1a1a; color: #e57373; }
  .sc-chip.acc-up { color: #4caf50; }
  .sc-chip.acc-down { color: #e57373; }

  /* Section */
  .sc-section {
    padding: 10px 14px;
    border-bottom: 1px solid #2a2a2a;
  }
  .sc-section:last-child { border-bottom: none; }
  .sc-section-title {
    font-size: 10px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 8px;
  }

  /* Opening rows */
  .sc-opening-row {
    display: grid;
    grid-template-columns: 1fr 52px 30px;
    align-items: center;
    gap: 8px;
    margin-bottom: 7px;
  }
  .sc-opening-row:last-child { margin-bottom: 0; }
  .sc-opening-name {
    font-size: 12px;
    color: #ccc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sc-opening-bar-wrap {
    height: 5px;
    background: #2a2a2a;
    border-radius: 3px;
    overflow: hidden;
  }
  .sc-opening-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  .sc-opening-meta {
    font-size: 11px;
    color: #666;
    text-align: right;
    white-space: nowrap;
  }
  .sc-opening-winpct {
    font-size: 11px;
    text-align: right;
    font-weight: 500;
  }
  .sc-opening-winpct.high { color: #4caf50; }
  .sc-opening-winpct.mid { color: #ffa726; }
  .sc-opening-winpct.low { color: #e57373; }

  /* W/L/D bar */
  .sc-wld-bar {
    height: 7px;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    margin-bottom: 6px;
  }
  .sc-wld-bar-w { background: #4caf50; }
  .sc-wld-bar-l { background: #e57373; }
  .sc-wld-bar-d { background: #555; }
  .sc-wld-labels {
    display: flex;
    gap: 12px;
    font-size: 11px;
  }
  .sc-wld-w { color: #4caf50; }
  .sc-wld-l { color: #e57373; }
  .sc-wld-d { color: #888; }

  /* Smurf warning */
  .sc-smurf {
    margin: 0 14px 10px;
    background: #2e2500;
    border: 1px solid #5a4500;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 11px;
    color: #ffa726;
  }
  .sc-smurf-title { font-weight: 600; margin-bottom: 2px; }

  /* Footer */
  .sc-footer {
    padding: 8px 14px;
    font-size: 10px;
    color: #444;
    text-align: center;
    border-top: 1px solid #2a2a2a;
  }

  /* Skeleton */
  .sc-skeleton-pulse {
    background: linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%);
    background-size: 200% 100%;
    animation: sc-pulse 1.4s ease infinite;
    border-radius: 4px;
  }
  @keyframes sc-pulse {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

function injectStyles() {
  if (document.getElementById('chess-scout-styles')) return;
  const style = document.createElement('style');
  style.id = 'chess-scout-styles';
  style.textContent = CARD_STYLES;
  document.head.appendChild(style);
}

function formatRating(rating) {
  return rating ? `${rating}` : '—';
}

function getLeagueLabel(league) {
  if (!league) return '';
  return league + ' League';
}

function getOpeningBarColor(winPct) {
  if (winPct >= 60) return '#4caf50';
  if (winPct >= 40) return '#ffa726';
  return '#e57373';
}

function getWinPctClass(winPct) {
  if (winPct >= 60) return 'high';
  if (winPct >= 40) return 'mid';
  return 'low';
}

function createHeader(scoutData) {
  const { profile } = scoutData;
  const isOnline = profile.status === 'online';
  const league = getLeagueLabel(profile.league);
  const onlineDot = isOnline ? '<span class="sc-online-dot"></span>' : '';
  const initial = (profile.username || '?')[0].toUpperCase();

  const avatarHtml = profile.avatar
    ? `<img src="${profile.avatar}" class="sc-avatar" alt="${profile.username}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
       <div class="sc-avatar-fallback" style="display:none">${initial}</div>`
    : `<div class="sc-avatar-fallback">${initial}</div>`;

  return `
    <div class="sc-header">
      ${avatarHtml}
      <div class="sc-user-info">
        <div class="sc-username">${profile.username} ${onlineDot}</div>
        <div class="sc-league">${league}</div>
      </div>
      <button class="sc-close" title="Close">×</button>
    </div>
  `;
}

function createRatings(scoutData) {
  const { stats } = scoutData;
  const rapid = stats.chess_rapid?.last?.rating;
  const blitz = stats.chess_blitz?.last?.rating;
  const bullet = stats.chess_bullet?.last?.rating;

  const chip = (label, val) => `
    <div class="sc-rating-chip">
      <div class="sc-rating-label">${label}</div>
      <div class="sc-rating-value ${!val ? 'muted' : ''}">${formatRating(val)}</div>
    </div>`;

  return `<div class="sc-ratings">${chip('Rapid', rapid)}${chip('Blitz', blitz)}${chip('Bullet', bullet)}</div>`;
}

function createChips(scoutData) {
  const { accuracy, avgGameLength, streak } = scoutData;

  const chips = [];

  if (accuracy.avg) {
    const trendIcon = accuracy.trend === 'improving' ? '↑' : accuracy.trend === 'declining' ? '↓' : '';
    const trendClass = accuracy.trend === 'improving' ? 'acc-up' : accuracy.trend === 'declining' ? 'acc-down' : '';
    chips.push(`<div class="sc-chip ${trendClass}">
      <span class="sc-chip-label">Accuracy</span> ${accuracy.avg}% ${trendIcon}
    </div>`);
  }

  if (avgGameLength) {
    chips.push(`<div class="sc-chip">
      <span class="sc-chip-label">Avg length</span> ${avgGameLength}mv
    </div>`);
  }

  if (streak.type && streak.count >= 2) {
    const cls = streak.type === 'win' ? 'win-streak' : 'loss-streak';
    const label = streak.type === 'win' ? `W${streak.count} streak` : `L${streak.count} streak`;
    chips.push(`<div class="sc-chip ${cls}">${label}</div>`);
  }

  if (chips.length === 0) return '';
  return `<div class="sc-chips">${chips.join('')}</div>`;
}

function createOpeningRows(openings, color) {
  if (!openings || openings.length === 0) return '<div style="color:#555;font-size:12px;">No data</div>';

  const maxPlayed = openings[0].played;

  return openings.map(op => {
    const winPct = Math.round(op.winPercent);
    const barWidth = Math.round((op.played / maxPlayed) * 100);
    const barColor = getOpeningBarColor(winPct);
    const pctClass = getWinPctClass(winPct);

    // Shorten opening name: strip color-specific suffixes after the main name
    const nameParts = op.name.split(' ');
    const shortName = nameParts.slice(0, 4).join(' ');

    return `
      <div class="sc-opening-row" title="${op.name}">
        <div class="sc-opening-name">${shortName}</div>
        <div class="sc-opening-bar-wrap">
          <div class="sc-opening-bar-fill" style="width:${barWidth}%; background:${barColor};"></div>
        </div>
        <div class="sc-opening-winpct ${pctClass}">${winPct}%</div>
      </div>
    `;
  }).join('');
}

function createOpenings(scoutData) {
  const { openings } = scoutData;
  if (!openings.asWhite.length && !openings.asBlack.length) return '';

  let html = '';

  if (openings.asWhite.length) {
    html += `
      <div class="sc-section">
        <div class="sc-section-title">As White</div>
        ${createOpeningRows(openings.asWhite, 'white')}
      </div>`;
  }

  if (openings.asBlack.length) {
    html += `
      <div class="sc-section">
        <div class="sc-section-title">As Black</div>
        ${createOpeningRows(openings.asBlack, 'black')}
      </div>`;
  }

  return html;
}

function createRecord(scoutData) {
  const { record } = scoutData;

  let w = 0, l = 0, d = 0;
  Object.values(record).forEach(tc => { w += tc.win; l += tc.loss; d += tc.draw; });

  const total = w + l + d;
  if (total === 0) return '';

  const wp = (w / total) * 100;
  const lp = (l / total) * 100;
  const dp = (d / total) * 100;

  return `
    <div class="sc-section">
      <div class="sc-section-title">Overall record</div>
      <div class="sc-wld-bar">
        <div class="sc-wld-bar-w" style="width:${wp}%"></div>
        <div class="sc-wld-bar-l" style="width:${lp}%"></div>
        <div class="sc-wld-bar-d" style="width:${dp}%"></div>
      </div>
      <div class="sc-wld-labels">
        <span class="sc-wld-w">${w}W</span>
        <span class="sc-wld-l">${l}L</span>
        <span class="sc-wld-d">${d}D</span>
        <span style="color:#444;margin-left:auto">${total} games</span>
      </div>
    </div>
  `;
}

function createSmurfWarning(isSmurf) {
  if (!isSmurf) return '';
  return `
    <div class="sc-smurf">
      <div class="sc-smurf-title">⚠ New account</div>
      <div>High skill indicators on a recent account. Play with caution.</div>
    </div>
  `;
}

function createScoutCard(scoutData) {
  injectStyles();

  const card = document.createElement('div');
  card.id = 'chess-scout-card';

  card.innerHTML = `
    <div class="sc-inner">
      ${createHeader(scoutData)}
      ${createRatings(scoutData)}
      ${createChips(scoutData)}
      ${createOpenings(scoutData)}
      ${createRecord(scoutData)}
      ${createSmurfWarning(scoutData.isSmurf)}
      <div class="sc-footer">Chess Scout · last 3 months</div>
    </div>
  `;

  card.querySelector('.sc-close').addEventListener('click', () => card.remove());

  return card;
}

function injectCard(scoutData) {
  const existing = document.getElementById('chess-scout-card');
  if (existing) existing.remove();

  const card = createScoutCard(scoutData);
  document.body.appendChild(card);

  // Position near the board
  const board = document.querySelector('[class*="board-container"]') ||
                document.querySelector('[class*="game-board"]') ||
                document.querySelector('chess-board');
  if (board) {
    setTimeout(() => {
      const rect = board.getBoundingClientRect();
      card.style.top = `${Math.max(10, rect.top)}px`;
    }, 0);
  }
}

function injectLoadingSkeleton() {
  injectStyles();

  const existing = document.getElementById('chess-scout-card');
  if (existing) existing.remove();

  const card = document.createElement('div');
  card.id = 'chess-scout-card';

  card.innerHTML = `
    <div class="sc-inner" style="padding:14px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div class="sc-skeleton-pulse" style="width:38px;height:38px;border-radius:50%;flex-shrink:0;"></div>
        <div style="flex:1;">
          <div class="sc-skeleton-pulse" style="height:13px;width:70%;margin-bottom:6px;"></div>
          <div class="sc-skeleton-pulse" style="height:10px;width:40%;"></div>
        </div>
      </div>
      <div class="sc-skeleton-pulse" style="height:52px;border-radius:6px;margin-bottom:10px;"></div>
      <div class="sc-skeleton-pulse" style="height:10px;width:40%;margin-bottom:8px;"></div>
      <div class="sc-skeleton-pulse" style="height:11px;margin-bottom:6px;"></div>
      <div class="sc-skeleton-pulse" style="height:11px;margin-bottom:6px;width:85%;"></div>
      <div class="sc-skeleton-pulse" style="height:11px;margin-bottom:14px;width:90%;"></div>
      <div class="sc-skeleton-pulse" style="height:10px;width:40%;margin-bottom:8px;"></div>
      <div class="sc-skeleton-pulse" style="height:11px;margin-bottom:6px;"></div>
      <div class="sc-skeleton-pulse" style="height:11px;width:80%;"></div>
    </div>
  `;

  document.body.appendChild(card);

  const board = document.querySelector('[class*="board-container"]') ||
                document.querySelector('[class*="game-board"]') ||
                document.querySelector('chess-board');
  if (board) {
    setTimeout(() => {
      const rect = board.getBoundingClientRect();
      card.style.top = `${Math.max(10, rect.top)}px`;
    }, 0);
  }
}

export { createScoutCard, injectCard, injectLoadingSkeleton };