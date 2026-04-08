import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

/**
 * Merit Bonus Store
 *
 * Persists monthly merit assignments to SQLite via Tauri commands.
 * State: { [employe_id]: boolean }  (true = merit granted for current month)
 */
export const useMeritStore = create((set, get) => ({
  // { employe_id: true } — only entries for employees who HAVE merit
  meritMap: {},
  loading:  false,

  // ── LOAD for a given month ────────────────────────────────────────────────
  fetchMois: async (month, year) => {
    const mois = `${year}-${String(month).padStart(2, '0')}`;
    set({ loading: true });
    try {
      const entries = await invoke('get_all_merit_mois', { mois });
      // Build { employe_id: true } map
      const map = {};
      for (const e of entries) {
        if (e.has_merit) map[e.employe_id] = true;
      }
      set({ meritMap: map, loading: false });
    } catch (err) {
      console.error('[MeritStore] fetchMois error:', err);
      set({ loading: false });
    }
  },

  // ── TOGGLE (saves immediately to DB) ─────────────────────────────────────
  toggle: async (employe_id, month, year, is_merit) => {
    const mois = `${year}-${String(month).padStart(2, '0')}`;
    // Optimistic local update — UI feels instant
    set(state => {
      const next = { ...state.meritMap };
      if (is_merit) {
        next[employe_id] = true;
      } else {
        delete next[employe_id];
      }
      return { meritMap: next };
    });
    // Persist to SQLite
    try {
      await invoke('save_merit_status', { employeId: employe_id, mois, isMerit: is_merit });
    } catch (err) {
      console.error('[MeritStore] toggle error:', err);
      // Roll back optimistic update on failure
      set(state => {
        const next = { ...state.meritMap };
        if (is_merit) {
          delete next[employe_id];
        } else {
          next[employe_id] = true;
        }
        return { meritMap: next };
      });
    }
  },
}));
