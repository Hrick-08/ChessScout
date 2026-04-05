/**
 * Card Module - Chess Scout
 * Building the visual dashboard
 */

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
  
  const minAcc = 50, maxAcc = 100;
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