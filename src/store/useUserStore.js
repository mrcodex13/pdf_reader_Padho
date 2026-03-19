import { create } from 'zustand'
import { lsGet, lsSet, lsRemove } from '../utils/localDb'

const USER_KEY = 'padhoPadho_user'

export const useUserStore = create((set) => ({
  user: lsGet(USER_KEY),

  setUser: (user) => {
    if (user) lsSet(USER_KEY, user)
    else lsRemove(USER_KEY)
    set({ user })
  },

  logout: () => {
    lsRemove(USER_KEY)
    set({ user: null })
  },
}))
