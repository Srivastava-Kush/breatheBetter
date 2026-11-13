import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Location } from '../types';

export const isSyntheticLocationId = (id: unknown): boolean =>
  typeof id === 'number' && id >= 4663000 && id <= 4665000;

export type ThemeMode = 'light' | 'dark' | 'system';

export function applyThemeToDOM(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}

interface AppState {
  theme: ThemeMode;
  selectedLocationId: number | null;
  recentLocations: Location[];
  compareLocationIds: number[];
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setSelectedLocation: (id: number | null) => void;
  addRecentLocation: (loc: Location) => void;
  addCompareLocation: (id: number) => void;
  removeCompareLocation: (id: number) => void;
  clearCompareLocations: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      selectedLocationId: null,
      recentLocations: [],
      compareLocationIds: [],

      setTheme: (theme) => {
        applyThemeToDOM(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const isCurrentlyDark =
          currentTheme === 'dark' ||
          (currentTheme === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        const nextTheme: ThemeMode = isCurrentlyDark ? 'light' : 'dark';
        applyThemeToDOM(nextTheme);
        set({ theme: nextTheme });
      },

      setSelectedLocation: (id) =>
        set({
          selectedLocationId: isSyntheticLocationId(id) ? null : id,
        }),

      addRecentLocation: (loc) =>
        set((state) => {
          const locId = Number(loc.openaqId || (loc as any).id);
          if (!locId || isSyntheticLocationId(locId)) return state;
          const filtered = state.recentLocations.filter(
            (l) => Number(l.openaqId || (l as any).id) !== locId
          );
          return {
            recentLocations: [{ ...loc, openaqId: locId }, ...filtered].slice(0, 10),
            selectedLocationId: locId,
          };
        }),

      addCompareLocation: (id) =>
        set((state) => ({
          compareLocationIds: state.compareLocationIds.includes(id)
            ? state.compareLocationIds
            : [...state.compareLocationIds, id].slice(0, 5),
        })),

      removeCompareLocation: (id) =>
        set((state) => ({
          compareLocationIds: state.compareLocationIds.filter((i) => i !== id),
        })),

      clearCompareLocations: () => set({ compareLocationIds: [] }),
    }),
    {
      name: 'breathebetter-store',
      version: 4,
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDOM(state.theme);
        } else {
          applyThemeToDOM('system');
        }
      },
      migrate: (persistedState: any) => {
        if (persistedState) {
          if (!persistedState.theme) {
            persistedState.theme = 'system';
          }
          if (
            typeof persistedState.selectedLocationId === 'number' &&
            isSyntheticLocationId(persistedState.selectedLocationId)
          ) {
            persistedState.selectedLocationId = null;
          }
          if (Array.isArray(persistedState.recentLocations)) {
            persistedState.recentLocations = persistedState.recentLocations.filter(
              (l: any) =>
                l &&
                typeof (l.openaqId || l.id) === 'number' &&
                !isSyntheticLocationId(Number(l.openaqId || l.id))
            );
          }
        }
        return persistedState;
      },
    }
  )
);

// Listen to system theme preference changes when mode is 'system'
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = useAppStore.getState().theme;
    if (currentTheme === 'system') {
      applyThemeToDOM('system');
    }
  });
}

/**
 * Hook to reactively observe whether dark mode is currently active
 */
export function useIsDark(): boolean {
  const theme = useAppStore((s) => s.theme);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const update = () => {
      const active =
        theme === 'dark' ||
        (theme === 'system' &&
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(active);
    };
    update();

    if (theme === 'system' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
  }, [theme]);

  return isDark;
}
