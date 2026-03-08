

# Fix Video Player, Sidebar Playlist Switching & Performance

## Issues Found

### 1. Video Player Controls Always Visible
The control bar (`PlayerControls`) and menu bar are always rendered with static backgrounds. There's no auto-hide logic — VLC and PotPlayer hide controls after ~3 seconds of mouse inactivity and show them on mouse movement.

### 2. Sidebar Playlist Switching Broken
The filtering logic in `useVideoLibrary.ts` line 51-53 filters by `v.folder === filterPlaylist`. But when clicking a playlist in the sidebar (line 153), it passes `pl.path`. The issue: `pl.path` includes subdirectory paths like `root/SubFolder`, but `v.folder` is set to `currentPath` during scan. These should match, BUT the root playlist path is `dirHandle.name` while sub-playlist paths are `parentPath/subdir.name`. If a user clicks a sub-playlist, `filterPlaylist` is set to the sub-path, but videos in nested sub-subdirectories won't match because `v.folder` only matches the immediate parent. The real bug: videos should match if their folder **starts with** the playlist path, not equals it exactly.

### 3. Performance: Thumbnail Generation is Extremely Slow
`VideoCard.tsx` creates a hidden `<video>` element per card, seeks to 2 seconds, and draws to canvas. For 50+ videos this creates 50 simultaneous video decode operations — very slow and memory-heavy. Need lazy/batched thumbnail generation with intersection observer.

## Plan

### A. Auto-Hide Controls in Video Player (`VideoPlayer.tsx`)
- Track mouse movement over the player root with a timeout (3 seconds idle = hide)
- When `controlsVisible` is false, hide the top menubar and bottom controls with opacity/translate transitions
- Show cursor only when controls are visible; hide cursor when idle
- Always show controls when video is paused
- Moving mouse or pressing keys resets the timer

### B. Fix Sidebar Playlist Filtering (`useVideoLibrary.ts`)
- Change filter from `v.folder === filterPlaylist` to `v.folder.startsWith(filterPlaylist)` so clicking a playlist shows all videos in that folder AND its subfolders
- This one-line fix makes playlist switching work correctly for nested folders

### C. Optimize Thumbnail Generation (`VideoCard.tsx`)
- Use `IntersectionObserver` to only generate thumbnails when cards scroll into view (lazy loading)
- Add a global thumbnail cache (Map) so re-renders don't regenerate thumbnails
- Limit concurrent thumbnail generation to 3 at a time using a simple queue
- Show a placeholder gradient/shimmer while loading

### D. Optimize Video Grid Rendering (`VideoGrid.tsx`)
- Wrap `VideoCard` in `React.memo` to prevent unnecessary re-renders
- Use virtualization for large lists: only render visible cards (using a simple scroll-based approach since react-window isn't installed, or just use intersection observer for progressive rendering)

### E. Missing Features to Add
- **Drag-to-seek preview**: Show time tooltip when hovering over seekbar
- **Double-click seekbar sides**: Skip forward/back 10 seconds  
- **Buffered indicator**: Show buffered range on seekbar (grey bar behind orange)
- **Elapsed/remaining toggle**: Click time display to toggle between elapsed and remaining time

### Files to Modify
1. **`src/components/VideoPlayer.tsx`** — Add mouse idle detection, conditional visibility classes on menubar and controls
2. **`src/hooks/useVideoLibrary.ts`** — Fix filter: `startsWith` instead of `===`
3. **`src/components/VideoCard.tsx`** — Intersection observer + thumbnail cache + concurrent limit
4. **`src/components/PlayerControls.tsx`** — Add seekbar hover preview tooltip, buffered range indicator, time display toggle

