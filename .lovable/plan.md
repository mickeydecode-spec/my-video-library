

# Website Layout System + Performance Boost

## What We're Building

A full **website layout preset system** — a "Layout" button in the sidebar that lets users switch the entire page structure between famous video site layouts. Plus performance improvements for faster rendering.

## Layout Presets

| Preset | Description |
|--------|-------------|
| **YouTube** (default) | Header top, sidebar left, grid of cards |
| **Netflix** | No sidebar, horizontal scrolling rows grouped by folder/tag, large hero banner for first video |
| **Twitch** | Sidebar left (slim icons), large featured video top, smaller grid below |
| **Plex** | Full-width header, sidebar left, poster-style tall cards (portrait ratio) |
| **TikTok** | No sidebar, single column centered, large vertical cards, infinite scroll feel |

Each preset changes: sidebar visibility/style, grid layout, card shape, header style, and content organization.

## Files to Create/Modify

### 1. NEW: `src/hooks/useWebLayout.ts`
- New type `WebLayout = 'youtube' | 'netflix' | 'twitch' | 'plex' | 'tiktok'`
- Persists to localStorage
- Each layout defines: `showSidebar`, `sidebarStyle` (full/slim/none), `gridStyle`, `cardAspect`, `showHero`, `groupByFolder`

### 2. NEW: `src/components/LayoutSelector.tsx`
- A button in the sidebar bottom area labeled "Layout" with a `LayoutDashboard` icon
- Opens a dropdown/popover showing the 5 presets with small preview icons
- Each option has a name + tiny ASCII-art style icon showing the layout shape

### 3. MODIFY: `src/components/Sidebar.tsx`
- Add `webLayout` and `onWebLayoutChange` props
- Render `<LayoutSelector>` at the bottom of the sidebar
- When layout is `netflix` or `tiktok`, sidebar auto-hides
- When layout is `twitch`, sidebar renders in slim icon-only mode (w-16)

### 4. MODIFY: `src/components/VideoGrid.tsx`
- Accept `webLayout` prop
- **Netflix mode**: Group videos by folder, render horizontal scroll rows with `overflow-x-auto`, first row has a large hero card
- **Twitch mode**: First video is large (spans full width), rest in 3-col grid below
- **Plex mode**: Portrait-style tall cards (2:3 aspect ratio) in a grid
- **TikTok mode**: Single centered column, large cards with max-w-md, vertical scroll
- **YouTube mode**: Current default grid behavior

### 5. MODIFY: `src/components/VideoCard.tsx`
- Accept optional `variant` prop: `'default' | 'hero' | 'portrait' | 'horizontal' | 'vertical'`
- `hero`: Full-width banner with overlay text
- `portrait`: Tall 2:3 card (Plex style)
- `horizontal`: Wide row card for Netflix rows
- `vertical`: Large centered card for TikTok

### 6. MODIFY: `src/pages/Index.tsx`
- Import and use `useWebLayout`
- Pass `webLayout` down to Sidebar, VideoGrid
- When layout is `netflix`/`tiktok`, force sidebar closed
- When layout is `twitch`, force slim sidebar

### 7. Performance: MODIFY `src/components/VideoGrid.tsx`
- Wrap the grid in a virtualized approach: only render cards within viewport + 500px buffer using IntersectionObserver on a sentinel element
- For Netflix horizontal rows: use CSS `scroll-snap-type` for smooth horizontal scrolling
- Memoize grouped video computations with `useMemo`

### 8. Performance: MODIFY `src/components/VideoCard.tsx`
- Use `loading="lazy"` on thumbnail images
- Reduce thumbnail canvas to 240x135 (from 320x180) for faster generation
- Add `will-change: transform` on hover cards for GPU acceleration

