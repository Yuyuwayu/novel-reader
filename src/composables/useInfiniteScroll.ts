import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface UseInfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
}

export function useInfiniteScroll(
  targetRef: Ref<Element | null>,
  callback: () => void | Promise<void>,
  options?: UseInfiniteScrollOptions,
): { isObserving: Ref<boolean>; stop: () => void; start: () => void } {
  const isObserving = ref(false)
  let observer: IntersectionObserver | null = null

  function stop(): void {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    isObserving.value = false
  }

  function start(): void {
    stop() // disconnect any existing observer first
    if (!targetRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          callback()
        }
      },
      {
        threshold: options?.threshold ?? 0,
        rootMargin: options?.rootMargin ?? '200px',
      },
    )

    observer.observe(targetRef.value)
    isObserving.value = true
  }

  onUnmounted(() => {
    stop()
  })

  return { isObserving, stop, start }
}
