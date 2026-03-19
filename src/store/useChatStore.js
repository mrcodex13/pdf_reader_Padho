import { create } from 'zustand'

export const useChatStore = create((set) => ({
  mode: 'discuss',
  messages: [],

  setMode: (mode) => set({ mode }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
}))
