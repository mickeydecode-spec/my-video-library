import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VideoGrid } from '@/components/VideoGrid';
import { VideoPlayer } from '@/components/VideoPlayer';
import { MiniPlayer } from '@/components/MiniPlayer';
import { EmptyState } from '@/components/EmptyState';
import { useVideoLibrary } from '@/hooks/useVideoLibrary';
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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = useMemo(() => {
    if (!searchQuery) return videos;
    const q = searchQuery.toLowerCase();
    return videos.filter(v => v.name.toLowerCase().includes(q));
  }, [videos, searchQuery]);

  const showPlayer = currentVideo && !isMiniPlayer;

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
          onSelectPlaylist={setFilterPlaylist}
          isOpen={sidebarOpen}
          totalVideos={allVideos.length}
        />

        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full scrollbar-thin">
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
              />
            ) : allVideos.length === 0 ? (
              <EmptyState onOpenFolder={openFolder} />
            ) : (
              <VideoGrid videos={filteredVideos} onPlay={playVideo} />
            )}
          </ScrollArea>
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
