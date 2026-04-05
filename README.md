<div align="center">

```
 ██████╗██╗  ██╗███████╗███████╗███████╗
██╔════╝██║  ██║██╔════╝██╔════╝██╔════╝
██║     ███████║█████╗  ███████╗███████╗
██║     ██╔══██║██╔══╝  ╚════██║╚════██║
╚██████╗██║  ██║███████╗███████║███████║
 ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝

 ███████╗ ██████╗ ██████╗ ██╗   ██╗████████╗
 ██╔════╝██╔════╝██╔═══██╗██║   ██║╚══██╔══╝
 ███████╗██║     ██║   ██║██║   ██║   ██║   
 ╚════██║██║     ██║   ██║██║   ██║   ██║   
 ███████║╚██████╗╚██████╔╝╚██████╔╝   ██║   
 ╚══════╝ ╚═════╝ ╚═════╝  ╚═════╝    ╚═╝   
```


# Chess Scout


### Opponent Intelligence for Chess.com

*Instantly analyze your opponent’s ratings, openings, and playstyle before the first move.*

[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](#)
[![Manifest](https://img.shields.io/badge/Manifest-V3-34A853?style=flat-square)](#)
[![API](https://img.shields.io/badge/Data-Chess.com_Public_API-000000?style=flat-square)](#)
[![No Framework](https://img.shields.io/badge/Framework-None-lightgrey?style=flat-square)](#)

---

### 🚀 [See the Full Installation Guide](INSTALL.md)

---

A Chrome Extension (Manifest V3) that displays opponent scouting cards on chess.com when a game starts. Get instant insights into your opponent's playing style, ratings, opening preferences, and more.

</div>

## Features

- 🎯 **Automatic Opponent Detection** — Displays a scouting card as soon as a game starts
- 📊 **Comprehensive Stats** — Rating history (Rapid, Blitz, Bullet), W/L/D record, accuracy, and more
- 📚 **Opening Analysis** — Top 3 opening repertoire with win rates, separated by color
- 🔄 **Smart Caching** — Caches opponent data for 24 hours to reduce API calls
- ⚡ **Fast Performance** — Parallel API fetches, progressive card rendering
- 🎨 **Dark UI** — Matches chess.com's dark theme seamlessly
- 🚨 **Smurf Detection** — Warns if opponent is a new account with high skill indicators [FUTURE SCOPE]

## Installation

### For Quick Setup

1. **Clone/Download** this repository to your machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle at top right)
4. **Click "Load unpacked"** and select the `Chess Scout` folder

**For more detailed instructions, including Edge/Brave/Firefox (if supported) steps, see the [Installation Guide](installation-guide.md).**

### For Users

Once published, the extension will be available on the Chrome Web Store.

## File Structure

```
Chess Scout/
├── images                 # Images for icons
├── api.js                 # Chess.com API calls and caching
├── card.js                # Card UI building
├── compute.js             # Data parsing and statistics computation
├── content.js             # Main content script with MutationObserver
├── manifest.json          # Extension configuration (Manifest V3)
├── README.md              # This file
└── styles.css             # Card styling
```

## How It Works

1. **Content Script** (`content.js`) injects into chess.com/game/* pages
2. **MutationObserver** detects when opponent username appears in the DOM
3. **API Module** (`api.js`) fetches profile, stats, and game history from chess.com's public API
4. **Compute Module** (`compute.js`) parses PGN data and computes statistics
5. **Card Module** builds the HTML UI and injects it into the page
6. **Cache** stores results in `chrome.storage.local` with 24-hour expiration

## Data Sources

All data comes from the **Chess.com Public API** (no authentication required):

- `/player/{username}` — Profile info (avatar, country, league, status)
- `/player/{username}/stats` — Current ratings and records
- `/player/{username}/games/archives` — List of available game archives
- `/player/{username}/games/{YYYY}/{MM}` — Games for each month

## Computed Statistics

### Opening Repertoire
- Parse opening names from PGN `[ECOUrl]` headers
- Separate by color (White/Black)
- Count frequency and calculate win rates
- Show top 3 per color

### Accuracy Trend
- Extract accuracy data from recent games
- Average last 20 games
- Detect improving/declining trend

### Record
- Aggregate W/L/D per time control (Rapid, Blitz, Bullet)
- Display as a proportional bar chart

### Winning/Losing Streak
- Find consecutive wins or losses from most recent games
- Display as "W3" or "L2" etc.

### Smurf Detection
- Flag if account age < 90 days AND (rating > 1400 OR accuracy > 85%)
- Show warning badge in card

## Performance Optimizations

- **Parallel fetching** — Profile + stats fetched concurrently
- **Rate limit handling** — 300ms delay between monthly archive requests
- **Progressive rendering** — Card shows immediately after profile load, game data fills in progressively
- **Smart caching** — Only re-fetch if cache expired or user manually refreshes
- **Silent error handling** — Missing months/data gracefully skipped

## Edge Cases Handled

- ✅ Opponent has < 3 months of histories — Uses whatever exists
- ✅ No accuracy data in games — Skips accuracy section
- ✅ Opponent has 0 games in a time control — Shows "—" for rating
- ✅ API rate limiting — Implements backoff and delays
- ✅ Card rerender on rematch — Replaces old card with new one
- ✅ Username not found — Error logged, card not shown

## Permissions

- **`storage`** — Caching opponent data
- **`activeTab`** — Detect current page
- **`host_permissions`** — Access chess.com and api.chess.com

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Chromium-based browsers (Edge, Brave, Vivaldi, etc.)

## API Rate Limiting

The Chess.com API has rate limits. The extension handles this by:

- **Caching for 24 hours** — Reduces repeated requests for same opponent
- **Staggering requests** — 300ms delay between monthly archive fetches
- **Silently skipping errors** — If a month 404s, continues without error

## Troubleshooting

### Card Not Showing

1. Ensure you're on a chess.com/game/* page
2. Wait for the game to load completely (look for opponent username)
3. Check extension permissions in Chrome extensions page
4. Open DevTools (F12) and check Console for errors

### Wrong Opponent Detected

The extension uses heuristics to find the opponent username. If detection fails:
1. Open DevTools Console (F12)
2. Look for `[Chess Scout]` logs
3. Report the issue with the DOM structure

### API Errors

If Chess.com API returns 404 or rate limit errors:
- Extension logs them to console
- Card rendering continues with available data
- Wait 24 hours for cache to expire and re-fetch

## Development

### Modifying the Card UI

Edit `card.js` to customize card layout, or edit `styles.css` for styling.

### Testing with Specific Opponents

1. Open DevTools Console
2. Run:
   ```js
   fetch('https://api.chess.com/pub/player/{username}')
     .then(r => r.json())
     .then(console.log)
   ```

### Clearing Cache

In Console:
```js
chrome.storage.local.clear()
```

## Future Enhancements

- [ ] Last played openings (Blunders, Tactics)
- [ ] Color preference detection (Always plays White, etc.)
- [ ] Recent tournament history
- [ ] Time management stats (avoids time trouble)
- [ ] Most common endgames
- [ ] Settings panel for card customization

## Credits

Built with Chess.com's Public API. Not affiliated with Chess.com.

## License

MIT License — Free to use and modify.
