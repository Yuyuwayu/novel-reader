import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import NovelCard from './NovelCard.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/novel/:id', name: 'novel-detail', component: { template: '<div></div>' } }]
})

describe('NovelCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders novel information correctly', async () => {
    const mockNovel = {
      id: 'novel-1',
      title: 'Solo Leveling',
      author: 'Chugong',
      synopsis: 'Test synopsis',
      thumbnailUrl: 'http://example.com/thumb.jpg',
      genre: ['Action', 'Fantasy'],
      status: 'completed',
      rating: 4.8,
      views: 1000000,
      bookmarkCount: 50000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const wrapper = mount(NovelCard, {
      props: {
        novel: mockNovel as any
      },
      global: {
        plugins: [router]
      }
    })

    // Check title
    expect(wrapper.text()).toContain('Solo Leveling')
    // Check author
    expect(wrapper.text()).toContain('Chugong')
    // Check genres
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Fantasy')
    // Check status
    expect(wrapper.text()).toContain('Selesai')
  })
})
