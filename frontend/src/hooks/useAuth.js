import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Détection de l'environnement Tauri
const isTauri = () => {
  return typeof window !== 'undefined' && (window.__TAURI__ !== undefined || window.__TAURI_INTERNALS__ !== undefined);
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        // Version Tauri (si disponible)
        if (isTauri()) {
          try {
            const { invoke } = await import('@tauri-apps/api/tauri');
            // On utilise la signature attendue par le backend Rust
            const result = await invoke('login', { request: { email, password } });
            if (result && result.user) {
              set({ user: result.user, token: result.token });
              return true;
            }
          } catch (error) {
            console.error('Tauri login failed, falling back to demo mode:', error);
            // On ne retourne pas false ici pour permettre au fallback de s'exécuter
          }
        }

        
        // Fallback pour le développement
        if ((email === 'admin@klbeton.com' || email === 'admin@klbeton.tn') && password === 'admin123') {
          set({
            user: {
              id: 1,
              email: email,
              nom: 'Admin',
              prenom: 'System',
              name: 'Admin System', // Ajout du champ name pour compatibilité Sidebar
              role: 'admin'
            },
            token: 'fake-token'
          });
          return true;
        }
        if ((email === 'chef@klbeton.com' || email === 'chef@klbeton.tn') && password === 'chef123') {
          set({
            user: {
              id: 2,
              email: email,
              nom: 'Chef',
              prenom: 'Mohamed',
              name: 'Chef Mohamed', // Ajout du champ name pour compatibilité Sidebar
              role: 'chef'
            },
            token: 'fake-token'
          });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useAuth = () => {
  const { user, token, login, logout } = useAuthStore();
  return { user, token, login, logout };
};