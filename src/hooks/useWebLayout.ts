import { useState, useCallback } from 'react';

export type WebLayout = 'youtube' | 'netflix' | 'twitch' | 'plex' | 'tiktok';

export interface WebLayoutConfig {
  showSidebar: boolean;
  sidebarStyle: 'full' | 'slim' | 'none';
  showHero: boolean;
  groupByFolder: boolean;
}

const layoutConfigs: Record<WebLayout, WebLayoutConfig> = {
  youtube: { showSidebar: true, sidebarStyle: 'full', showHero: false, groupByFolder: false },
  netflix: { showSidebar: false, sidebarStyle: 'none', showHero: true, groupByFolder: true },
  twitch: { showSidebar: true, sidebarStyle: 'slim', showHero: true, groupByFolder: false },
  plex: { showSidebar: true, sidebarStyle: 'full', showHero: false, groupByFolder: false },
  tiktok: { showSidebar: false, sidebarStyle: 'none', showHero: false, groupByFolder: false },
};

const STORAGE_KEY = 'web-layout';

export function useWebLayout() {
  const [webLayout, setWebLayoutState] = useState<WebLayout>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in layoutConfigs) return saved as WebLayout;
    } catch {}
    return 'youtube';
  });

  const setWebLayout = useCallback((layout: WebLayout) => {
    setWebLayoutState(layout);
    try { localStorage.setItem(STORAGE_KEY, layout); } catch {}
  }, []);

  const config = layoutConfigs[webLayout];

  return { webLayout, setWebLayout, config };
}
