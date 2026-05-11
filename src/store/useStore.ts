import { create } from 'zustand';
import { createProfileSlice, type ProfileSlice } from './slices/profileSlice';
import { createMetierSlice, type MetierSlice } from './slices/metierSlice';
import { createWhiteboardSlice, type WhiteboardSlice } from './slices/whiteboardSlice';

type StoreState = ProfileSlice & MetierSlice & WhiteboardSlice & {
  loaded: boolean;
  loading: boolean;
  loadedUserId: string | null;
  loadAll: (userId: string) => Promise<void>;
  clearLocal: () => void;
};

export const useStore = create<StoreState>()((set, get, api) => ({
  loaded: false,
  loading: false,
  loadedUserId: null,

  ...createProfileSlice(set, get, api),
  ...createMetierSlice(set, get, api),
  ...createWhiteboardSlice(set, get, api),

  clearLocal: () => set({
    loaded: false, loadedUserId: null, loading: false,
    profile: null,
    categories: [], transactions: [], recurrentes: [],
    comptesCourants: [], comptes: [], mouvements: [], objectifs: [],
    sheets: [], activeSheetId: null, wbModules: [],
  }),

  loadAll: async (userId) => {
    if (get().loadedUserId === userId && get().loaded) return;
    get().clearLocal();
    set({ loading: true });
    try {
      await Promise.all([
        get().loadProfile(userId),
        get().loadMetier(userId),
        get().loadWhiteboard(userId),
      ]);
      set({ loaded: true, loading: false, loadedUserId: userId });
    } catch (e) {
      console.error('loadAll error:', e);
      set({ loaded: false, loading: false });
    }
  },
}));
