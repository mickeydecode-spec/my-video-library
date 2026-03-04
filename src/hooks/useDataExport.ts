import { useCallback } from 'react';

const KEYS = [
  'mytube_watch_history',
  'mytube_tags',
  'mytube_smart_playlists',
  'mytube_video_notes',
  'mytube_theme',
  'mytube_layout',
];

export function useDataExport() {
  const exportData = useCallback(() => {
    const data: Record<string, any> = {};
    KEYS.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mytube-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importData = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) { resolve(false); return; }
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          Object.entries(data).forEach(([key, value]) => {
            if (KEYS.includes(key)) {
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            }
          });
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      input.click();
    });
  }, []);

  return { exportData, importData };
}
