import { create } from 'zustand';
import { pointagesAPI } from '../services/api';

export const usePointageStore = create((set, get) => ({
  // date -> { employeId -> pointage }
  pointagesByDate: {},
  currentDate: null,
  loading: false,
  pointagesMois: [],

  fetchByMonth: async (mois, annee) => {
    set({ loading: true });
    const result = await pointagesAPI.getByMois(mois, annee);
    if (result.success) {
      set({ pointagesMois: result.data || [], loading: false });
    } else {
      set({ loading: false });
    }
  },

  fetchByDate: async (date) => {
    set({ loading: true, currentDate: date });
    const result = await pointagesAPI.getByDate(date);
    if (result.success) {
      const byEmploye = {};
      for (const p of result.data) {
        byEmploye[p.employe_id] = p;
      }
      set((state) => ({
        pointagesByDate: { ...state.pointagesByDate, [date]: byEmploye },
        loading: false,
      }));
    } else {
      set({ loading: false });
    }
  },

  getPointagesForDate: (date) => {
    return get().pointagesByDate[date] || {};
  },

  // Local update (before save)
  updateLocal: (date, employeId, field, value) => {
    set((state) => {
      const existing = state.pointagesByDate[date] || {};
      const emp = existing[employeId] || {};
      return {
        pointagesByDate: {
          ...state.pointagesByDate,
          [date]: {
            ...existing,
            [employeId]: { ...emp, [field]: value, employe_id: employeId },
          },
        },
      };
    });
  },

  // Save all pointages for a date to Rust backend
  saveAll: async (date, employes) => {
    const existing = get().pointagesByDate[date] || {};
    const pointages = employes
      .filter((emp) => existing[emp.id]?.statut)
      .map((emp) => {
        const p = existing[emp.id];
        return {
          employe_id: emp.id,
          date,
          statut: p.statut,
          heures_supp: p.heures_supp || 0,
          jours_travailles: p.jours_travailles ?? 1,
          avance: p.avance || 0,
          note: p.note || null,
        };
      });

    if (pointages.length === 0) return { success: false, error: 'Aucun pointage à sauvegarder' };
    const result = await pointagesAPI.savePointages(date, pointages);
    return result;
  },
}));