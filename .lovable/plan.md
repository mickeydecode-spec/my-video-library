

# Netflix Immersive Mode — Full Netflix Experience

## What We're Building

Transform the Netflix preset into a **real Netflix-like experience** — dark immersive UI, hero billboard with auto-playing video, horizontal scrolling rows, hover-to-preview with video playback, and a Netflix-style video player (no VLC menubar — clean minimal overlay controls like Netflix).

## Changes

### 1. NEW: `src/components/NetflixBrowser.tsx`
Full-screen Netflix browsing experience (replaces the grid when `webLayout === 'netflix'`):
- **Dark background** (`bg-[#141414]`), no header/sidebar
- **Hero billboard**: First video auto-plays muted with gradient overlay, title, play button, and info button
- **Category rows**: Horizontal scrollable rows grouped by folder, with left/right scroll arrows on hover
- **Card hover**: On hover, card scales up and shows a mini preview (play the video muted for 3-4 seconds), with play/info buttons overlay
- **Top nav bar**: Netflix-style — logo left, exit button, transparent fading to dark on scroll
- Each card: 16:9 thumbnail, on hover expands with metadata (name, folder, tags, resume bar)

### 2. NEW: `src/components/NetflixPlayer.tsx`
Netflix-style video player (replaces VLC player when in Netflix mode):
- **Full black background**, video centered
- **Auto-hide controls** (3s timeout like Netflix)
- **Top bar**: Back arrow + video title (fades in/out)
- **Bottom controls**: 
  - Thin red progress bar (Netflix red `#e50914`) with hover time preview
  - Play/pause, skip ±10s, volume, speed, subtitles, fullscreen
  - No VLC menubar, no stop button, no A-B loop — clean Netflix style
- **Skip intro/outro** button concept (static, since we don't know chapters)
- Keyboard shortcuts: Space (play/pause), arrows (seek), F (fullscreen), M (mute)

### 3. MODIFY: `src/pages/Index.tsx`
- When `webLayout === 'netflix'`, render `<NetflixBrowser>` as the top-level view (like TikTok)
- When a video is selected in Netflix mode, render `<NetflixPlayer>` instead of the VLC `<VideoPlayer>`
- Pass all video data, watch history, notes, tags down

### 4. MODIFY: `src/components/VideoGrid.tsx`
- Remove the existing `NetflixLayout` component (no longer needed — handled by `NetflixBrowser`)

## Netflix Visual Details
- Font: system sans-serif, white on dark
- Primary color: `#e50914` (Netflix red) for progress bars, buttons
- Cards: rounded corners, shadow on hover, scale 1.3x on hover with z-index bump
- Row titles: bold white, left-aligned
- Hero: 60vh height, gradient overlay bottom-to-top, large title, "▶ Play" and "ⓘ More Info" buttons
- Scroll arrows: chevron icons on row edges, appear on row hover

