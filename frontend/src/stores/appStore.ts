import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Location } from '../types';

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

      setSelectedLocation: (id) => set({ selectedLocationId: id }),

      addRecentLocation: (loc) =>
        set((state) => {
          const filtered = state.recentLocations.filter(
            (l) => l.openaqId !== loc.openaqId
          );
          return {
            recentLocations: [loc, ...filtered].slice(0, 10),
            selectedLocationId: loc.openaqId,
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
    { name: 'breathebetter-store' }
  )
);

