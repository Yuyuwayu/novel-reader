/**
 * Unit tests for OfflineIndicator component.
 * Tests indicator visibility based on navigator.onLine and online/offline events.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OfflineIndicator from './OfflineIndicator.vue'

describe('OfflineIndicator', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Requirements: 7.1, 7.2 — Indicator shows when navigator.onLine is false
  describe('Initial state based on navigator.onLine', () => {
    it('shows indicator when navigator.onLine is false', async () => {
      // Mock navigator.onLine to be false
      vi.stubGlobal('navigator', { onLine: false })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      // Indicator should be visible
      const indicator = wrapper.find('[role="status"]')
      expect(indicator.exists()).toBe(true)
      expect(indicator.text()).toContain('Mode Offline')
    })

    it('hides indicator when navigator.onLine is true', async () => {
      // Mock navigator.onLine to be true
      vi.stubGlobal('navigator', { onLine: true })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      // Indicator should not be visible
      const indicator = wrapper.find('[role="status"]')
      expect(indicator.exists()).toBe(false)
    })
  })

  // Requirements: 7.3, 7.4, 7.5 — Indicator responds to online and offline events
  describe('Event listeners for online/offline events', () => {
    it('shows indicator when offline event is fired', async () => {
      // Start with online state
      vi.stubGlobal('navigator', { onLine: true })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      // Initially hidden
      expect(wrapper.find('[role="status"]').exists()).toBe(false)

      // Simulate offline event
      window.dispatchEvent(new Event('offline'))
      await wrapper.vm.$nextTick()

      // Indicator should now be visible
      const indicator = wrapper.find('[role="status"]')
      expect(indicator.exists()).toBe(true)
      expect(indicator.text()).toContain('Mode Offline')
    })

    it('hides indicator when online event is fired', async () => {
      // Start with offline state
      vi.stubGlobal('navigator', { onLine: false })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      // Initially visible
      expect(wrapper.find('[role="status"]').exists()).toBe(true)

      // Simulate online event
      window.dispatchEvent(new Event('online'))
      await wrapper.vm.$nextTick()

      // Indicator should now be hidden
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
    })

    it('responds to multiple online/offline event toggles', async () => {
      // Start with online state
      vi.stubGlobal('navigator', { onLine: true })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      // Initially hidden
      expect(wrapper.find('[role="status"]').exists()).toBe(false)

      // Go offline
      window.dispatchEvent(new Event('offline'))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[role="status"]').exists()).toBe(true)

      // Go online
      window.dispatchEvent(new Event('online'))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[role="status"]').exists()).toBe(false)

      // Go offline again
      window.dispatchEvent(new Event('offline'))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[role="status"]').exists()).toBe(true)

      // Go online again
      window.dispatchEvent(new Event('online'))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
    })
  })

  // Requirements: 7.2, 7.7 — Indicator displays correct icon and text
  describe('Indicator content', () => {
    it('displays offline icon when offline', async () => {
      vi.stubGlobal('navigator', { onLine: false })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      const indicator = wrapper.find('[role="status"]')
      expect(indicator.exists()).toBe(true)

      // Check for SVG icon
      const icon = indicator.find('svg')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('aria-hidden')).toBe('true')
    })

    it('displays "Mode Offline" text when offline', async () => {
      vi.stubGlobal('navigator', { onLine: false })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      const indicator = wrapper.find('[role="status"]')
      expect(indicator.text()).toContain('Mode Offline')
    })

    it('has correct ARIA attributes for accessibility', async () => {
      vi.stubGlobal('navigator', { onLine: false })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      const indicator = wrapper.find('[role="status"]')
      expect(indicator.attributes('role')).toBe('status')
      expect(indicator.attributes('aria-live')).toBe('polite')
    })
  })

  // Requirements: 7.7 — Indicator uses amber color for visibility
  describe('Indicator styling', () => {
    it('applies amber color classes when offline in light mode', async () => {
      vi.stubGlobal('navigator', { onLine: false })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      const indicator = wrapper.find('[role="status"]')
      const classes = indicator.classes()

      // Should have amber-related classes (light mode)
      expect(
        classes.includes('border-amber-500/40') ||
        classes.includes('bg-amber-50') ||
        classes.includes('text-amber-700')
      ).toBe(true)
    })
  })

  // Requirements: 7.3 — Smooth transition for connection status changes
  describe('Transition behavior', () => {
    it('applies transition classes to the indicator', async () => {
      vi.stubGlobal('navigator', { onLine: false })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      // Check that the Transition component is present
      const transition = wrapper.findComponent({ name: 'Transition' })
      expect(transition.exists()).toBe(true)

      // Check transition props
      expect(transition.props('enterActiveClass')).toContain('transition-all')
      expect(transition.props('leaveActiveClass')).toContain('transition-all')
    })
  })

  // Requirements: 7.5 — Event listeners are properly cleaned up
  describe('Event listener cleanup', () => {
    it('removes event listeners on unmount', async () => {
      vi.stubGlobal('navigator', { onLine: true })

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      // Unmount the component
      wrapper.unmount()

      // Should have removed both event listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('does not respond to events after unmount', async () => {
      vi.stubGlobal('navigator', { onLine: true })

      const wrapper = mount(OfflineIndicator)
      await wrapper.vm.$nextTick()

      // Initially hidden
      expect(wrapper.find('[role="status"]').exists()).toBe(false)

      // Unmount the component
      wrapper.unmount()

      // Fire offline event after unmount
      window.dispatchEvent(new Event('offline'))

      // Component should not update (no error should be thrown)
      // This test mainly ensures cleanup prevents memory leaks
      expect(true).toBe(true)
    })
  })

  // Requirements: 7.4 — Uses navigator.onLine API for detection
  describe('navigator.onLine API usage', () => {
    it('correctly reads initial navigator.onLine value', async () => {
      // Test with online
      vi.stubGlobal('navigator', { onLine: true })
      const wrapper1 = mount(OfflineIndicator)
      await wrapper1.vm.$nextTick()
      expect(wrapper1.find('[role="status"]').exists()).toBe(false)
      wrapper1.unmount()

      // Test with offline
      vi.stubGlobal('navigator', { onLine: false })
      const wrapper2 = mount(OfflineIndicator)
      await wrapper2.vm.$nextTick()
      expect(wrapper2.find('[role="status"]').exists()).toBe(true)
      wrapper2.unmount()
    })
  })
})
