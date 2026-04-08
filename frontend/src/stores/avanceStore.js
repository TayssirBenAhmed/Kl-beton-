import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export const useAvanceStore = create((set, get) => ({
  avances: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const data = await invoke('get_all_advances');
      set({ avances: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      console.error('[AvanceStore] fetchAll error:', err);
      set({ error: String(err), loading: false, avances: [] });
    }
  },

  // approve_advance returns Ok(()) in Rust → null in JS (not { success: true })
  // Must NOT check result.success — just catch errors
  approve: async (id) => {
    try {
      await invoke('approve_advance', { id });
      await get().fetchAll();
      return { success: true };
    } catch (err) {
      console.error('[AvanceStore] approve error:', err);
      return { success: false, error: String(err) };
    }
  },

  // Same pattern for reject
  reject: async (id) => {
    try {
      await invoke('reject_advance', { id });
      await get().fetchAll();
      return { success: true };
    } catch (err) {
      console.error('[AvanceStore] reject error:', err);
      return { success: false, error: String(err) };
    }
  },
}));
