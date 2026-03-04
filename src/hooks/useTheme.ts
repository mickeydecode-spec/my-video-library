import { useState, useEffect, useCallback } from 'react';
import { ThemeMode, ThemePreset } from '@/components/ThemeSelector';

const STORAGE_KEY = 'mytube_theme';

interface ThemeState {
  mode: ThemeMode;
  preset: ThemePreset;
}

const presetVars: Record<ThemePreset, Record<string, string>> = {
  youtube: {
    '--primary': '0 72% 51%',
    '--ring': '0 72% 51%',
    '--sidebar-primary': '0 72% 51%',
    '--sidebar-ring': '0 72% 51%',
  },
  netflix: {
    '--primary': '0 84% 44%',
    '--ring': '0 84% 44%',
    '--sidebar-primary': '0 84% 44%',
    '--sidebar-ring': '0 84% 44%',
  },
  plex: {
    '--primary': '40 96% 50%',
    '--ring': '40 96% 50%',
    '--sidebar-primary': '40 96% 50%',
    '--sidebar-ring': '40 96% 50%',
  },
};

function loadTheme(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { mode: 'dark', preset: 'youtube' };
}

function applyPreset(preset: ThemePreset) {
  const vars = presetVars[preset];
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeState>(loadTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme.mode]);

  useEffect(() => {
    applyPreset(theme.preset);
  }, [theme.preset]);

  const setMode = useCallback((mode: ThemeMode) => {
    setTheme(prev => ({ ...prev, mode }));
  }, []);

  const setPreset = useCallback((preset: ThemePreset) => {
    setTheme(prev => ({ ...prev, preset }));
  }, []);

  return { mode: theme.mode, preset: theme.preset, setMode, setPreset };
}
