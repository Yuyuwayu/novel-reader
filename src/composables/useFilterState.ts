import { ref, computed, watch, onMounted } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FilterState } from '@/types'
import { DEFAULT_FILTER_STATE } from '@/types'
import { isStorageAvailable } from '@/utils/storage'

const BLACKLIST_STORAGE_KEY = 'novel_reader:filter_blacklist'

function serializeFilter(filter: FilterState): Record<string, string> {
  const params: Record<string, string> = {}
  if (filter.genres.length > 0) params.genres = filter.genres.join(',')
  if (filter.tags.length > 0) params.tags = filter.tags.join(',')
  if (filter.excludeGenres.length > 0) params.excludeGenres = filter.excludeGenres.join(',')
  if (filter.excludeTags.length > 0) params.excludeTags = filter.excludeTags.join(',')
  if (filter.status) params.status = filter.status
  if (filter.minRating > 0) params.minRating = String(filter.minRating)
  if (filter.minChapters > 0) params.minChapters = String(filter.minChapters)
  if (filter.maxChapters > 0) params.maxChapters = String(filter.maxChapters)
  if (filter.sortBy !== 'updatedAt') params.sortBy = filter.sortBy
  if (filter.updatedAfter) params.updatedAfter = filter.updatedAfter
  if (filter.updatedBefore) params.updatedBefore = filter.updatedBefore
  return params
}

function parseFilter(query: Record<string, string | string[]>): FilterState {
  const getString = (key: string): string => {
    const val = query[key]
    return typeof val === 'string' ? val : (val?.[0] ?? '')
  }
  const getArray = (key: string): string[] => {
    const val = getString(key)
    return val ? val.split(',').filter(Boolean) : []
  }

  return {
    genres: getArray('genres'),
    tags: getArray('tags'),
    excludeGenres: getArray('excludeGenres'),
    excludeTags: getArray('excludeTags'),
    status: (getString('status') as FilterState['status']) || '',
    minRating: parseFloat(getString('minRating')) || 0,
    minChapters: parseInt(getString('minChapters'), 10) || 0,
    maxChapters: parseInt(getString('maxChapters'), 10) || 0,
    sortBy: (getString('sortBy') as FilterState['sortBy']) || 'updatedAt',
    updatedAfter: getString('updatedAfter'),
    updatedBefore: getString('updatedBefore'),
  }
}

function loadBlacklistFromStorage(): { excludeGenres: string[]; excludeTags: string[] } {
  if (!isStorageAvailable()) return { excludeGenres: [], excludeTags: [] }
  try {
    const raw = localStorage.getItem(BLACKLIST_STORAGE_KEY)
    if (!raw) return { excludeGenres: [], excludeTags: [] }
    return JSON.parse(raw) as { excludeGenres: string[]; excludeTags: string[] }
  } catch {
    return { excludeGenres: [], excludeTags: [] }
  }
}

function saveBlacklistToStorage(excludeGenres: string[], excludeTags: string[]): void {
  if (!isStorageAvailable()) return
  try {
    localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify({ excludeGenres, excludeTags }))
  } catch {
    // fail silently
  }
}

export interface UseFilterStateReturn {
  filterState: Ref<FilterState>
  updateFilter: (partial: Partial<FilterState>) => void
  resetFilter: () => void
  isFilterActive: ComputedRef<boolean>
  validationErrors: ComputedRef<Record<string, string>>
}

export function useFilterState(): UseFilterStateReturn {
  const route = useRoute()
  const router = useRouter()

  const filterState = ref<FilterState>({ ...DEFAULT_FILTER_STATE })

  const validationErrors = computed<Record<string, string>>(() => {
    const errors: Record<string, string> = {}
    const f = filterState.value

    if (f.minChapters > 0 && f.maxChapters > 0 && f.minChapters > f.maxChapters) {
      errors.chapters = 'Jumlah chapter minimum tidak boleh lebih besar dari maksimum'
    }

    if (f.updatedAfter && f.updatedBefore && f.updatedAfter > f.updatedBefore) {
      errors.dateRange = 'Tanggal awal tidak boleh lebih baru dari tanggal akhir'
    }

    // Check for conflicts between include and blacklist
    const genreConflicts = f.genres.filter((g) => f.excludeGenres.includes(g))
    if (genreConflicts.length > 0) {
      errors.genreConflict = `Genre "${genreConflicts[0]}" tidak bisa dipilih dan di-blacklist sekaligus`
    }

    const tagConflicts = f.tags.filter((t) => f.excludeTags.includes(t))
    if (tagConflicts.length > 0) {
      errors.tagConflict = `Tag tidak bisa dipilih dan di-blacklist sekaligus`
    }

    return errors
  })

  const isFilterActive = computed<boolean>(() => {
    const f = filterState.value
    return (
      f.genres.length > 0 ||
      f.tags.length > 0 ||
      f.excludeGenres.length > 0 ||
      f.excludeTags.length > 0 ||
      f.status !== '' ||
      f.minRating > 0 ||
      f.minChapters > 0 ||
      f.maxChapters > 0 ||
      f.sortBy !== 'updatedAt' ||
      f.updatedAfter !== '' ||
      f.updatedBefore !== ''
    )
  })

  function updateFilter(partial: Partial<FilterState>): void {
    filterState.value = { ...filterState.value, ...partial }
    // Persist blacklist changes to localStorage
    if ('excludeGenres' in partial || 'excludeTags' in partial) {
      saveBlacklistToStorage(filterState.value.excludeGenres, filterState.value.excludeTags)
    }
  }

  function resetFilter(): void {
    filterState.value = { ...DEFAULT_FILTER_STATE }
    saveBlacklistToStorage([], [])
  }

  // Sync filter state to URL query params
  watch(
    filterState,
    (newFilter) => {
      const serialized = serializeFilter(newFilter)
      router.replace({ query: serialized })
    },
    { deep: true },
  )

  onMounted(() => {
    // Read initial state from URL query params
    const fromUrl = parseFilter(route.query as Record<string, string>)
    // Merge with blacklist from localStorage (localStorage takes precedence for blacklist)
    const savedBlacklist = loadBlacklistFromStorage()
    filterState.value = {
      ...fromUrl,
      excludeGenres: fromUrl.excludeGenres.length > 0 ? fromUrl.excludeGenres : savedBlacklist.excludeGenres,
      excludeTags: fromUrl.excludeTags.length > 0 ? fromUrl.excludeTags : savedBlacklist.excludeTags,
    }
  })

  return { filterState, updateFilter, resetFilter, isFilterActive, validationErrors }
}
