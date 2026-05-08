import { ref } from 'vue'
import { defineStore } from 'pinia'
import { isStorageAvailable } from '@/utils/storage'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref<boolean>(false)

  function applyTheme(): void {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function initTheme(): void {
    let saved: string | null = null
    if (isStorageAvailable()) {
      saved = localStorage.getItem('theme')
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = saved ? saved === 'dark' : prefersDark
    applyTheme()
  }

  function setTheme(theme: 'light' | 'dark'): void {
    isDark.value = theme === 'dark'
    applyTheme()
    if (isStorageAvailable()) {
      localStorage.setItem('theme', theme)
    }
    // Sync with usePreferencesStore — import lazily to avoid circular dependency
    import('./preferences').then(({ usePreferencesStore }) => {
      const prefs = usePreferencesStore()
      if (typeof prefs.setTheme === 'function') {
        prefs.setTheme(theme)
      }
    })
  }

  function toggleTheme(): void {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  return { isDark, initTheme, setTheme, toggleTheme, applyTheme }
})
