# Chess Scout - Architecture Guide

Understanding how Chess Scout works and where the code lives.

## High-Level Flow

```
User starts a game on chess.com/game/*
         ↓
Content script (content.js) injects into page
         ↓
MutationObserver detects opponent username
         ↓
fetch() calls Chess.com API for profile, stats, games
         ↓
Parse game data, compute statistics
         ↓
Build card HTML and inject into DOM
         ↓
User sees scouting card with opponent insights
```

## Code Organization

### Entry Point: `content.js`

**Size:** ~1100 lines (includes everything)

**Responsibilities:**
- Inject CSS styles (`.chess-scout-*` classes)
- Set up MutationObserver to watch for opponent username
- Orchestrate API calls
- Compute statistics from raw data
- Build and render the card UI

**Key Functions:**
- `init()` — Called on page load, starts observation
- `extractOpponentUsername()` — Finds opponent name in DOM
- `startObservingForOpponent()` — Sets up MutationObserver
- `fetchOpponentData(username)` — Main API orchestrator
- `computeScoutData(rawData, username)` — Processes game data into insights
- `injectCard(scoutData)` — Renders card on page

### Reference Implementations (Non-functional, for documentation)

#### `api.js`
**Purpose:** Demonstrates modular API layer

Shows how to structure API calls separately:
- `fetchOpponentData()` — Main entry point
- `fetchPlayerProfile(username)`
- `fetchPlayerStats(username)`
- `fetchGameArchives(username)`
- `fetchGamesMonth(username, year, month)`
- Custom caching logic with TTL

#### `compute.js`
**Purpose:** Demonstrates data computation logic

Shows how to parse and compute stats:
- `computeScoutData()` — Main orchestrator
- `computeOpeningRepertoire()` — Parse openings from PGN
- `computeAccuracyTrend()` — Extract & trend accuracy
- `computeRecord()` — Aggregate W/L/D
- `computeAvgGameLength()` — Count moves
- `computeStreak()` — Find win/loss streaks
- `detectSmurf()` — Flag suspicious new accounts

#### `card.js`
**Purpose:** Demonstrates UI building logic

Shows how to construct the card:
- `createScoutCard(scoutData)` — Build DOM tree
- `injectCard(scoutData)` — Insert into page
- `injectLoadingSkeleton()` — Show loading state
- Helper functions for each section

### Non-Modular Files

#### `styles.css`
All CSS is currently inlined in `content.js`. To use this separately:

1. Remove the `style.textContent = \`...\`` from `injectStyles()` in content.js
2. Add CSS file to manifest:
   ```json
   "content_scripts": [
     {
       "matches": ["*://chess.com/game/*"],
       "css": ["styles.css"],
       "js": ["content.js"]
     }
   ]
   ```

#### `manifest.json`
Defines:
- Extension name, version, description
- Required permissions (storage, activeTab)
- Host permissions (chess.com, api.chess.com)
- Content script injection rules
- Icons/branding

## Data Flow

### 1. Opponent Detection (Continuous)

```
MutationObserver watches whole page
           ↓
DOM changes trigger callback
           ↓
extractOpponentUsername() scans for name
           ↓
If not seen before → Trigger fetch
```

**Why MutationObserver?**
- Watches entire DOM tree for any changes
- Fires on element additions/removals
- Doesn't interrupt page performance
- Works with chess.com's dynamic UI updates

### 2. Data Fetching (Single Request Chain)

```
fetchOpponentData(username)
  ├─ Check cache for existing data
  │  └─ If valid (< 24h old) → Return cached
  │
  └─ Otherwise, fetch fresh:
     ├─ parallel: Profile + Stats (Promise.all)
     ├─ >> Archives list (use to find months)
     ├─ >> Games for each of last 3 months
     │    (300ms delay between each month)
     └─ Cache entire result with timestamp
```

**Cache Structure:**
```javascript
// In chrome.storage.local:
{
  "cache_magnuscarlsen": {
    "data": {
      "profile": { ... },
      "stats": { ... },
      "games": [ ... ]
    },
    "timestamp": 1695000000000
  }
}
```

**Why cache?**
- API calls are slow (200-500ms each)
- Playing 10 games against same opponent = 10x redundant fetches
- Matches already complete, so data doesn't change rapidly
- 24h TTL is reasonable for long-term trends

### 3. Data Computation (Client-side)

```
computeScoutData(rawData, username)
  │
  ├─ Filter to rated standard chess games only
  │  └─ Skip unrated, 960, bughouse, etc.
  │
  ├─ For each opening in last 3 months:
  │  ├─ Parse [ECOUrl] from PGN
  │  ├─ Count frequency per color
  │  ├─ Calculate win % per opening
  │  └─ Keep top 3 per color
  │
  ├─ For accuracy:
  │  ├─ Extract from each game (may be blank)
  │  ├─ Average last 20 games
  │  └─ Compare last 5 vs previous to detect trend
  │
  ├─ For record:
  │  ├─ Tally W/L/D per time control
  │  └─ Show as proportional bar
  │
  ├─ For streak:
  │  ├─ Sort games by recency
  │  ├─ Count consecutive same result
  │  └─ Stop at first different result
  │
  ├─ For smurf check:
  │  ├─ Calculate account age
  │  ├─ Check rating + accuracy
  │  └─ Flag if new + high skill
  │
  └─ Return fully computed scoutData object
```

**Why client-side computation?**
- Already have all the data
- Interactive (can't store pre-computed stats for all users)
- Flexible (can tweak thresholds without server changes)
- User privacy (no server sees what you scout)

### 4. Card Rendering (Progressive)

```
injectLoadingSkeleton()  ← Show immediately
       ↓ (setTimeout logic)
fetch data
       ↓
computeScoutData()
       ↓
createScoutCard()  ← Build HTML tree
       ↓
injectCard()  ← Replace skeleton with real card
```

**Why progressive?**
- Skeleton shows within 100ms (feels fast)
- Data arrives in 300-1000ms (acceptable)
- User sees loading state, not blank page
- Better perceived performance

## Performance Characteristics

### Timing Breakdown (typical)

```
MutationObserver triggers         ~50ms after username appears
(random, depends on page)

extractOpponentUsername()         ~1-5ms
(just DOM queries)

Check cache                       sync, <1ms

Cache hit: done!                  →5ms total to show cached card

Cache miss:
├─ Profile fetch                 ~200-400ms (network latency)
├─ Stats fetch (parallel)        ~200-400ms (network latency)
├─ Archives fetch                ~100-200ms
├─ Month 1 fetch                 ~150ms
├─ Month 2 fetch                 ~150ms (+ 300ms delay)
├─ Month 3 fetch                 ~150ms (+ 300ms delay)
└─ Compute statistics            ~50-100ms (CPU bound)

Total: ~1.5-2.5 seconds for full run
      Then ~5-10ms for cached repeat
```

### Memory Usage

- **Card DOM:** ~50KB (HTML nodes, styles)
- **Cache per opponent:** ~200-500KB (raw API data)
- **Multiple opponents cached:** Grows with number
- **Cleanup:** Automatic after 24 hours per opponent

**Note:** Chrome's extension storage limit is typically 10MB, so you can cache ~20-50 opponents.

## Security & Privacy

### No Personal Data Collected
- Extension doesn't report your viewing to any server
- Opponent data comes from public Chess.com API
- Cache is local storage only (chrome.storage.local)

### API Rate Limiting
- Chess.com has unannounced rate limits
- Extension adds 300ms delay between monthly archive fetches
- If rate limited (403/429), waits and retries
- Cache prevents repeated requests per opponent

### Content Security Policy
- Inline styles/scripts (no external resources)
- No network requests except to api.chess.com
- No access to other chess.com features (just reads public API)

## Error Handling

### API Failures

```javascript
try {
  data = await fetchOpponentData(username)
} catch (error) {
  console.error('[Chess Scout] API Error:', error)
  // Card not shown, no error displayed to user
}
```

Each API call handles 404 gracefully:
```javascript
async function fetchGamesMonth(...) {
  const response = await fetch(...)
  if (!response.ok) return null  // Silently skip
  return response.json()
}
```

### Missing Data

- No accuracy data? → Shows "—"
- No rapid rating? → Shows "—"
- No openings? → Omits section
- No games? → Shows "No games" (conceptually)

## Browser Compatibility

| Feature | Chrome | Edge | Brave | Opera | Firefox |
|---------|--------|------|-------|-------|---------|
| Manifest V3 | ✅ 88+ | ✅ 88+ | ✅ | ✅ | ❌ (uses MV2) |
| Content Scripts | ✅ | ✅ | ✅ | ✅ | ✅ |
| MutationObserver | ✅ | ✅ | ✅ | ✅ | ✅ |
| chrome.storage.local | ✅ | ✅ | ✅ | ✅ | ❌ (uses browser.storage) |
| Fetch API | ✅ | ✅ | ✅ | ✅ | ✅ |

**Firefox Note:** You'd need to port to WebExtensions API (browser.* instead of chrome.*).

## Design Decisions

### Why MutationObserver Instead of setInterval?

```javascript
// ❌ Inefficient polling:
setInterval(() => {
  username = extractOpponentUsername()
  if (username !== lastUsername) { /* process */ }
}, 1000)

// ✅ Efficient observation:
observer = new MutationObserver(() => {
  username = extractOpponentUsername()
  if (username !== lastUsername) { /* process */ }
})
observer.observe(document.body, { childList: true, subtree: true })
```

- Polling: Runs every second regardless of changes (100% CPU waste)
- Observer: Only runs when DOM changes (near 0% when idle)

### Why Inline Styles Instead of External CSS?

Content scripts can inject CSS, but:
- External file adds extra network fetch
- Inlining ensures styles load with script
- Easier to bundle later if needed

### Why YYYY/MM Months Instead of Hardcoding?

```javascript
// ❌ Error-prone hardcoding:
const months = ['2023/09', '2023/10', '2023/11']

// ✅ Dynamic calculation:
const archives = await fetchGameArchives(username)
const months = getLastThreeMonths(archives)
```

- Player may have no games in some months (404)
- Current month may not exist yet
- API handles all the complexity

## Future Architecture Improvements

1. **Extract to Modular Files**
   - Set up build process (webpack/esbuild)
   - Split content.js into api.js, compute.js, card.js
   - Improved testing and maintainability

2. **Add Service Worker**
   - Background processing
   - Scheduled cache cleanup
   - Keyboard shortcuts

3. **Add Options Page**
   - User can configure cache TTL
   - Toggle sections (openings, accuracy, etc.)
   - Dark/light mode toggle

4. **Add Persistent Data**
   - Store opponent stats locally
   - Build matchup history
   - Personal notes per opponent

5. **Performance Optimization**
   - Web Workers for compute-heavy tasks
   - IndexedDB for larger data sets
   - Lazy load card sections

---

**Last Updated:** April 2026  
**Current Version:** 1.0.0  
**Status:** MVP Complete
