import { create } from 'zustand'

const PREF_KEY = 'dt_theme'

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(pref) {
  const effective = pref === 'system' ? getSystemTheme() : pref
  document.documentElement.classList.toggle('dark', effective === 'dark')
  document.documentElement.setAttribute('data-theme', effective)
}

const savedPref = localStorage.getItem(PREF_KEY) || 'system'
applyTheme(savedPref)

export const useThemeStore = create(set => ({
  preference: savedPref,

  setTheme: pref => {
    localStorage.setItem(PREF_KEY, pref)
    applyTheme(pref)
    set({ preference: pref })
  },

  isDark: () => document.documentElement.classList.contains('dark'),
}))

// Watch system changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const pref = localStorage.getItem(PREF_KEY) || 'system'
  if (pref === 'system') applyTheme('system')
})
