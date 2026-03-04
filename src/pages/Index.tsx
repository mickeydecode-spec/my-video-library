import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VideoGrid } from '@/components/VideoGrid';
import { VideoPlayer } from '@/components/VideoPlayer';
import { MiniPlayer } from '@/components/MiniPlayer';
import { EmptyState } from '@/components/EmptyState';
import { SortFilterBar, SortField, SortDirection, FilterState } from '@/components/SortFilterBar';
import { useVideoLibrary } from '@/hooks/useVideoLibrary';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { useVideoNotes } from '@/hooks/useVideoNotes';
import { useTagManager } from '@/hooks/useTagManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const {
    videos,
    allVideos,
    playlists,
    currentVideo,
    currentPlaylist,
    isLoading,
    isMiniPlayer,
    filterPlaylist,
    openFolder,
    playVideo,
    playNext,
    playPrev,
    setCurrentVideo,
    setIsMiniPlayer,
    setFilterPlaylist,
  } = useVideoLibrary();

  const { history, updatePosition, getEntry, getRecentlyWatched } = useWatchHistory();
  const { notes, addNote, removeNote, getNotesForVideo, getNoteCount } = useVideoNotes();
  const { tags, smartPlaylists, addTag, removeTag, getTagsForVideo, getAllTags, addSmartPlaylist, removeSmartPlaylist } = useTagManager();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showingHistory, setShowingHistory] = useState(false);
  const [activeSmartPlaylist, setActiveSmartPlaylist] = useState<string | null>(null);

  // Sort & filter state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterState>({ formats: [], durationRange: 'all', tags: [] });

  const recentlyWatched = getRecentlyWatched(20);

  // Get videos for history view
  const historyVideos = useMemo(() => {
    if (!showingHistory) return [];
    return recentlyWatched
      .map(entry => allVideos.find(v => v.path === entry.videoPath))
      .filter(Boolean) as typeof allVideos;
  }, [showingHistory, recentlyWatched, allVideos]);

  // Smart playlist filtering
  const smartFilteredVideos = useMemo(() => {
    if (!activeSmartPlaylist) return null;
    const sp = smartPlaylists.find(s => s.id === activeSmartPlaylist);
    if (!sp) return null;

    const query = sp.query.toLowerCase();
    if (query.startsWith('tag:')) {
      const tag = query.substring(4);
      return allVideos.filter(v => (getTagsForVideo(v.path)).includes(tag));
    }
    return allVideos;
  }, [activeSmartPlaylist, smartPlaylists, allVideos, getTagsForVideo]);

  const baseVideos = showingHistory ? historyVideos : (smartFilteredVideos ?? videos);

  // Available formats for filter dropdown
  const availableFormats = useMemo(() => {
    const fmts = new Set(allVideos.map(v => v.format).filter(Boolean));
    return Array.from(fmts).sort();
  }, [allVideos]);

  const allTagsList = getAllTags();

  // Apply search, filters, and sort
  const processedVideos = useMemo(() => {
    let result = [...baseVideos];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(q));
    }

    // Format filter
    if (filters.formats.length > 0) {
      result = result.filter(v => filters.formats.includes(v.format));
    }

    // Duration filter (uses the stored duration from watch history or video metadata)
    if (filters.durationRange !== 'all') {
      result = result.filter(v => {
        const entry = getEntry(v.path);
        const dur = entry?.duration || v.duration || 0;
        if (dur === 0) return true; // include if unknown
        const mins = dur / 60;
        if (filters.durationRange === 'short') return mins < 5;
        if (filters.durationRange === 'medium') return mins >= 5 && mins <= 30;
        if (filters.durationRange === 'long') return mins > 30;
        return true;
      });
    }

    // Tag filter
    if (filters.tags.length > 0) {
      result = result.filter(v => {
        const vTags = getTagsForVideo(v.path);
        return filters.tags.some(t => vTags.includes(t));
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'duration') cmp = (a.duration || 0) - (b.duration || 0);
      else if (sortField === 'size') cmp = a.size - b.size;
      else if (sortField === 'format') cmp = a.format.localeCompare(b.format);
      return sortDirection === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [baseVideos, searchQuery, filters, sortField, sortDirection, getEntry, getTagsForVideo]);

  // Note counts & tag maps for VideoGrid
  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allVideos.forEach(v => {
      const c = getNoteCount(v.path);
      if (c > 0) counts[v.path] = c;
    });
    return counts;
  }, [allVideos, getNoteCount]);

  const videoTagsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    allVideos.forEach(v => {
      const t = getTagsForVideo(v.path);
      if (t.length > 0) map[v.path] = t;
    });
    return map;
  }, [allVideos, getTagsForVideo]);

  const showPlayer = currentVideo && !isMiniPlayer;

  const handleShowHistory = useCallback(() => {
    setShowingHistory(true);
    setFilterPlaylist(null);
    setActiveSmartPlaylist(null);
  }, [setFilterPlaylist]);

  const handleSelectPlaylist = useCallback((path: string | null) => {
    setFilterPlaylist(path);
    setShowingHistory(false);
    setActiveSmartPlaylist(null);
  }, [setFilterPlaylist]);

  const handleSelectSmartPlaylist = useCallback((id: string | null) => {
    setActiveSmartPlaylist(id);
    setShowingHistory(false);
    setFilterPlaylist(null);
  }, [setFilterPlaylist]);

  return (
    <div className="flex h-screen flex-col bg-background dark">
      <Header
        onOpenFolder={openFolder}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSearch={setSearchQuery}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          playlists={playlists}
          activePlaylist={filterPlaylist}
          onSelectPlaylist={handleSelectPlaylist}
          isOpen={sidebarOpen}
          totalVideos={allVideos.length}
          recentlyWatched={recentlyWatched}
          onShowHistory={handleShowHistory}
          showingHistory={showingHistory}
          smartPlaylists={smartPlaylists}
          activeSmartPlaylist={activeSmartPlaylist}
          onSelectSmartPlaylist={handleSelectSmartPlaylist}
          onRemoveSmartPlaylist={removeSmartPlaylist}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Scanning folder...</span>
            </div>
          ) : showPlayer ? (
            <VideoPlayer
              video={currentVideo}
              onClose={() => setCurrentVideo(null)}
              onMinimize={() => setIsMiniPlayer(true)}
              onNext={playNext}
              onPrev={playPrev}
              resumePosition={getEntry(currentVideo.path)?.position}
              onPositionUpdate={(pos, dur) => updatePosition(currentVideo.path, pos, dur)}
              notes={getNotesForVideo(currentVideo.path)}
              onAddNote={(ts, note) => addNote(currentVideo.path, ts, note)}
              onRemoveNote={removeNote}
              tags={getTagsForVideo(currentVideo.path)}
              allTags={allTagsList}
              onAddTag={(tag) => addTag(currentVideo.path, tag)}
              onRemoveTag={(tag) => removeTag(currentVideo.path, tag)}
            />
          ) : allVideos.length === 0 ? (
            <EmptyState onOpenFolder={openFolder} />
          ) : (
            <>
              <SortFilterBar
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={(f, d) => { setSortField(f); setSortDirection(d); }}
                filters={filters}
                onFiltersChange={setFilters}
                availableFormats={availableFormats}
                availableTags={allTagsList}
                totalCount={baseVideos.length}
                filteredCount={processedVideos.length}
              />
              <ScrollArea className="flex-1 scrollbar-thin">
                <VideoGrid
                  videos={processedVideos}
                  onPlay={playVideo}
                  watchHistory={history}
                  noteCounts={noteCounts}
                  videoTags={videoTagsMap}
                />
              </ScrollArea>
            </>
          )}
        </main>
      </div>

      {isMiniPlayer && currentVideo && (
        <MiniPlayer
          video={currentVideo}
          onExpand={() => setIsMiniPlayer(false)}
          onClose={() => { setCurrentVideo(null); setIsMiniPlayer(false); }}
          onNext={playNext}
        />
      )}
    </div>
  );
};

export default Index;
