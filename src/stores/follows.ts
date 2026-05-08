import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Follow } from '@/types'

export const useFollowsStore = defineStore('follows', () => {
  const followedNovelIds = ref<Set<string>>(new Set())

  function isFollowing(novelId: string): boolean {
    return followedNovelIds.value.has(novelId)
  }

  async function loadFollows(): Promise<void> {
    try {
      const { fetchFollows } = await import('@/api')
      const follows: Follow[] = await fetchFollows()
      followedNovelIds.value = new Set(follows.map((f) => f.novelId))
    } catch {
      // silently fail
    }
  }

  async function follow(novelId: string): Promise<void> {
    try {
      const { followNovel } = await import('@/api')
      await followNovel(novelId)
      followedNovelIds.value = new Set([...followedNovelIds.value, novelId])
    } catch {
      throw new Error(`Failed to follow novel ${novelId}`)
    }
  }

  async function unfollow(novelId: string): Promise<void> {
    try {
      const { unfollowNovel } = await import('@/api')
      await unfollowNovel(novelId)
      const updated = new Set(followedNovelIds.value)
      updated.delete(novelId)
      followedNovelIds.value = updated
    } catch {
      throw new Error(`Failed to unfollow novel ${novelId}`)
    }
  }

  return { followedNovelIds, isFollowing, loadFollows, follow, unfollow }
})
