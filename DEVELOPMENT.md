# Chess Scout - Development Guide

This guide covers installation, testing, and debugging the Chess Scout extension.

## Quick Start

### 1. Load the Extension in Chrome

1. Open Chrome and go to **`chrome://extensions/`**
2. Enable **"Developer mode"** (toggle at top-right corner)
3. Click **"Load unpacked"**
4. Navigate to the Chess Scout folder and select it
5. The extension should now appear in your extensions list with an entry ID

### 2. Test the Extension

1. Go to **https://chess.com/game** (or play a quick game)
2. Start a new game (live or correspondence)
3. Once a game board appears and the opponent's username loads, the scouting card should appear in the top-right corner
4. The card should show a loading skeleton briefly, then populate with data

## Testing Locally

### Test Different Opponents

1. Play games against different opponents to test with various username lengths and special characters
2. Test with:
   - New accounts (< 90 days old)
   - High-rated players
   - Players with few games
   - Players with no games in a time control

### Manual API Testing

Open Chrome DevTools (F12) and run these commands in the Console:

```javascript
// Test API access
fetch('https://api.chess.com/pub/player/magnuscarlsen')
  .then(r => r.json())
  .then(d => console.log('Profile:', d))

fetch('https://api.chess.com/pub/player/magnuscarlsen/stats')
  .then(r => r.json())
  .then(d => console.log('Stats:', d))

fetch('https://api.chess.com/pub/player/magnuscarlsen/games/archives')
  .then(r => r.json())
  .then(d => console.log('Archives:', d.archives.slice(-3)))
```

### Clear Cache Between Tests

To force a fresh fetch (bypass cache):

```javascript
chrome.storage.local.clear(() => console.log('Cache cleared'))
```

View cached data:

```javascript
chrome.storage.local.get(null, (items) => console.log('Cache:', items))
```

## Debugging

### Enable Detailed Logging

The extension outputs logs prefixed with `[Chess Scout]` to the console. Check:

1. **Content script logs** — Right-click any chess.com page → "Inspect" → Console tab
2. **Extension background logs** — chrome://extensions → Chess Scout → "Service Worker" or "Background page"

### Common Issues and Solutions

#### Issue: Card Not Appearing

**Possible causes:**
- Opponent username not detected
- API call failed (check network tab in DevTools)
- Card DOM selector not matching chess.com's layout

**Debug steps:**
1. Open DevTools Console (F12)
2. Look for `[Chess Scout] Detected opponent:` log
3. If not there, opponent detection is failing. Try this:
   ```javascript
   // Find all text nodes containing usernames
   const walker = document.createTreeWalker(
     document.body, 
     NodeFilter.SHOW_TEXT, 
     null, 
     false
   );
   let node;
   while (node = walker.nextNode()) {
     if (node.textContent.includes('profile') || node.textContent.length < 20) {
       console.log(node.textContent, node.parentElement);
     }
   }
   ```

#### Issue: Wrong Opponent Detected

Chess.com's DOM structure may have changed. To fix:
1. Open DevTools
2. Find the opponent's username element: Right-click → "Inspect"
3. Note the class names or data attributes
4. Update `extractOpponentUsername()` in `content.js` with the new selectors

#### Issue: API Rate Limiting (403/429)

Chess.com API has rate limits. Solutions:
1. **Wait** — Wait 15-60 minutes before making requests
2. **Clear cache** — `chrome.storage.local.clear()`
3. **Change username** — Play against different opponents

#### Issue: Styles Not Applying

1. Check if styles are injected: DevTools → Elements → Look for `<style>` tag with `.chess-scout-card`
2. Verify z-index conflict: If card hidden behind other elements, increase `z-index` in `content.js` (currently 10000)
3. Check for page-wide CSS overrides: Some pages may have aggressive `!important` rules

### View Extension Files

After loading unpacked, you can view/edit files:
1. **chrome://extensions/** → Chess Scout → "Inspect views" (if available) → Console
2. Files are not directly editable in Chrome; edit the source files and reload:
   - Edit the .js/.css files in your editor
   - In chrome://extensions/, click the refresh icon

## Code Structure

### `manifest.json`
- Defines extension metadata, permissions, and content script injection
- Content script runs on `*://chess.com/game/*` pages

### `content.js`
- **Entry point** for the extension
- Injects styles into page
- Uses **MutationObserver** to detect opponent username
- Orchestrates API calls and card rendering
- Contains all functionality (inlined for simplicity)

### `api.js` (currently in content.js)
- Fetch wrapper around Chess.com Public API
- Implements caching with TTL validation
- Handles rate limiting with delays between requests
- Functions:
  - `fetchOpponentData(username)` — Main entry point
  - `fetchPlayerProfile(username)` — GET /player/{username}
  - `fetchPlayerStats(username)` — GET /player/{username}/stats
  - `fetchGameArchives(username)` — GET /player/{username}/games/archives
  - `fetchGamesMonth(username, year, month)` — GET /player/{username}/games/{YYYY}/{MM}

### `compute.js` (currently in content.js)
- Parses and computes statistics from raw API data
- Functions:
  - `computeScoutData(rawData, opponentUsername)` — Main function
  - `filterRatedGames()` — Filter to rated standard chess only
  - `computeOpeningRepertoire()` — Parse PGN, count openings, calculate win%
  - `computeAccuracyTrend()` — Extract and trend accuracy data
  - `computeRecord()` — Aggregate W/L/D per time control
  - `computeAvgGameLength()` — Count moves in PGN
  - `computeStreak()` — Find consecutive wins/losses
  - `detectSmurf()` — Flag new accounts with high rating/accuracy

### `card.js` (currently in content.js)
- Builds HTML for the scouting card
- Injects card into page DOM
- Processes click events (close button)
- Functions:
  - `createScoutCard(scoutData)` — Builds card DOM
  - `injectCard(scoutData)` — Inserts card into page
  - `injectLoadingSkeleton()` — Shows loading state

### `styles.css` (currently in content.js)
- Dark theme matching chess.com
- `.chess-scout-card` — Main card container
- `.scout-*` — Component classes
- Responsive adjustments for mobile

## Making Changes

### Add New Statistic

Example: Add "Most common time control"

1. In `compute.js`, add a function:
   ```javascript
   const computeMostCommonTimeControl = (games) => {
     const counts = {};
     games.forEach(g => {
       const tc = g.time_class || 'blitz';
       counts[tc] = (counts[tc] || 0) + 1;
     });
     return Object.entries(counts).sort((a,b) => b[1] - a[1])[0][0];
   };
   ```

2. Add to `computeScoutData()` return object:
   ```javascript
   mostCommonTimeControl: computeMostCommonTimeControl(ratedGames),
   ```

3. In `card.js`, create a display function:
   ```javascript
   <div class="stat-item">
     <div class="stat-label">Preferred Time</div>
     <div class="stat-value">${scoutData.mostCommonTimeControl}</div>
   </div>
   ```

### Change Card Styling

Edit the `style.textContent` in `injectStyles()` in content.js. Or better, create a separate `styles.css` file and inject it properly.

### Update API Endpoints

Chess.com may change their API. Update endpoint URLs in `fetchPlayerProfile()`, `fetchPlayerStats()`, etc.

## Performance Tips

- **Network waterfall** — DevTools → Network tab → reload page, check request order and latency
- **Long tasks** — DevTools → Performance → Record, play games, check for main thread blocking
- **Memory leaks** — DevTools → Memory → Take snapshots, compare before/after multiple rematch/scout cycles

## Publishing to Chrome Web Store

When ready to release:

1. Create privacy policy
2. Create store listing (screenshots, description)
3. Prepare:
   - Proper icons (16x16, 48x48, 128x128 PNG)
   - Store images (1280x800 PNG)
4. Submit to Chrome Web Store: https://chrome.google.com/webstore/devconsole/

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Card appears when game starts
- [ ] Card shows loading skeleton
- [ ] Card populates with correct data
- [ ] Close button removes card
- [ ] Cache persists between games
- [ ] Smurf warning appears for new accounts
- [ ] Works on different opponents
- [ ] Works with no accuracy data
- [ ] Works with few games
- [ ] Rematch opens fresh card
- [ ] Card styles match chess.com theme
- [ ] No console errors

## Keyboard Shortcuts (Optional)

You can add a keyboard shortcut to manually trigger the card:

In `manifest.json`:
```json
"commands": {
  "toggle-card": {
    "suggested_key": {
      "default": "Ctrl+Shift+S",
      "mac": "Command+Shift+S"
    },
    "description": "Show/hide scouting card"
  }
}
```

Then handle in `background.js` if you create one.

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Chess.com API Docs](https://www.chess.com/news/view/published-data-api)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/mv3-migration/)
