import { create } from 'zustand'

const stored = () => {
  try {
    const u = localStorage.getItem('dt_user')
    return u ? JSON.parse(u) : null
  } catch { return null }
}

export const useAuthStore = create((set, get) => ({
  user:  stored(),
  token: localStorage.getItem('dt_token') || null,

  setAuth: (token, user) => {
    localStorage.setItem('dt_token', token)
    localStorage.setItem('dt_user', JSON.stringify(user))
    set({ token, user })
  },

  setUser: user => {
    localStorage.setItem('dt_user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('dt_token')
    localStorage.removeItem('dt_user')
    set({ token: null, user: null })
  },

  isLoggedIn: () => !!get().token,
}))
