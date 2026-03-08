

# Twitch & Plex Immersive Modes

Same treatment as Netflix and TikTok — each gets a dedicated full-screen browser component and a styled video player.

---

## Twitch Mode

### NEW: `src/components/TwitchBrowser.tsx`
Full-screen Twitch-like browsing UI (`bg-[#0e0e10]`, Twitch dark theme):
- **Top nav**: Twitch purple accent (`#9146ff`), logo area, exit button
- **Featured stream (hero)**: Large auto-playing muted video taking ~50vh, with streamer-style overlay (video title, folder as "channel name", live-style badge, viewer count placeholder)
- **Category shelves**: Horizontal scrollable rows grouped by folder — cards are vertical game-box style (portrait aspect like Twitch categories) with thumbnail, title, folder as channel name
- **Sidebar**: Slim left sidebar showing "Recommended Channels" (random videos as channels with colored dots)
- Cards: hover shows purple border, slight scale, play overlay

### NEW: `src/components/TwitchPlayer.tsx`
Twitch-style video player:
- Dark background, video centered
- **Top bar**: Channel name (folder) + video title, back button
- **Bottom controls**: Purple (`#9146ff`) progress bar, play/pause, volume, fullscreen, theater mode concept
- **Chat placeholder panel** on the right (static, just styled like Twitch chat area with "Chat is unavailable for local files" message)
- Auto-hide controls (3s), keyboard shortcuts (Space, arrows, F, M)

---

## Plex Mode

### NEW: `src/components/PlexBrowser.tsx`
Full-screen Plex-like browsing UI (`bg-[#1f2326]`, Plex dark):
- **Top nav**: Plex orange accent (`#e5a00d`), clean minimal nav, exit button
- **Hero/spotlight**: Featured video with backdrop image (thumbnail), gradient overlay, "Play" button with Plex orange styling
- **Library rows**: Horizontal scrollable rows grouped by folder, labeled "Recently Added", folder names as libraries
- **Cards**: Portrait poster style (2:3 aspect ratio) with thumbnail, title below, orange progress bar for resume, hover shows slight lift + shadow
- **Left sidebar** (slim): Library sections (folders) as nav items with folder icons

### NEW: `src/components/PlexPlayer.tsx`
Plex-style video player:
- Dark background, clean minimal UI
- **Top bar**: Back arrow + video title + library name
- **Bottom controls**: Orange (`#e5a00d`) progress bar with time tooltip, play/pause, skip ±10s, volume, subtitles, fullscreen
- Auto-hide controls (3s), keyboard shortcuts
- Plex-style rounded button aesthetics

---

## Modifications

### `src/pages/Index.tsx`
- Add Twitch immersive block: when `webLayout === 'twitch'`, render `<TwitchBrowser>` / `<TwitchPlayer>` (same pattern as Netflix)
- Add Plex immersive block: when `webLayout === 'plex'`, render `<PlexBrowser>` / `<PlexPlayer>`

### `src/components/VideoGrid.tsx`
- Remove `TwitchLayout` and `PlexLayout` functions (now handled by dedicated components)
- Clean up the webLayout conditionals for twitch/plex

---

## Files Summary
- **Create**: `TwitchBrowser.tsx`, `TwitchPlayer.tsx`, `PlexBrowser.tsx`, `PlexPlayer.tsx`
- **Modify**: `Index.tsx`, `VideoGrid.tsx`

