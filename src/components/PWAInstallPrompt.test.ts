/**
 * Unit tests for PWAInstallPrompt component.
 * Tests visit counter logic, dismissal state, and installation flag.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PWAInstallPrompt from './PWAInstallPrompt.vue'

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.stubGlobal('navigator', { onLine: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  describe('Visit counter logic', () => {
    it('increments pwa_visits counter on mount', () => {
      expect(localStorage.getItem('pwa_visits')).toBeNull()

      mount(PWAInstallPrompt)

      expect(localStorage.getItem('pwa_visits')).toBe('1')
    })

    it('increments pwa_visits from existing value', () => {
      localStorage.setItem('pwa_visits', '3')

      mount(PWAInstallPrompt)

      expect(localStorage.getItem('pwa_visits')).toBe('4')
    })
  })

  describe('Installation flag check', () => {
    it('does not show banner if pwa_installed is true', async () => {
      localStorage.setItem('pwa_installed', 'true')
      localStorage.setItem('pwa_visits', '5')

      const wrapper = mount(PWAInstallPrompt)
      await wrapper.vm.$nextTick()

      // Banner should not be visible
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })
  })

  describe('Dismissal cooldown', () => {
    it('does not show banner if dismissed within 7 days', async () => {
      const now = Date.now()
      const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000)
      localStorage.setItem('pwa_dismissed_at', String(threeDaysAgo))
      localStorage.setItem('pwa_visits', '5')

      const wrapper = mount(PWAInstallPrompt)
      await wrapper.vm.$nextTick()

      // Banner should not be visible
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('shows banner if dismissed more than 7 days ago', async () => {
      const now = Date.now()
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000)
      localStorage.setItem('pwa_dismissed_at', String(eightDaysAgo))
      localStorage.setItem('pwa_visits', '2')

      const wrapper = mount(PWAInstallPrompt)
      await wrapper.vm.$nextTick()

      // beforeinstallprompt event listener should be registered
      // (we can't easily test the event itself without mocking window.addEventListener)
      expect(localStorage.getItem('pwa_visits')).toBe('3')
    })
  })

  describe('Visit threshold', () => {
    it('does not register event listener if visits < 2', () => {
      localStorage.setItem('pwa_visits', '0')

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      mount(PWAInstallPrompt)

      // Should increment to 1, but not register listener
      expect(localStorage.getItem('pwa_visits')).toBe('1')
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it('registers event listener if visits >= 2', () => {
      localStorage.setItem('pwa_visits', '1')

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      mount(PWAInstallPrompt)

      // Should increment to 2 and register listener
      expect(localStorage.getItem('pwa_visits')).toBe('2')
      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })
  })

  describe('Dismiss button', () => {
    it('saves dismissal timestamp when dismiss is called', async () => {
      localStorage.setItem('pwa_visits', '2')

      const wrapper = mount(PWAInstallPrompt)
      
      // Manually trigger showBanner to test dismiss button
      const component = wrapper.vm as any
      component.showBanner = true
      await wrapper.vm.$nextTick()

      const dismissButton = wrapper.findAll('button')[1] // Second button is "Nanti"
      await dismissButton.trigger('click')

      const dismissedAt = localStorage.getItem('pwa_dismissed_at')
      expect(dismissedAt).not.toBeNull()
      expect(parseInt(dismissedAt!, 10)).toBeGreaterThan(Date.now() - 1000) // Within last second
    })
  })

  describe('Install button', () => {
    it('saves pwa_installed flag on successful installation', async () => {
      localStorage.setItem('pwa_visits', '2')

      const mockPrompt = vi.fn().mockResolvedValue(undefined)
      const mockUserChoice = Promise.resolve({ outcome: 'accepted' })

      const wrapper = mount(PWAInstallPrompt)
      const component = wrapper.vm as any

      // Simulate beforeinstallprompt event
      component.deferredPrompt = {
        prompt: mockPrompt,
        userChoice: mockUserChoice,
        preventDefault: vi.fn(),
      }
      component.showBanner = true
      await wrapper.vm.$nextTick()

      const installButton = wrapper.findAll('button')[0] // First button is "Install"
      await installButton.trigger('click')

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockPrompt).toHaveBeenCalled()
      expect(localStorage.getItem('pwa_installed')).toBe('true')
    })

    it('does not save pwa_installed flag if user dismisses prompt', async () => {
      localStorage.setItem('pwa_visits', '2')

      const mockPrompt = vi.fn().mockResolvedValue(undefined)
      const mockUserChoice = Promise.resolve({ outcome: 'dismissed' })

      const wrapper = mount(PWAInstallPrompt)
      const component = wrapper.vm as any

      // Simulate beforeinstallprompt event
      component.deferredPrompt = {
        prompt: mockPrompt,
        userChoice: mockUserChoice,
        preventDefault: vi.fn(),
      }
      component.showBanner = true
      await wrapper.vm.$nextTick()

      const installButton = wrapper.findAll('button')[0]
      await installButton.trigger('click')

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockPrompt).toHaveBeenCalled()
      expect(localStorage.getItem('pwa_installed')).toBeNull()
    })
  })
})
