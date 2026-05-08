/**
 * Pinia auth store — manages authentication state.
 * Access Token is stored in-memory only (never localStorage).
 * Refresh Token is stored in localStorage under key 'refresh_token'.
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AuthUser } from '@/types'
import { isStorageAvailable } from '@/utils/storage'
import { login as apiLogin, register as apiRegister, logout as apiLogout, refreshToken as apiRefreshToken } from '@/api'

const REFRESH_TOKEN_KEY = 'refresh_token'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  /** Access token stored in-memory only — never persisted to localStorage */
  const accessToken = ref<string | null>(null)

  /** Authenticated user info stored in-memory only */
  const user = ref<AuthUser | null>(null)

  // ── Computed ───────────────────────────────────────────────────────────────

  const isAuthenticated = computed(() => accessToken.value !== null)

  const isAdmin = computed(() => user.value?.role === 'admin')

  // ── Token helpers ──────────────────────────────────────────────────────────

  /**
   * Stores the access token in memory and saves the refresh token to localStorage.
   */
  function setTokens(access: string, refresh: string): void {
    accessToken.value = access
    if (isStorageAvailable()) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    }
  }

  /**
   * Clears access token and user from memory, removes refresh token from localStorage.
   */
  function clearTokens(): void {
    accessToken.value = null
    user.value = null
    if (isStorageAvailable()) {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  }

  // ── Auth actions ───────────────────────────────────────────────────────────

  /**
   * Logs in with email and password.
   * On success, stores tokens and user info.
   */
  async function login(email: string, password: string): Promise<void> {
    const response = await apiLogin(email, password)
    setTokens(response.accessToken, response.refreshToken)
    user.value = response.user
  }

  /**
   * Registers a new user account.
   */
  async function register(username: string, email: string, password: string): Promise<void> {
    await apiRegister(username, email, password)
  }

  /**
   * Logs out the current user.
   * Fire-and-forget call to the server; always clears local tokens regardless of server response.
   */
  async function logout(): Promise<void> {
    // Fire-and-forget — do not await, do not throw
    apiLogout().catch(() => {
      // Intentionally ignored — client-side logout always succeeds
    })
    clearTokens()
  }

  /**
   * Attempts to refresh the access token using the stored refresh token.
   * Returns true on success, false on failure (also clears tokens on failure).
   */
  async function tryRefreshToken(): Promise<boolean> {
    if (!isStorageAvailable()) return false

    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!storedRefresh) return false

    try {
      const result = await apiRefreshToken(storedRefresh)
      accessToken.value = result.accessToken
      return true
    } catch {
      clearTokens()
      return false
    }
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    isAdmin,
    setTokens,
    clearTokens,
    login,
    register,
    logout,
    tryRefreshToken,
  }
})
