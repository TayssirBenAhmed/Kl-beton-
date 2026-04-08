import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export const usePretStore = create((set, get) => ({
  prets: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const data = await invoke('get_all_prets');
      set({ prets: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      console.error('[PretStore] fetchAll error:', err);
      set({ error: String(err), loading: false, prets: [] });
    }
  },

  // Tauri v1 : les noms d'arguments doivent être en camelCase côté JS
  // employe_id → employeId, montant_total → montantTotal, pret_id → pretId
  create: async (employeId, montantTotal, mensualite) => {
    try {
      const pret = await invoke('create_pret', { employeId, montantTotal, mensualite });
      await get().fetchAll();
      return { success: true, pret };
    } catch (err) {
      console.error('[PretStore] create error:', err);
      return { success: false, error: String(err) };
    }
  },

  // montantEffectif : montant réellement prélevé ce mois (peut être < mensualite
  //   si le salaire ne couvre pas la mensualité complète). Pass null to use default.
  rembourser: async (pretId, montantEffectif = null) => {
    try {
      const args = { pretId };
      if (montantEffectif != null) args.montantEffectif = montantEffectif;
      const montant = await invoke('rembourser_mensualite', args);
      await get().fetchAll();
      return { success: true, montant };
    } catch (err) {
      console.error('[PretStore] rembourser error:', err);
      return { success: false, error: String(err) };
    }
  },
}));
