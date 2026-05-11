import type { StateCreator } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Sheet, WbModule, Rect } from '@/types';
import { getUserId } from '../storeUtils';

const _dirty = new Map<string, { x: number; y: number; w: number; h: number }>();
const _vpTimers = new Map<string, ReturnType<typeof setTimeout>>();

export type WhiteboardSlice = {
  sheets: Sheet[];
  activeSheetId: string | null;
  wbModules: WbModule[];
  loadWhiteboard: (userId: string) => Promise<void>;
  createSheet: (name?: string) => Promise<Sheet>;
  deleteSheet: (id: string) => Promise<void>;
  renameSheet: (id: string, name: string) => Promise<void>;
  reorderSheets: (ids: string[]) => Promise<void>;
  setActiveSheet: (id: string) => void;
  saveSheetViewport: (id: string, zoom: number, panX: number, panY: number) => void;
  addWbModule: (sheetId: string, m: Omit<WbModule, 'id' | 'sheetId'>) => Promise<WbModule>;
  removeWbModule: (id: string) => Promise<void>;
  updateWbModuleLayout: (id: string, rect: Partial<Rect>) => void;
  updateWbModuleConfig: (id: string, config: Record<string, unknown>) => Promise<void>;
  flushLayoutUpdates: () => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createWhiteboardSlice: StateCreator<any, [], [], WhiteboardSlice> = (set, get) => ({
  sheets: [],
  activeSheetId: null,
  wbModules: [],

  loadWhiteboard: async (userId) => {
    const [{ data: sheetsData }, { data: modsData }] = await Promise.all([
      supabase.from('whiteboard_sheets').select('*').eq('user_id', userId).order('"order"'),
      supabase.from('whiteboard_modules').select('*').eq('user_id', userId),
    ]);
    const sheets: Sheet[] = (sheetsData ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      order: r.order as number,
      zoom: (r.zoom as number) ?? 1,
      panX: (r.pan_x as number) ?? 0,
      panY: (r.pan_y as number) ?? 0,
    }));
    const wbModules: WbModule[] = (modsData ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      sheetId: r.sheet_id as string,
      moduleKey: r.module_key as WbModule['moduleKey'],
      x: r.x as number, y: r.y as number, w: r.w as number, h: r.h as number,
      config: (r.config as Record<string, unknown>) ?? {},
    }));
    if (sheets.length === 0) {
      const sheet = await get().createSheet('Ma sheet');
      set({ sheets: [sheet], activeSheetId: sheet.id, wbModules: [] });
    } else {
      set({ sheets, activeSheetId: sheets[0].id, wbModules });
    }
  },

  createSheet: async (name = 'Sheet') => {
    const userId = await getUserId();
    const order: number = get().sheets.length;
    const { data, error } = await supabase
      .from('whiteboard_sheets')
      .insert({ user_id: userId, name, order })
      .select('*').single();
    if (error || !data) throw error;
    const sheet: Sheet = { id: data.id, name: data.name, order: data.order, zoom: 1, panX: 0, panY: 0 };
    set((s: { sheets: Sheet[] }) => ({ sheets: [...s.sheets, sheet] }));
    return sheet;
  },

  deleteSheet: async (id) => {
    const { sheets, activeSheetId, wbModules } = get() as { sheets: Sheet[]; activeSheetId: string | null; wbModules: WbModule[] };
    if (sheets.length <= 1) return;
    await supabase.from('whiteboard_sheets').delete().eq('id', id);
    const remaining = sheets.filter((s) => s.id !== id);
    set({ sheets: remaining, activeSheetId: activeSheetId === id ? remaining[0].id : activeSheetId, wbModules: wbModules.filter((m) => m.sheetId !== id) });
  },

  renameSheet: async (id, name) => {
    await supabase.from('whiteboard_sheets').update({ name }).eq('id', id);
    set((s: { sheets: Sheet[] }) => ({ sheets: s.sheets.map((sh) => (sh.id === id ? { ...sh, name } : sh)) }));
  },

  reorderSheets: async (ids) => {
    await Promise.all(ids.map((id, idx) => supabase.from('whiteboard_sheets').update({ order: idx }).eq('id', id)));
    set((s: { sheets: Sheet[] }) => ({
      sheets: [...s.sheets].map((sh) => ({ ...sh, order: ids.indexOf(sh.id) })).sort((a, b) => a.order - b.order),
    }));
  },

  setActiveSheet: (id) => set({ activeSheetId: id }),

  saveSheetViewport: (id, zoom, panX, panY) => {
    set((s: { sheets: Sheet[] }) => ({
      sheets: s.sheets.map((sh) => (sh.id === id ? { ...sh, zoom, panX, panY } : sh)),
    }));
    const existing = _vpTimers.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      _vpTimers.delete(id);
      supabase.from('whiteboard_sheets').update({ zoom, pan_x: panX, pan_y: panY }).eq('id', id);
    }, 500);
    _vpTimers.set(id, t);
  },

  addWbModule: async (sheetId, m) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('whiteboard_modules')
      .insert({ sheet_id: sheetId, user_id: userId, module_key: m.moduleKey, x: m.x, y: m.y, w: m.w, h: m.h, config: m.config })
      .select('*').single();
    if (error || !data) throw error;
    const mod: WbModule = { id: data.id, sheetId: data.sheet_id, moduleKey: data.module_key, x: data.x, y: data.y, w: data.w, h: data.h, config: data.config ?? {} };
    set((s: { wbModules: WbModule[] }) => ({ wbModules: [...s.wbModules, mod] }));
    return mod;
  },

  removeWbModule: async (id) => {
    await supabase.from('whiteboard_modules').delete().eq('id', id);
    _dirty.delete(id);
    set((s: { wbModules: WbModule[] }) => ({ wbModules: s.wbModules.filter((m) => m.id !== id) }));
  },

  updateWbModuleLayout: (id, rect) => {
    set((s: { wbModules: WbModule[] }) => {
      const updated = s.wbModules.map((m) => (m.id === id ? { ...m, ...rect } : m));
      const mod = updated.find((m) => m.id === id);
      if (mod) _dirty.set(id, { x: mod.x, y: mod.y, w: mod.w, h: mod.h });
      return { wbModules: updated };
    });
  },

  updateWbModuleConfig: async (id, config) => {
    await supabase.from('whiteboard_modules').update({ config }).eq('id', id);
    set((s: { wbModules: WbModule[] }) => ({
      wbModules: s.wbModules.map((m) => (m.id === id ? { ...m, config } : m)),
    }));
  },

  flushLayoutUpdates: async () => {
    if (_dirty.size === 0) return;
    const entries = Array.from(_dirty.entries());
    _dirty.clear();
    await Promise.all(
      entries.map(([id, r]) =>
        supabase.from('whiteboard_modules').update({ x: r.x, y: r.y, w: r.w, h: r.h }).eq('id', id)
      )
    );
  },
});
