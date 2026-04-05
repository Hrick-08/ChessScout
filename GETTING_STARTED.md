# Chess Scout - Getting Started Checklist

Complete these steps to get Chess Scout working.

## ✅ Installation

- [ ] Folder location: **C:\Users\hrita\OneDrive\Documents\UNI\Proj\Chess Scout**
- [ ] All files present:
  - [ ] `manifest.json`
  - [ ] `content.js`
  - [ ] `api.js`, `compute.js`, `card.js`, `styles.css`
  - [ ] `images/icon-*.png` (3 files)
  - [ ] `README.md`, `QUICKSTART.md`, `DEVELOPMENT.md`, `ARCHITECTURE.md`

## 🚀 Load in Chrome

1. [ ] Open **Chrome** (v88+)
2. [ ] Navigate to **`chrome://extensions/`**
3. [ ] Enable **"Developer mode"** (toggle at top-right)
4. [ ] Click **"Load unpacked"**
5. [ ] Select **Chess Scout** folder
6. [ ] You should see:
   - Chess Scout extension card with toggle (enabled)
   - Extension ID listed
   - "Service Worker" status section

## 🧪 Test the Extension

1. [ ] Go to **https://chess.com**
2. [ ] **Play a quick game** (try 3-min Blitz or 10-min Rapid)
3. [ ] Once game loads, **opponent's username** should appear at bottom of page
4. [ ] **Scouting card** should appear in top-right corner with:
   - [ ] Loading skeleton (empty placeholder) briefly
   - [ ] Avatar, username, league badge
   - [ ] Ratings (Rapid, Blitz, Bullet)
   - [ ] Opening repertoire
   - [ ] Accuracy, game length, streak
   - [ ] W/L/D record bar
   - [ ] Optional: "⚠️ New Account" warning
5. [ ] **Close button (×)** works to dismiss card
6. [ ] **Rematch** triggers fresh card for new opponent

## 🔍 Debug (If Card Doesn't Appear)

1. [ ] Press **F12** to open DevTools
2. [ ] Go to **Console** tab
3. [ ] Look for logs starting with **`[Chess Scout]`**:
   - `[Chess Scout] Extension initialized` — Script loaded ✅
   - `[Chess Scout] Started observing...` — Watching for opponent ✅
   - `[Chess Scout] Detected opponent: username` — Found opponent ✅
   - `[Chess Scout] Loaded username from cache` — Using cached data ✅
   - `[Chess Scout] Fetching fresh data...` — API call in progress ✅

4. [ ] If no logs, extension may not be loaded:
   - [ ] Check **chrome://extensions/** — Is toggle enabled?
   - [ ] Try refresh (Ctrl+R) or reload extension (⟲ button)

5. [ ] If opponent not detected, DOM structure may have changed:
   - [ ] Use DevTools Inspector (Ctrl+Shift+C) to find opponent name
   - [ ] Report issue on GitHub with the class names you find

## 📊 Test Different Opponents

Try games against these types of opponents to verify all features:

- [ ] **High-rated player** (2000+ rating) — Should show ratings, openings
- [ ] **New account** (< 90 days old) — Should show "⚠️ New Account" if rating > 1400
- [ ] **Low-activity account** (few games) — Should handle gracefully with "—"
- [ ] **Random opponent** — Should show diverse opening repertoire
- [ ] **Same opponent twice** — Should show cached data (instant) on 2nd game

## ⚙️ Configuration (Optional)

### Clear Cache Between Tests
```javascript
// In DevTools Console (F12):
chrome.storage.local.clear()
// Refresh page
```

### Inspect Cached Data
```javascript
chrome.storage.local.get(null, (items) => console.log(items))
```

### Test Specific Opponent
```javascript
fetch('https://api.chess.com/pub/player/magnuscarlsen')
  .then(r => r.json())
  .then(console.log)
```

## 📝 Customization

- **Change card width:** Edit `.chess-scout-card { width: 320px; }` in `content.js`
- **Change colors:** Search `#1a1a1a` (dark bg) or `#4caf50` (green) in `content.js`
- **Change card position:** Edit `.chess-scout-card { top: 20px; right: 20px; }` in `content.js`
- **Hide sections:** Remove html from `createOpeningSections()` or `createRecordBar()` in `content.js`

## 🐛 Known Limitations

- ⚠️ **Opponent detection** — Relies on chess.com's HTML structure; may break if they redesign
- ⚠️ **API rate limits** — Chess.com doesn't publish limits; cache helps a lot
- ⚠️ **No accuracy data for old games** — Chess.com didn't record accuracy before ~2019
- ⚠️ **Smurf detection** — Heuristic only; not always accurate
- ⚠️ **Card positioning** — Positions fixed relative to viewport, may overlap on mobile
- ⚠️ **No dark mode toggle** — Always uses dark theme (matches chess.com)

## 📚 Documentation

- **Quick Start:** [QUICKSTART.md](QUICKSTART.md) — 2-minute setup
- **Full Docs:** [README.md](README.md) — Complete feature list
- **Dev Guide:** [DEVELOPMENT.md](DEVELOPMENT.md) — Testing & modifications
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) — How it all works

## ✨ Next Steps

1. **Try it out** — Play a game and verify card appears
2. **Customize** — Adjust colors, position, or content if desired
3. **Report bugs** — If something breaks, check DEVELOPMENT.md for debugging
4. **Contribute** — Can submit improvements or forks on GitHub (when public)

## 💡 Pro Tips

🔥 **Performance tips:**
- Card loads faster on **2nd game** (uses cache)
- **Clear cache** to force fresh data
- **Turn off DevTools** if FPS matters (runs faster)

🐛 **Debugging tips:**
- Always check **Console logs** (F12) first
- Use **DevTools Inspector** to see actual DOM structure
- **Disable extensions** to rule out other interference
- **Report** opponent username + time if things break

🎯 **Feature ideas:**
- Add **opening recommendations** (what to play against)
- Add **tournament history**
- Add **color preference** (always plays White?)
- Add **time management** (blunders in time trouble?)
- Add **custom notes** per opponent

---

**Everything working?** You're ready to scout! ♟️

**Need help?** Check the docs or open an issue on GitHub.
