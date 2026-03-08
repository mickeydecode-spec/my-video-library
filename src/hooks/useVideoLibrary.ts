import { useState, useCallback } from 'react';
import { VideoFile, Playlist, scanDirectory } from '@/lib/fileScanner';

export function useVideoLibrary() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [filterPlaylist, setFilterPlaylist] = useState<string | null>(null);

  const openFolder = useCallback(async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      setIsLoading(true);
      const result = await scanDirectory(dirHandle);
      setVideos(result.videos);
      setPlaylists(result.playlists);
      setFilterPlaylist(null);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      // User cancelled
    }
  }, []);

  const playVideo = useCallback((video: VideoFile) => {
    setCurrentVideo(video);
    setIsMiniPlayer(false);
    const pl = playlists.find(p => p.videos.some(v => v.id === video.id));
    if (pl) setCurrentPlaylist(pl);
  }, [playlists]);

  const playNext = useCallback(() => {
    if (!currentVideo || !currentPlaylist) return;
    const idx = currentPlaylist.videos.findIndex(v => v.id === currentVideo.id);
    if (idx < currentPlaylist.videos.length - 1) {
      setCurrentVideo(currentPlaylist.videos[idx + 1]);
    }
  }, [currentVideo, currentPlaylist]);

  const playPrev = useCallback(() => {
    if (!currentVideo || !currentPlaylist) return;
    const idx = currentPlaylist.videos.findIndex(v => v.id === currentVideo.id);
    if (idx > 0) {
      setCurrentVideo(currentPlaylist.videos[idx - 1]);
    }
  }, [currentVideo, currentPlaylist]);

  const displayedVideos = filterPlaylist
    ? videos.filter(v => v.folder === filterPlaylist || v.folder.startsWith(filterPlaylist + '/'))
    : videos;

  return {
    videos: displayedVideos,
    allVideos: videos,
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
  };
}
