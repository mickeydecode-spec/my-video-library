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
import { useTheme } from '@/hooks/useTheme';
import { useLayoutPreference } from '@/hooks/useLayoutPreference';
import { useWebLayout } from '@/hooks/useWebLayout';
import { useVoiceControl } from '@/hooks/useVoiceControl';
import { useDataExport } from '@/hooks/useDataExport';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TikTokFeed } from '@/components/TikTokFeed';
import { NetflixBrowser } from '@/components/NetflixBrowser';
import { NetflixPlayer } from '@/components/NetflixPlayer';

const Index = () => {
  const {
    videos, allVideos, playlists, currentVideo, currentPlaylist,
    isLoading, isMiniPlayer, filterPlaylist,
    openFolder, playVideo, playNext, playPrev,
    setCurrentVideo, setIsMiniPlayer, setFilterPlaylist,
  } = useVideoLibrary();

  const { history, updatePosition, getEntry, getRecentlyWatched } = useWatchHistory();
  const { notes, addNote, removeNote, getNotesForVideo, getNoteCount } = useVideoNotes();
  const { tags, smartPlaylists, addTag, removeTag, getTagsForVideo, getAllTags, addSmartPlaylist, removeSmartPlaylist } = useTagManager();
  const { mode, preset, setMode, setPreset } = useTheme();
  const { layout, setLayout } = useLayoutPreference();
  const { webLayout, setWebLayout, config } = useWebLayout();
  const { exportData, importData } = useDataExport();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showingHistory, setShowingHistory] = useState(false);
  const [activeSmartPlaylist, setActiveSmartPlaylist] = useState<string | null>(null);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterState>({ formats: [], durationRange: 'all', tags: [] });

  // Voice control
  const voice = useVoiceControl({
    onPlay: () => {
      if (currentVideo) {
        const vid = document.querySelector('video');
        vid?.play();
      }
    },
    onPause: () => {
      const vid = document.querySelector('video');
      vid?.pause();
    },
    onNext: playNext,
    onPrevious: playPrev,
    onSearch: (q) => setSearchQuery(q),
  });

  const recentlyWatched = getRecentlyWatched(20);

  const historyVideos = useMemo(() => {
    if (!showingHistory) return [];
    return recentlyWatched
      .map(entry => allVideos.find(v => v.path === entry.videoPath))
      .filter(Boolean) as typeof allVideos;
  }, [showingHistory, recentlyWatched, allVideos]);

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

  const availableFormats = useMemo(() => {
    const fmts = new Set(allVideos.map(v => v.format).filter(Boolean));
    return Array.from(fmts).sort();
  }, [allVideos]);

  const allTagsList = getAllTags();

  const processedVideos = useMemo(() => {
    let result = [...baseVideos];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(q));
    }
    if (filters.formats.length > 0) {
      result = result.filter(v => filters.formats.includes(v.format));
    }
    if (filters.durationRange !== 'all') {
      result = result.filter(v => {
        const entry = getEntry(v.path);
        const dur = entry?.duration || v.duration || 0;
        if (dur === 0) return true;
        const mins = dur / 60;
        if (filters.durationRange === 'short') return mins < 5;
        if (filters.durationRange === 'medium') return mins >= 5 && mins <= 30;
        if (filters.durationRange === 'long') return mins > 30;
        return true;
      });
    }
    if (filters.tags.length > 0) {
      result = result.filter(v => {
        const vTags = getTagsForVideo(v.path);
        return filters.tags.some(t => vTags.includes(t));
      });
    }
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

  const handleImport = useCallback(async () => {
    const success = await importData();
    if (success) {
      toast({ title: 'Data imported', description: 'Reload the page to see changes.' });
    } else {
      toast({ title: 'Import failed', variant: 'destructive' });
    }
  }, [importData, toast]);

  // Sidebar visibility based on web layout
  const effectiveSidebarOpen = config.showSidebar ? sidebarOpen : false;

  // TikTok immersive mode
  if (webLayout === 'tiktok' && allVideos.length > 0) {
    return (
      <TikTokFeed
        videos={processedVideos}
        onExit={() => setWebLayout('youtube')}
        videoTags={videoTagsMap}
      />
    );
  }

  // Netflix immersive mode
  if (webLayout === 'netflix') {
    if (currentVideo) {
      return (
        <NetflixPlayer
          video={currentVideo}
          onBack={() => setCurrentVideo(null)}
          onNext={playNext}
          onPrev={playPrev}
          resumePosition={getEntry(currentVideo.path)?.position}
          onPositionUpdate={(pos, dur) => updatePosition(currentVideo.path, pos, dur)}
        />
      );
    }
    return (
      <NetflixBrowser
        videos={processedVideos}
        onPlay={playVideo}
        onExit={() => setWebLayout('youtube')}
        watchHistory={history}
        noteCounts={noteCounts}
        videoTags={videoTagsMap}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        onOpenFolder={openFolder}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSearch={setSearchQuery}
        themeMode={mode}
        themePreset={preset}
        onThemeModeChange={setMode}
        onThemePresetChange={setPreset}
        layout={layout}
        onLayoutChange={setLayout}
        voiceSupported={voice.isSupported}
        voiceListening={voice.isListening}
        onVoiceToggle={voice.isListening ? voice.stopListening : voice.startListening}
        onExport={exportData}
        onImport={handleImport}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          playlists={playlists}
          activePlaylist={filterPlaylist}
          onSelectPlaylist={handleSelectPlaylist}
          isOpen={effectiveSidebarOpen}
          totalVideos={allVideos.length}
          recentlyWatched={recentlyWatched}
          onShowHistory={handleShowHistory}
          showingHistory={showingHistory}
          smartPlaylists={smartPlaylists}
          activeSmartPlaylist={activeSmartPlaylist}
          onSelectSmartPlaylist={handleSelectSmartPlaylist}
          onRemoveSmartPlaylist={removeSmartPlaylist}
          webLayout={webLayout}
          onWebLayoutChange={setWebLayout}
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
                  layout={layout}
                  webLayout={webLayout}
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
