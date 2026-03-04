export interface VideoFile {
  id: string;
  name: string;
  path: string;
  folder: string;
  file: File;
  url: string;
  duration?: number;
  thumbnail?: string;
  subtitleFiles: SubtitleFile[];
}

export interface SubtitleFile {
  name: string;
  language: string;
  file: File;
  url: string;
}

export interface Playlist {
  name: string;
  path: string;
  videos: VideoFile[];
}

const VIDEO_EXTENSIONS = [
  '.mp4', '.webm', '.ogv', '.mkv', '.avi', '.mov', '.wmv',
  '.flv', '.m4v', '.3gp', '.ts', '.mts', '.m2ts'
];

const SUBTITLE_EXTENSIONS = ['.vtt', '.srt', '.ass', '.ssa', '.sub'];

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.substring(idx).toLowerCase() : '';
}

function getBaseName(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.substring(0, idx) : name;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  parentPath: string = ''
): Promise<{ videos: VideoFile[]; playlists: Playlist[] }> {
  const allVideos: VideoFile[] = [];
  const playlists: Playlist[] = [];

  await processDirectory(dirHandle, parentPath || dirHandle.name, allVideos, playlists);

  // Create a root playlist for videos directly in root
  const rootVideos = allVideos.filter(v => v.folder === (parentPath || dirHandle.name));
  if (rootVideos.length > 0) {
    playlists.unshift({
      name: dirHandle.name,
      path: parentPath || dirHandle.name,
      videos: rootVideos,
    });
  }

  return { videos: allVideos, playlists };
}

async function processDirectory(
  dirHandle: FileSystemDirectoryHandle,
  currentPath: string,
  allVideos: VideoFile[],
  playlists: Playlist[]
): Promise<void> {
  const files: { name: string; file: File }[] = [];
  const subdirs: { name: string; handle: FileSystemDirectoryHandle }[] = [];

  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      files.push({ name: entry.name, file });
    } else if (entry.kind === 'directory') {
      subdirs.push({ name: entry.name, handle: entry });
    }
  }

  // Find video and subtitle files
  const videoFiles = files.filter(f => VIDEO_EXTENSIONS.includes(getExtension(f.name)));
  const subtitleFilesRaw = files.filter(f => SUBTITLE_EXTENSIONS.includes(getExtension(f.name)));

  const folderVideos: VideoFile[] = videoFiles.map(vf => {
    const baseName = getBaseName(vf.name);
    // Match subtitles: videoname.en.srt, videoname.srt, etc.
    const matchingSubs = subtitleFilesRaw
      .filter(sf => {
        const subBase = getBaseName(sf.name);
        return subBase === baseName || subBase.startsWith(baseName + '.');
      })
      .map(sf => {
        const subBase = getBaseName(sf.name);
        const parts = subBase.split('.');
        const lang = parts.length > 1 ? parts[parts.length - 1] : 'default';
        const ext = getExtension(sf.name);
        return {
          name: sf.name,
          language: lang,
          file: sf.file,
          url: URL.createObjectURL(sf.file),
          // Convert SRT to VTT on-the-fly if needed
          needsConversion: ext === '.srt' || ext === '.ass' || ext === '.ssa' || ext === '.sub',
        };
      });

    const url = URL.createObjectURL(vf.file);

    return {
      id: generateId(),
      name: vf.name,
      path: currentPath + '/' + vf.name,
      folder: currentPath,
      file: vf.file,
      url,
      subtitleFiles: matchingSubs,
    };
  });

  allVideos.push(...folderVideos);

  // Process subdirectories
  for (const subdir of subdirs) {
    const subPath = currentPath + '/' + subdir.name;
    const beforeCount = allVideos.length;
    await processDirectory(subdir.handle, subPath, allVideos, playlists);
    const subVideos = allVideos.filter(v => v.folder === subPath);
    if (subVideos.length > 0) {
      playlists.push({
        name: subdir.name,
        path: subPath,
        videos: subVideos,
      });
    }
  }
}

export function convertSrtToVtt(srtContent: string): string {
  let vtt = 'WEBVTT\n\n';
  vtt += srtContent
    .replace(/\r\n/g, '\n')
    .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4');
  return vtt;
}

export async function loadSubtitleAsVtt(sub: SubtitleFile): Promise<string> {
  const text = await sub.file.text();
  const ext = getExtension(sub.name);
  if (ext === '.vtt') {
    return sub.url;
  }
  // Convert SRT to VTT
  if (ext === '.srt') {
    const vttText = convertSrtToVtt(text);
    const blob = new Blob([vttText], { type: 'text/vtt' });
    return URL.createObjectURL(blob);
  }
  // For other formats, attempt basic conversion
  const vttText = convertSrtToVtt(text);
  const blob = new Blob([vttText], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}
