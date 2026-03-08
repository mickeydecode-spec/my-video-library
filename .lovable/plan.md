

# Fix Sidebar Reactivity & Add Layout Toggle

## Problems Identified

1. **Sidebar doesn't visually update after loading videos**: The sidebar receives correct props but when `totalVideos` goes from 0 to N and playlists appear, there's no visual feedback or transition — it just silently updates. If the user has the sidebar open before scanning, the "All Videos 0" stays static-looking. The sidebar also shows nothing useful when empty (no prompt to open a folder).

2. **No layout toggle in the sidebar**: The Grid/List/Compact toggle only exists in the Header (hidden on small screens via `hidden sm:flex`). The sidebar should have its own View Mode section.

## Changes

### 1. `src/components/Sidebar.tsx` — Full rewrite

- **Add props**: `layout: LayoutMode`, `onLayoutChange: (mode: LayoutMode) => void`
- **Empty state**: When `totalVideos === 0` and no playlists, show a subtle message: "Open a folder to browse videos" with a folder icon
- **View Mode section**: Add a "View" section at the top with three toggle buttons (Grid, List, Compact) using icons matching the Header's layout toggle
- **Transition animations**: Add `transition-all` classes to playlist items so they animate in when playlists load after scanning
- **Visual count update**: The "All Videos" count badge should use a subtle highlight animation when it changes from 0

### 2. `src/pages/Index.tsx` — Pass layout props to Sidebar

- Add `layout={layout}` and `onLayoutChange={setLayout}` to the `<Sidebar>` component call (2 new props, lines ~199-212)

### 3. Minor polish

- Sidebar width transition: wrap the `<aside>` with `transition-all duration-200` so toggling open/closed is smooth instead of instant `return null`
- When `isOpen` is false, render the aside with `w-0` instead of returning null, enabling CSS transition

