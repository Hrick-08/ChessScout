/**
 * Chess Scout - Content Script Entry Point
 * Manages badge injection and page detection
 */

function injectBadge(username, container) {
  if (container.querySelector('.chess-scout-badge')) return;

  const badge = document.createElement('span');
  badge.className = 'chess-scout-badge';
  badge.title = `Scout ${username}`;
  badge.style.backgroundImage = `url(${chrome.runtime.getURL('images/icon-16.png')})`;

  badge.addEventListener('click', e => {
    e.stopPropagation();
    
    // Detect mode for in-game scouting
    let initialMode = 'summary';
    if (detectPageType() === 'game') {
      initialMode = detectCurrentGameMode();
    }

    showLoading(); // From card.js
    fetchOpponentData(username) // From api.js
      .then(raw => {
        const scoutData = computeScoutData(raw, username); // From compute.js
        showModal(createCard(scoutData, initialMode)); // From card.js
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

/**
 * Detect the game mode (rapid, blitz, bullet, daily) from the DOM or URL
 */
function detectCurrentGameMode() {
  // 1. Check URL
  if (window.location.pathname.includes('/game/daily/')) return 'daily';
  
  // 2. Check for the "Time:" indicator in the sidebar (common in live games)
  const sidebar = document.body.textContent;
  if (sidebar.includes('Rapid') || sidebar.includes('10 min') || sidebar.includes('15 | 10')) return 'rapid';
  if (sidebar.includes('Blitz') || sidebar.includes('3 min') || sidebar.includes('5 min') || sidebar.includes('3 | 2')) return 'blitz';
  if (sidebar.includes('Bullet') || sidebar.includes('1 min') || sidebar.includes('2 | 1')) return 'bullet';
  
  // 3. Fallback to common Chess.com internal state if reachable (experimental)
  try {
    const timeClass = window.chesscom?.game?.timeClass || window.Config?.game?.timeClass;
    if (timeClass) return timeClass;
  } catch(e) {}

  return 'summary'; // Default to summary if unsure
}

function extractUsernameFromUrl() {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1] || parts[parts.length - 2];
}

function handleGamePage() {
  console.log('[Chess Scout] Starting game page observer...');
  
  const inject = () => {
    // Select all potential name elements directly
    const nameElements = document.querySelectorAll('[data-test-element="user-tagline-username"], .cc-user-username-component, .user-tagline-username, [class*="user-username-component"]');
    
    if (nameElements.length > 0) {
      console.log(`[Chess Scout] Found ${nameElements.length} potential name elements`);
    }

    nameElements.forEach(el => {
      const username = el.textContent.trim();
      if (username && username.length > 2) {
        const container = el.parentElement;
        if (container && !container.querySelector('.chess-scout-badge')) {
          if (['Opponent', 'Player', 'You', 'Settings', 'Time'].includes(username)) return;
          console.log(`[Chess Scout] Injecting badge for: ${username}`);
          injectBadge(username, container);
        }
      }
    });
  };

  const observer = new MutationObserver(inject);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial run
  inject();
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