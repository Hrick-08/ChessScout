/**
 * Chess Scout - Content Script Entry Point
 * Manages badge injection and page detection
 */

function injectBadge(username, container) {
  if (container.querySelector('.chess-scout-badge')) return;

  const badge = document.createElement('span');
  badge.className = 'chess-scout-badge';
  badge.title = `Scout ${username}`;

  badge.addEventListener('click', e => {
    e.stopPropagation();
    showLoading(); // From card.js
    fetchOpponentData(username) // From api.js
      .then(raw => {
        const scoutData = computeScoutData(raw, username); // From compute.js
        showModal(createCard(scoutData)); // From card.js
      })
      .catch(err => {
        console.error('[Chess Scout]', err);
        document.getElementById('cs-backdrop')?.remove();
      });
  });

  container.appendChild(badge);
}

// ===== PAGE DETECTION =====

function detectPageType() {
  if (window.location.pathname.includes('/game/')) return 'game';
  if (window.location.pathname.includes('/member/') || window.location.pathname.includes('/profile/')) return 'profile';
  return 'other';
}

function extractUsernameFromUrl() {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1] || parts[parts.length - 2];
}

function extractUsernameFromTagline(el) {
  // Try various Chess.com name selectors
  const selectors = [
    '.cc-user-username-component',
    '.user-tagline-username',
    '[class*="username-component"]',
    '[class*="user-username"]'
  ];
  for (const s of selectors) {
    const found = el.querySelector(s);
    if (found && found.textContent.trim()) return found.textContent.trim();
  }
  return null;
}

function handleGamePage() {
  const observer = new MutationObserver(() => {
    // Scan for all player tagline containers
    const containers = document.querySelectorAll('.user-tagline-component, .player-component, .board-layout-player, .board-layout-top, .board-layout-bottom');
    
    containers.forEach(container => {
      const username = extractUsernameFromTagline(container);
      if (username) {
        // Find the specific identity block or just use the container
        const identityBlock = container.querySelector('.user-tagline-username, .cc-user-username-component') || container;
        injectBadge(username, identityBlock.parentElement || identityBlock);
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

function handleProfilePage() {
  const username = extractUsernameFromUrl();
  if (!username) return;

  setTimeout(() => {
    const headers = document.querySelectorAll('h1, h2, [class*="username"], [class*="profile"]');
    for (const header of headers) {
      if (header.textContent?.toLowerCase().includes(username.toLowerCase())) {
        injectBadge(username, header);
        break;
      }
    }
  }, 500);
}

// ===== INIT =====

function init() {
  const page = detectPageType();
  if (page === 'game') handleGamePage();
  else if (page === 'profile') handleProfilePage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}