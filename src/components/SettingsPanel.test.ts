/**
 * Unit tests for SettingsPanel component - Offline Reading section
 * Tests cache stats display, clear cache functionality, confirmation dialog, and storage quota warning
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, Technical Notes - Storage Quota
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SettingsPanel from './SettingsPanel.vue'
import { cacheManager } from '@/utils/cacheManager'

// Mock the cacheManager
vi.mock('@/utils/cacheManager', () => ({
  cacheManager: {
    init: vi.fn().mockResolvedValue(undefined),
    getCacheStats: vi.fn().mockResolvedValue({ count: 0, totalSize: 0 }),
    clearCache: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock the offlineAnalytics module
vi.mock('@/utils/offlineAnalytics', () => ({
  getOfflineAnalytics: vi.fn().mockReturnValue({
    offlineReadsCount: 0,
    onlineReadsCount: 0,
    lastOfflineReadAt: null,
    offlineNovelIds: [],
  }),
  resetOfflineAnalytics: vi.fn(),
}))

// Mock the formatRelativeTime utility
vi.mock('@/utils/formatRelativeTime', () => ({
  formatRelativeTime: vi.fn((_isoString: string) => '2 jam lalu'),
}))

// Mock navigator.storage.estimate
const mockStorageEstimate = vi.fn()
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: mockStorageEstimate,
  },
  writable: true,
  configurable: true,
})

describe('SettingsPanel - Offline Reading', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Reset storage estimate mock to default
    mockStorageEstimate.mockResolvedValue({ usage: 0, quota: 0 })
    // Ensure navigator is restored to default state
    vi.unstubAllGlobals()
  })

  // Requirements: 12.1, 12.7 — Do not display message when Service Worker is supported
  it('does not display informational message when Service Worker is supported', async () => {
    // Mock navigator WITH serviceWorker support
    const mockNavigatorWithSW = {
      ...navigator,
      serviceWorker: {} as ServiceWorkerContainer
    }
    vi.stubGlobal('navigator', mockNavigatorWithSW)
    
    // Ensure navigator has serviceWorker
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Should NOT display informational message
    expect(wrapper.text()).not.toContain('Browser Anda tidak mendukung offline reading')
    
    // Clean up
    vi.unstubAllGlobals()
  })

  // Requirements: 12.1, 12.7, 12.8 — Display informational message when Service Worker not supported
  it('displays informational message when Service Worker is not supported', async () => {
    // Create a new navigator object without serviceWorker
    const mockNavigator = { ...navigator }
    // @ts-expect-error - Removing serviceWorker for test
    delete mockNavigator.serviceWorker
    
    // Stub the global navigator
    vi.stubGlobal('navigator', mockNavigator)
    
    // Now mount the component with the mocked navigator
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Should display informational message
    expect(wrapper.text()).toContain('Browser Anda tidak mendukung offline reading')
    
    // Restore original navigator
    vi.unstubAllGlobals()
  })

  // Requirements: 8.1 — SettingsPanel displays "Offline Reading" section
  it('displays Offline Reading section when panel is open', async () => {
    const wrapper = mount(SettingsPanel)
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Offline Reading')
  })

  // Requirements: 8.2 — SettingsPanel displays cache count
  it('displays the number of cached chapters', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 5, totalSize: 1024000 })
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Chapter di-cache')
    expect(wrapper.text()).toContain('5')
  })

  // Requirements: 8.3 — SettingsPanel displays total storage size in MB
  it('displays total storage size in MB', async () => {
    // 2.5 MB = 2621440 bytes
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 10, totalSize: 2621440 })
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Total ukuran')
    expect(wrapper.text()).toContain('2.50 MB')
  })

  // Requirements: 8.4 — SettingsPanel provides "Hapus Semua Cache" button
  it('displays "Hapus Semua Cache" button', async () => {
    const wrapper = mount(SettingsPanel)
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    const clearButtons = wrapper.findAll('button')
    const clearButton = clearButtons.find(btn => btn.text().includes('Hapus Semua Cache'))
    expect(clearButton).toBeDefined()
    expect(clearButton?.text()).toContain('Hapus Semua Cache')
  })

  // Requirements: 8.4 — Clear button is disabled when cache is empty
  it('disables "Hapus Semua Cache" button when cache count is 0', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 0, totalSize: 0 })
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    const clearButtons = wrapper.findAll('button')
    const clearButton = clearButtons.find(btn => btn.text().includes('Hapus Semua Cache'))
    
    expect(clearButton?.attributes('disabled')).toBeDefined()
  })

  // Requirements: 8.5 — Clicking "Hapus Semua Cache" shows confirmation dialog
  it('shows confirmation dialog when "Hapus Semua Cache" is clicked', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 5, totalSize: 1024000 })
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Click the clear cache button
    const clearButtons = wrapper.findAll('button')
    const clearButton = clearButtons.find(btn => btn.text().includes('Hapus Semua Cache'))
    await clearButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Confirmation dialog should be visible
    expect(wrapper.text()).toContain('Hapus Semua Cache?')
    expect(wrapper.text()).toContain('Semua chapter yang di-cache akan dihapus')
  })

  // Requirements: 8.6 — Confirming clears cache via CacheManager.clearCache()
  it('calls cacheManager.clearCache() when user confirms', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 5, totalSize: 1024000 })
    
    // Mock window.alert to prevent actual alert dialogs
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Click the clear cache button
    const clearButtons = wrapper.findAll('button')
    const clearButton = clearButtons.find(btn => btn.text().includes('Hapus Semua Cache'))
    await clearButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Find and click the confirm button in the dialog
    const confirmButtons = wrapper.findAll('button')
    const confirmButton = confirmButtons.find(btn => 
      btn.text() === 'Hapus' && btn.classes().includes('bg-red-600')
    )
    await confirmButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // cacheManager.clearCache should have been called
    expect(cacheManager.clearCache).toHaveBeenCalledOnce()
    
    alertSpy.mockRestore()
  })

  // Requirements: 8.7 — Success toast notification is shown after clearing cache
  it('shows success notification after cache is cleared', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 5, totalSize: 1024000 })
    
    // Mock window.alert to capture the message
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Click the clear cache button
    const clearButtons = wrapper.findAll('button')
    const clearButton = clearButtons.find(btn => btn.text().includes('Hapus Semua Cache'))
    await clearButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Find and click the confirm button in the dialog
    const confirmButtons = wrapper.findAll('button')
    const confirmButton = confirmButtons.find(btn => 
      btn.text() === 'Hapus' && btn.classes().includes('bg-red-600')
    )
    await confirmButton?.trigger('click')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Alert should have been called with success message
    expect(alertSpy).toHaveBeenCalledWith('Cache berhasil dihapus')
    
    alertSpy.mockRestore()
  })

  // Requirements: 8.5 — User can cancel the confirmation dialog
  it('does not clear cache when user clicks "Batal"', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 5, totalSize: 1024000 })
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Click the clear cache button
    const clearButtons = wrapper.findAll('button')
    const clearButton = clearButtons.find(btn => btn.text().includes('Hapus Semua Cache'))
    await clearButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Find and click the cancel button in the dialog
    const cancelButtons = wrapper.findAll('button')
    const cancelButton = cancelButtons.find(btn => btn.text() === 'Batal')
    await cancelButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // cacheManager.clearCache should NOT have been called
    expect(cacheManager.clearCache).not.toHaveBeenCalled()
    
    // Dialog should be hidden
    expect(wrapper.text()).not.toContain('Hapus Semua Cache?')
  })

  // Requirements: Technical Notes - Storage Quota — Display storage usage percentage
  it('displays storage usage percentage when quota is available', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 5, totalSize: 1024000 })
    mockStorageEstimate.mockResolvedValue({ usage: 50000000, quota: 100000000 }) // 50% usage
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Penggunaan storage')
    expect(wrapper.text()).toContain('50.0%')
  })

  // Requirements: Technical Notes - Storage Quota — Show warning when usage > 80%
  it('shows storage quota warning when usage exceeds 80%', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 45, totalSize: 50000000 })
    mockStorageEstimate.mockResolvedValue({ usage: 85000000, quota: 100000000 }) // 85% usage
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Storage hampir penuh')
    expect(wrapper.text()).toContain('Penggunaan storage: 85%')
  })

  // Requirements: Technical Notes - Storage Quota — Hide warning when usage <= 80%
  it('does not show storage quota warning when usage is 80% or below', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 30, totalSize: 30000000 })
    mockStorageEstimate.mockResolvedValue({ usage: 80000000, quota: 100000000 }) // 80% usage
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).not.toContain('Storage hampir penuh')
  })

  // Requirements: Technical Notes - Storage Quota — Handle missing storage API gracefully
  it('handles missing storage API gracefully', async () => {
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 5, totalSize: 1024000 })
    
    // Temporarily remove storage API
    const originalStorage = navigator.storage
    // @ts-expect-error - Testing missing API
    delete navigator.storage
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Should not crash, and should not show storage percentage
    expect(wrapper.text()).toContain('Offline Reading')
    expect(wrapper.text()).not.toContain('Penggunaan storage')
    
    // Restore storage API
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      writable: true,
      configurable: true,
    })
  })

  // Requirements: Technical Notes - Storage Quota — Update quota after clearing cache
  it('updates storage quota after clearing cache', async () => {
    vi.mocked(cacheManager.getCacheStats)
      .mockResolvedValueOnce({ count: 45, totalSize: 50000000 })
      .mockResolvedValueOnce({ count: 0, totalSize: 0 })
    
    // Mock storage estimate to return high usage initially
    mockStorageEstimate.mockResolvedValue({ usage: 85000000, quota: 100000000 }) // 85% usage
    
    // Mock window.alert to prevent actual alert dialogs
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Should show warning initially
    expect(wrapper.text()).toContain('Storage hampir penuh')
    expect(wrapper.text()).toContain('85.0%')
    
    // Now change the mock to return lower usage after clear
    mockStorageEstimate.mockResolvedValue({ usage: 35000000, quota: 100000000 }) // 35% after clear
    
    // Click the clear cache button
    const clearButtons = wrapper.findAll('button')
    const clearButton = clearButtons.find(btn => btn.text().includes('Hapus Semua Cache'))
    await clearButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Find and click the confirm button in the dialog
    const confirmButtons = wrapper.findAll('button')
    const confirmButton = confirmButtons.find(btn => 
      btn.text() === 'Hapus' && btn.classes().includes('bg-red-600')
    )
    await confirmButton?.trigger('click')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Warning should be gone after clearing cache
    expect(wrapper.text()).not.toContain('Storage hampir penuh')
    expect(wrapper.text()).toContain('35.0%')
    
    alertSpy.mockRestore()
  })
})

describe('SettingsPanel - Offline Analytics Display', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStorageEstimate.mockResolvedValue({ usage: 0, quota: 0 })
    vi.unstubAllGlobals()
  })

  // Requirements: 11.5 — Display "Total Bacaan Offline: X chapter"
  it('displays total offline reads count', async () => {
    const { getOfflineAnalytics } = await import('@/utils/offlineAnalytics')
    vi.mocked(getOfflineAnalytics).mockReturnValue({
      offlineReadsCount: 15,
      onlineReadsCount: 30,
      lastOfflineReadAt: '2024-01-15T10:30:00Z',
      offlineNovelIds: ['novel-1', 'novel-2'],
    })
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Total Bacaan Offline')
    expect(wrapper.text()).toContain('15 chapter')
  })

  // Requirements: 11.6 — Display "Terakhir Baca Offline: [relative time]"
  it('displays last offline read time using formatRelativeTime', async () => {
    const { getOfflineAnalytics } = await import('@/utils/offlineAnalytics')
    const { formatRelativeTime } = await import('@/utils/formatRelativeTime')
    
    vi.mocked(getOfflineAnalytics).mockReturnValue({
      offlineReadsCount: 10,
      onlineReadsCount: 20,
      lastOfflineReadAt: '2024-01-15T10:30:00Z',
      offlineNovelIds: ['novel-1'],
    })
    
    vi.mocked(formatRelativeTime).mockReturnValue('2 jam lalu')
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Terakhir Baca Offline')
    expect(wrapper.text()).toContain('2 jam lalu')
    expect(formatRelativeTime).toHaveBeenCalledWith('2024-01-15T10:30:00Z')
  })

  // Requirements: 11.5 — Hide offline analytics section when no offline reads
  it('does not display offline analytics section when offlineReadsCount is 0', async () => {
    const { getOfflineAnalytics } = await import('@/utils/offlineAnalytics')
    vi.mocked(getOfflineAnalytics).mockReturnValue({
      offlineReadsCount: 0,
      onlineReadsCount: 10,
      lastOfflineReadAt: null,
      offlineNovelIds: [],
    })
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Should not display offline analytics section
    expect(wrapper.text()).not.toContain('Total Bacaan Offline')
    expect(wrapper.text()).not.toContain('Terakhir Baca Offline')
  })

  // Requirements: 11.6 — Hide last offline read when lastOfflineReadAt is null
  it('does not display last offline read time when lastOfflineReadAt is null', async () => {
    const { getOfflineAnalytics } = await import('@/utils/offlineAnalytics')
    vi.mocked(getOfflineAnalytics).mockReturnValue({
      offlineReadsCount: 5,
      onlineReadsCount: 10,
      lastOfflineReadAt: null,
      offlineNovelIds: ['novel-1'],
    })
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Should display offline reads count but not last read time
    expect(wrapper.text()).toContain('Total Bacaan Offline')
    expect(wrapper.text()).toContain('5 chapter')
    expect(wrapper.text()).not.toContain('Terakhir Baca Offline')
  })

  // Requirements: 11.7 — Reset offline analytics when cache is cleared
  it('resets offline analytics when cache is cleared', async () => {
    const { getOfflineAnalytics, resetOfflineAnalytics } = await import('@/utils/offlineAnalytics')
    
    // Initial state with offline reads
    vi.mocked(getOfflineAnalytics).mockReturnValueOnce({
      offlineReadsCount: 10,
      onlineReadsCount: 20,
      lastOfflineReadAt: '2024-01-15T10:30:00Z',
      offlineNovelIds: ['novel-1', 'novel-2'],
    })
    
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 5, totalSize: 1024000 })
    
    // Mock window.alert to prevent actual alert dialogs
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Should display offline analytics initially
    expect(wrapper.text()).toContain('Total Bacaan Offline')
    expect(wrapper.text()).toContain('10 chapter')
    
    // Click the clear cache button
    const clearButtons = wrapper.findAll('button')
    const clearButton = clearButtons.find(btn => btn.text().includes('Hapus Semua Cache'))
    await clearButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Mock getOfflineAnalytics to return reset state after clear
    vi.mocked(getOfflineAnalytics).mockReturnValue({
      offlineReadsCount: 0,
      onlineReadsCount: 0,
      lastOfflineReadAt: null,
      offlineNovelIds: [],
    })
    
    // Find and click the confirm button in the dialog
    const confirmButtons = wrapper.findAll('button')
    const confirmButton = confirmButtons.find(btn => 
      btn.text() === 'Hapus' && btn.classes().includes('bg-red-600')
    )
    await confirmButton?.trigger('click')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // resetOfflineAnalytics should have been called
    expect(resetOfflineAnalytics).toHaveBeenCalledOnce()
    
    // Offline analytics section should be hidden after reset
    expect(wrapper.text()).not.toContain('Total Bacaan Offline')
    
    alertSpy.mockRestore()
  })

  // Requirements: 11.5, 11.6 — Display correct format for statistics
  it('displays statistics in correct format', async () => {
    const { getOfflineAnalytics } = await import('@/utils/offlineAnalytics')
    const { formatRelativeTime } = await import('@/utils/formatRelativeTime')
    
    vi.mocked(getOfflineAnalytics).mockReturnValue({
      offlineReadsCount: 42,
      onlineReadsCount: 100,
      lastOfflineReadAt: '2024-01-15T08:00:00Z',
      offlineNovelIds: ['novel-1', 'novel-2', 'novel-3'],
    })
    
    vi.mocked(formatRelativeTime).mockReturnValue('5 hari lalu')
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Check exact format
    expect(wrapper.text()).toContain('Total Bacaan Offline')
    expect(wrapper.text()).toContain('42 chapter')
    expect(wrapper.text()).toContain('Terakhir Baca Offline')
    expect(wrapper.text()).toContain('5 hari lalu')
  })

  // Requirements: 11.5, 11.6 — Reload analytics after cache clear
  it('reloads offline analytics after cache is cleared', async () => {
    const { getOfflineAnalytics, resetOfflineAnalytics } = await import('@/utils/offlineAnalytics')
    
    let callCount = 0
    vi.mocked(getOfflineAnalytics).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Initial load
        return {
          offlineReadsCount: 10,
          onlineReadsCount: 20,
          lastOfflineReadAt: '2024-01-15T10:30:00Z',
          offlineNovelIds: ['novel-1'],
        }
      } else {
        // After reset
        return {
          offlineReadsCount: 0,
          onlineReadsCount: 0,
          lastOfflineReadAt: null,
          offlineNovelIds: [],
        }
      }
    })
    
    vi.mocked(cacheManager.getCacheStats).mockResolvedValue({ count: 5, totalSize: 1024000 })
    
    // Mock window.alert to prevent actual alert dialogs
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    const wrapper = mount(SettingsPanel)
    
    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // Open the settings panel
    await wrapper.find('button[aria-label="Pengaturan tampilan"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Click the clear cache button
    const clearButtons = wrapper.findAll('button')
    const clearButton = clearButtons.find(btn => btn.text().includes('Hapus Semua Cache'))
    await clearButton?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Find and click the confirm button in the dialog
    const confirmButtons = wrapper.findAll('button')
    const confirmButton = confirmButtons.find(btn => 
      btn.text() === 'Hapus' && btn.classes().includes('bg-red-600')
    )
    await confirmButton?.trigger('click')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    // getOfflineAnalytics should have been called twice (initial load + after clear)
    expect(getOfflineAnalytics).toHaveBeenCalledTimes(2)
    expect(resetOfflineAnalytics).toHaveBeenCalledOnce()
    
    alertSpy.mockRestore()
  })
})

