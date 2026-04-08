import { create } from 'zustand';
import { employesAPI } from '../services/api';

export const useEmployeStore = create((set, get) => ({
  employes: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const result = await employesAPI.getAll();
    if (result.success) {
      set({ employes: result.data, loading: false });
    } else {
      set({ error: result.error, loading: false });
    }
  },

  create: async (data) => {
    const result = await employesAPI.create(data);
    if (result.success) {
      await get().fetchAll();
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  },

  update: async (id, data) => {
    const result = await employesAPI.update(id, data);
    if (result.success) {
      await get().fetchAll();
      return { success: true };
    }
    return { success: false, error: result.error };
  },

  delete: async (id) => {
    const result = await employesAPI.delete(id);
    if (result.success) {
      await get().fetchAll();
      return { success: true };
    }
    return { success: false, error: result.error };
  },
}));