

# MyTube Enhancement Roadmap

This is a large set of features. Since this is a client-side app with no backend, all persistence will use **localStorage/IndexedDB**. I'll organize this into implementation phases.

---

## Phase 1: Core Enhancements (Foundation)

### 1. Advanced Search & Filters
- Extend the Header search to include a **filter dropdown** with options for: format (mp4, mkv, etc.), duration range (short/medium/long), and folder.
- Extract video metadata (duration, resolution) during scan and store on the `VideoFile` interface.
- Add `resolution`, `size`, and `format` fields to `VideoFile`.

### 2. Watch History & Resume Playback
- Create a `useWatchHistory` hook backed by **localStorage**.
- Store `{ videoPath: string, position: number, lastWatched: Date }` entries.
- On `VideoPlayer` mount, check history and seek to saved position.
- Save position periodically (every 5s) and on pause/close via the video `timeupdate` event.
- Show a "Resume from X:XX" indicator on VideoCard for partially watched videos.
- Add a **"History"** section in the Sidebar listing recently watched videos.

### 3. Playlist Persistence
- Save scanned playlists and video metadata to **localStorage** keyed by root folder name.
- On app load, restore the last library state so users don't need to re-scan.
- When re-scanning, merge new videos into existing data (preserving watch history, tags).

---

## Phase 2: Organization & Annotation

### 4. Custom Tagging & Smart Playlists
- Add a `tags: string[]` field to stored video metadata (in localStorage).
- UI: tag chips on VideoCard, a tag editor dialog on the player page.
- Sidebar section for **Smart Playlists** — saved filter queries like "tag:comedy" or "duration > 30min".
- Create a `useTagManager` hook for CRUD operations on tags.

### 5. Video Notes & Bookmarks
- Create a `useVideoNotes` hook (localStorage-backed).
- Store `{ videoPath, timestamp, note }` entries.
- In `VideoPlayer`, add a notes panel (collapsible sidebar or bottom drawer):
  - "Add bookmark" button captures current timestamp.
  - Text input for notes at that timestamp.
  - Clickable bookmark list that seeks to that timestamp.
- Show bookmark count on VideoCard.

### 6. Auto-Organize by Metadata
- During scan, extract duration and resolution (via `HTMLVideoElement` metadata).
- Add **sort controls** above the VideoGrid: sort by name, duration, resolution, date modified.
- Add **filter chips**: "4K", "HD", "> 30 min", "> 1 hour".

---

## Phase 3: Theming & UX

### 7. Customizable Themes
- Integrate `next-themes` (already installed) for dark/light toggle in the Header.
- Remove the hardcoded `dark` class from the root div.
- Add a **theme selector dropdown** with presets:
  - **YouTube** (current dark red theme)
  - **Netflix** (dark with red accent)
  - **Plex** (dark with orange/gold accent)
  - **Light** mode
- Each preset swaps CSS variables in `index.css`.

### 8. Layout Options
- Add a toggle in the Header for **Grid / List / Compact** view modes.
- Grid = current layout; List = horizontal rows with more metadata; Compact = smaller cards, more per row.
- Store preference in localStorage.

---

## Phase 4: Advanced (Future)

### 9. Cross-Device Resume (via URL sharing)
- Since this is client-only with no backend, true cross-device sync requires a backend. For now:
  - **Export/Import** watch history and playlists as JSON files.
  - Future: optional Supabase integration for cloud sync.

### 10. Voice Control
- Use the **Web Speech API** (`SpeechRecognition`) for basic commands.
- Commands: "play", "pause", "next", "previous", "search [query]".
- Add a mic button in the Header.
- This is browser-dependent (best in Chrome).

### 11. Future Expansion Hooks
- Plugin system, AI summaries, and face recognition are beyond client-side scope but the architecture should keep data interfaces clean to allow future integration.

---

## Technical Approach

| Feature | Storage | Key Files Modified/Created |
|---|---|---|
| Search & Filters | In-memory | `Header.tsx`, `Index.tsx`, `VideoFile` interface |
| Watch History | localStorage | New `useWatchHistory.ts`, `VideoPlayer.tsx`, `VideoCard.tsx`, `Sidebar.tsx` |
| Playlist Persistence | localStorage | `useVideoLibrary.ts` |
| Tags & Smart Playlists | localStorage | New `useTagManager.ts`, new `TagEditor.tsx`, `Sidebar.tsx` |
| Notes & Bookmarks | localStorage | New `useVideoNotes.ts`, new `NotesPanel.tsx`, `VideoPlayer.tsx` |
| Metadata Sort/Filter | In-memory | `VideoFile` interface, new `SortFilterBar.tsx`, `Index.tsx` |
| Themes | CSS vars + next-themes | `index.css`, `Header.tsx`, new `ThemeSelector.tsx` |
| Layout Options | localStorage | `VideoGrid.tsx`, `Header.tsx` |
| Voice Control | Web Speech API | New `useVoiceControl.ts`, `Header.tsx` |

All data stored in localStorage will use a consistent key prefix (`mytube_`) and versioned schema for future migration.

---

## Suggested Build Order

Build in this order to maximize incremental value:

1. **Watch History & Resume** — most impactful user experience improvement
2. **Advanced Search & Filters + Metadata Sort** — together as one batch
3. **Playlist Persistence** — makes the app feel like a real library
4. **Themes (dark/light + presets)** — quick win, high visual impact
5. **Tags & Smart Playlists** — powerful organization
6. **Notes & Bookmarks** — niche but valuable
7. **Layout Options** — polish
8. **Voice Control** — experimental
9. **Export/Import & Cloud Sync** — requires backend decision

Each phase builds on the previous without breaking existing functionality.

