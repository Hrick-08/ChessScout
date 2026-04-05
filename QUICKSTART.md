# Chess Scout - Quick Start

Get the Chess Scout extension running in 2 minutes.

## Installation

1. **Open Chrome** → **`chrome://extensions/`**
2. **Enable "Developer mode"** (toggle at top-right)
3. **Click "Load unpacked"**
4. **Select** this Chess Scout folder
5. ✅ You're done!

## First Test

1. Go to **https://chess.com**
2. Play a quick game (any time control)
3. Once the opponent's username appears, **a card will pop up** in the top-right corner
4. The card shows:
   - Opponent's profile (avatar, country, league)
   - Ratings (Rapid, Blitz, Bullet)
   - Top 3 openings with win rates
   - Win/Loss/Draw record
   - Accuracy, game length, streak

## What Each Section Means

| Section | Meaning |
|---------|---------|
| **Ratings** | Current rating in each time control |
| **Most Played (As White/Black)** | Top 3 openings when playing that color, with win % |
| **Record** | Green bar = wins, Red = losses, Gray = draws |
| **Accuracy** | How accurately opponent played (0-100) |
| **Avg Length** | Average game length in moves |
| **Streak** | W3 = 3 wins, L2 = 2 losses |
| **⚠️ New Account** | Appears if opponent is new but has high rating/accuracy (smurf) |

## Keyboard Shortcuts

- **F12** — Open DevTools to see logs and debug
- **Ctrl+Shift+Delete** — Clear browser cache/data (advanced)

## Troubleshooting

### Card doesn't appear?
- Make sure you're on a **chess.com/game/** page (not home)
- Wait ~2 seconds for opponent username to load
- Press **F12**, check Console for errors (should see `[Chess Scout]` logs)

### Wrong opponent shown?
- Chess.com's page structure may have changed
- Open an issue on GitHub with your browser version

### Data looks old?
- Extension caches opponent data for **24 hours**
- Clear cache: F12 → Console → `chrome.storage.local.clear()`

### Extension disabled?
- Go to **chrome://extensions/**
- Make sure Chess Scout has a blue toggle (enabled)
- If missing, you may need to reinstall

## Next Steps

- Check [DEVELOPMENT.md](DEVELOPMENT.md) for detailed debugging
- Check [README.md](README.md) for full documentation
- Modify [styles.css](styles.css) to customize card appearance
- Edit [content.js](content.js) to tweak logic

## Tips

🔥 **Pro tips:**
- Card updates on every rematch/new game
- All data comes from Chess.com's Public API (no login needed)
- Your opponent's playing history is analyzed, not your own
- Cache automatically expires after **24 hours**

🐛 **Reporting issues:**
- Open DevTools (F12)
- Reproduce the issue
- Copy console logs (look for `[Chess Scout]`)
- Include: browser version, opponents username, time control

---

Enjoy scouting! ♟️
