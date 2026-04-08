import { invoke } from '@tauri-apps/api/tauri';

const handleInvoke = async (method, args) => {
  try {
    const result = await invoke(method, args);
    return { success: true, data: result };
  } catch (error) {
    console.error(`[API] Error (${method}):`, error);
    let errorMessage = error;
    if (typeof error === 'object' && error !== null) {
      errorMessage = Object.values(error)[0] || JSON.stringify(error);
    }
    return { success: false, error: String(errorMessage) };
  }
};

export const authAPI = {
  login: (email, password) =>
    handleInvoke('login', { request: { email, password } }),
  getCurrentUser: (token) =>
    handleInvoke('get_current_user', { token }),
  logout: () => handleInvoke('logout'),
  getUsersByRole: (role) =>
    handleInvoke('get_users_by_role', { role }),
};

export const employesAPI = {
  getAll: () => handleInvoke('get_all_employees'),
  getById: (id) => handleInvoke('get_employe_by_id', { id }),
  create: (data) => handleInvoke('create_employe', { data }),
  update: (id, data) => handleInvoke('update_employe', { id, data }),
  delete: (id) => handleInvoke('delete_employe', { id }),
};

export const pointagesAPI = {
  getByDate: (date) =>
    handleInvoke('get_pointages', { dateDebut: date, dateFin: date }),
  getByRange: (dateDebut, dateFin) =>
    handleInvoke('get_pointages', { dateDebut, dateFin }),
  getByMois: (mois, annee) =>
    handleInvoke('get_pointages_mois', { mois, annee }),
  savePointages: (date, pointages) =>
    handleInvoke('save_pointages', { date, pointages }),
};

export const avancesAPI = {
  getAll: () => handleInvoke('get_all_advances'),
  create: (employeId, montant) =>
    handleInvoke('create_advance', { employeId, montant }),
  approve: (id) => handleInvoke('approve_advance', { id }),
  reject: (id) => handleInvoke('reject_advance', { id }),
};

export const messagesAPI = {
  getMessages: (userId) => handleInvoke('get_messages', { userId }),
  send: (senderId, receiverId, content) =>
    handleInvoke('send_message', { senderId, receiverId, content }),
  markRead: (receiverId) =>
    handleInvoke('mark_messages_read', { receiverId }),
  getUnreadCount: (userId) =>
    handleInvoke('get_unread_count', { userId }),
};

export const statsAPI = {
  getDashboard: (mois?: number, annee?: number) =>
    handleInvoke('get_dashboard_stats', { mois: mois ?? null, annee: annee ?? null }),
};

const API = {
  auth: authAPI,
  employes: employesAPI,
  pointages: pointagesAPI,
  avances: avancesAPI,
  messages: messagesAPI,
  stats: statsAPI,
};

export default API;
