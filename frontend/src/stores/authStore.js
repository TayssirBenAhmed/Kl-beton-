import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (email, password) => {
        set({ loading: true });
        const result = await authAPI.login(email, password);
        if (result.success) {
          set({
            user: result.data.user,
            token: result.data.token,
            isAuthenticated: true,
            loading: false,
          });
          return { success: true, user: result.data.user };
        } else {
          set({ loading: false });
          return { success: false, error: result.error };
        }
      },

      logout: async () => {
        await authAPI.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return false;
        const result = await authAPI.getCurrentUser(token);
        if (result.success) {
          set({ user: result.data, isAuthenticated: true });
          return true;
        } else {
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }
      },
    }),
    {
      name: 'kl-auth-v3',
      getStorage: () => localStorage,
    }
  )
);

export const useAuth = () => {
  const state = useAuthStore();
  return {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    login: state.login,
    logout: state.logout,
    checkAuth: state.checkAuth,
  };
};