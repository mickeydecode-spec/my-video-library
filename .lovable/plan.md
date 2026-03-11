

# Fix Audio Track Switching, Subtitle Display, and Basic Player Functionality

## Problems Identified

1. **Audio track switching broken everywhere**: The `HTMLMediaElement.audioTracks` API is only supported in Safari and some Chromium builds with flags enabled. All preset players (Netflix, Twitch, Plex) have zero audio track support. The main player detects tracks but the API rarely works in browsers.

2. **Subtitles not loaded in preset players**: Netflix, Twitch, and Plex players render `<video src={video.url}>` with no `<track>` elements at all. Subtitle files from the video object are completely ignored.

3. **Main player subtitle menu non-functional**: The Subtitle menu lists subtitle files but clicking them does nothing -- no enable/disable toggling.

---

## Plan

### 1. Create shared subtitle/audio utility hook -- `src/hooks/usePlayerSubtitles.ts`

A reusable hook that:
- Takes a `VideoFile` and a `videoRef`
- Loads all subtitle files via `loadSubtitleAsVtt()` into blob URLs
- Tracks which subtitle track is active (index or -1 for off)
- Provides `setActiveSubtitle(index)` to enable/disable `<track>` elements via `videoRef.current.textTracks`
- Detects audio tracks via `audioTracks` API when available
- Provides `setActiveAudioTrack(index)` 
- Returns `{ subtitleUrls, activeSubtitle, setActiveSubtitle, audioTracks, activeAudioTrack, setActiveAudioTrack }`

### 2. Fix `VideoPlayer.tsx` -- Main player

- Use the new hook
- **Subtitle menu**: Make each `MenubarItem` clickable to toggle that subtitle track on/off using `textTracks` API. Add "Disable" option.
- **Audio menu**: Replace the static "Audio tracks shown in controls below" message with actual audio track list from the hook (with fallback message if none detected)

### 3. Fix `PlayerControls.tsx`

- Accept `subtitles` and `audioTracks` data as props from parent instead of trying to detect audio tracks internally (which fails in most browsers)
- Show subtitle picker popover (Languages icon) listing available subtitle tracks with enable/disable
- Keep audio track picker for when tracks are available

### 4. Fix `NetflixPlayer.tsx`

- Import and use `loadSubtitleAsVtt`
- Load subtitle URLs on mount, render `<track>` elements inside `<video>`
- Add subtitle picker button (CC icon) with dropdown to select/disable subtitles via `textTracks` API
- Add audio track detection and switcher button

### 5. Fix `TwitchPlayer.tsx`

- Same subtitle loading and `<track>` rendering as Netflix
- Add CC button in bottom controls with subtitle picker dropdown
- Add audio track switcher

### 6. Fix `PlexPlayer.tsx`

- Same subtitle loading and `<track>` rendering
- The existing `Subtitles` icon button currently does nothing -- wire it up with a dropdown to pick/disable subtitle tracks
- Add audio track switcher

---

## Technical Details

**Subtitle toggling approach**: Use the native `textTracks` API on the video element. Each `TextTrack` has a `mode` property (`'showing'`, `'hidden'`, `'disabled'`). To switch subtitles: set all tracks to `'disabled'`, then set the chosen one to `'showing'`.

**Audio tracks fallback**: Since `audioTracks` API has limited browser support, the UI will show "No additional audio tracks detected" when the API isn't available, rather than hiding the option entirely. This makes users aware the feature exists but depends on browser support.

**Files to create**: `src/hooks/usePlayerSubtitles.ts`
**Files to modify**: `VideoPlayer.tsx`, `PlayerControls.tsx`, `NetflixPlayer.tsx`, `TwitchPlayer.tsx`, `PlexPlayer.tsx`

