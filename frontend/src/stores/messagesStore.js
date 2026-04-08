import { create } from 'zustand';
import { messagesAPI } from '../services/api';

export const useMessagesStore = create((set, get) => ({
  messages: [],
  unreadCount: 0,
  loading: false,

  fetchMessages: async (userId) => {
    set({ loading: true });
    const result = await messagesAPI.getMessages(userId);
    if (result.success) {
      set({ messages: result.data, loading: false });
    } else {
      set({ loading: false });
    }
  },

  sendMessage: async (senderId, receiverId, content) => {
    const result = await messagesAPI.send(senderId, receiverId, content);
    if (result.success) {
      set((state) => ({ messages: [...state.messages, result.data] }));
      return { success: true };
    }
    return { success: false, error: result.error };
  },

  markRead: async (receiverId) => {
    await messagesAPI.markRead(receiverId);
    set((state) => ({
      messages: state.messages.map((m) =>
        m.receiver_id === receiverId ? { ...m, is_read: true } : m
      ),
      unreadCount: 0,
    }));
  },

  fetchUnread: async (userId) => {
    const result = await messagesAPI.getUnreadCount(userId);
    if (result.success) {
      set({ unreadCount: result.data });
    }
  },
}));
