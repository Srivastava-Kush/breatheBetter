import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Location } from '../types';

export const isSyntheticLocationId = (id: unknown): boolean =>
  typeof id === 'number' && id >= 4663000 && id <= 4665000;

interface AppState {
  selectedLocationId: number | null;
  recentLocations: Location[];
  compareLocationIds: number[];
  setSelectedLocation: (id: number | null) => void;
  addRecentLocation: (loc: Location) => void;
  addCompareLocation: (id: number) => void;
  removeCompareLocation: (id: number) => void;
  clearCompareLocations: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedLocationId: null,
      recentLocations: [],
      compareLocationIds: [],

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
      version: 3,
      migrate: (persistedState: any) => {
        if (persistedState) {
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

