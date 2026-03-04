import { useState, useCallback, useEffect } from 'react';

export type LayoutMode = 'grid' | 'list' | 'compact';

const STORAGE_KEY = 'mytube_layout';

export function useLayoutPreference() {
  const [layout, setLayoutState] = useState<LayoutMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as LayoutMode) || 'grid';
    } catch {
      return 'grid';
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, layout);
  }, [layout]);

  const setLayout = useCallback((mode: LayoutMode) => {
    setLayoutState(mode);
  }, []);

  return { layout, setLayout };
}
