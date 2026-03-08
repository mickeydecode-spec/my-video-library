

# TikTok Mode: Full-Screen Scrollable Video Player

## What We're Building

Transform the TikTok preset into a **real TikTok-style experience**: full-screen vertical video feed where each video is a playable video player (not a card). Scroll up/down to switch videos. The visible video auto-plays, others pause. No cards, no grid — just videos.

## How It Works

- Each video fills the entire viewport height using CSS `snap-y snap-mandatory` scroll snapping
- The currently visible video auto-plays using `IntersectionObserver` (threshold ~0.7)
- Scrolling to next video pauses the previous and auto-plays the new one
- Minimal overlay UI: video name, folder, play/pause tap, mute button
- Swipe/scroll vertically to move between videos
- Videos are shuffled randomly from the folder

## Files to Create/Modify

### 1. NEW: `src/components/TikTokFeed.tsx`
- Full-screen vertical scroll container with `h-screen overflow-y-scroll snap-y snap-mandatory`
- Each item is `h-screen snap-start` containing a `<video>` element
- `IntersectionObserver` on each video: when >70% visible, call `video.play()`; when leaving, call `video.pause()`
- Overlay at bottom: video name, folder name, tags
- Tap center to play/pause, tap right side to mute/unmute
- Shuffle videos randomly using `useMemo` with a stable shuffle

### 2. MODIFY: `src/pages/Index.tsx`
- When `webLayout === 'tiktok'`, render `<TikTokFeed>` instead of the normal header + sidebar + grid layout
- Pass `processedVideos`, `playVideo`, watch history, etc.
- Hide header, sidebar, sort bar — full immersive mode
- Add a small floating "Exit" button (top-left) to switch back to YouTube layout

### 3. MODIFY: `src/components/VideoGrid.tsx`
- Remove the existing `TikTokLayout` component (no longer needed since Index.tsx handles it directly)

