import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import AutoScrollWidget from './AutoScrollWidget.vue'
import { usePreferencesStore } from '@/stores/preferences'
import { useThemeStore } from '@/stores/theme'

describe('AutoScrollWidget', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id as unknown as NodeJS.Timeout)
    })
    vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders correctly in paused state by default', () => {
    const wrapper = mount(AutoScrollWidget)
    // Should have a play icon (the SVG with 2 paths for play)
    const svgs = wrapper.findAll('svg')
    expect(svgs.length).toBe(1)
    
    // The speed badge should not be visible when paused
    expect(wrapper.text()).not.toContain('x')
  })

  it('toggles to playing state when clicked', async () => {
    const wrapper = mount(AutoScrollWidget)
    const button = wrapper.find('button')
    
    // Click to play
    await button.trigger('click')
    
    // Speed badge should appear (default speed is 3)
    const prefsStore = usePreferencesStore()
    expect(prefsStore.preferences.autoScrollSpeed).toBe(3)
    expect(wrapper.text()).toContain('3x')

    // Click to pause
    await button.trigger('click')
    expect(wrapper.text()).not.toContain('3x')
  })

  it('stops scrolling on user interaction (wheel)', async () => {
    const wrapper = mount(AutoScrollWidget)
    const button = wrapper.find('button')
    
    // Play
    await button.trigger('click')
    expect(wrapper.text()).toContain('3x')

    // Simulate user wheel
    const event = new WheelEvent('wheel')
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    // Should pause
    expect(wrapper.text()).not.toContain('3x')
  })

  it('respects autoScrollSpeed from store', async () => {
    const prefsStore = usePreferencesStore()
    prefsStore.setAutoScrollSpeed(8)
    
    const wrapper = mount(AutoScrollWidget)
    const button = wrapper.find('button')
    
    // Play
    await button.trigger('click')
    
    // Should show 8x
    expect(wrapper.text()).toContain('8x')
  })
})
