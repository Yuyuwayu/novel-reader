<script setup lang="ts">
// SynopsisCollapsible — truncated synopsis with show more/less toggle.
// Requirements: 17.9

import { ref } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = withDefaults(
  defineProps<{ text: string; maxLines?: number }>(),
  { maxLines: 3 },
)

const themeStore = useThemeStore()
const expanded = ref(false)
</script>

<template>
  <div>
    <p
      class="whitespace-pre-line text-sm leading-relaxed"
      :class="[
        !expanded ? `line-clamp-${props.maxLines}` : '',
        themeStore.isDark ? 'text-[#8A8F98]' : 'text-[#6B7080]',
      ]"
    >
      {{ text }}
    </p>
    <button
      type="button"
      class="mt-1.5 font-mono text-xs font-medium transition-colors duration-150 focus:outline-none focus:underline"
      :class="themeStore.isDark ? 'text-[#5E6AD2] hover:text-[#6872D9]' : 'text-[#5E6AD2] hover:text-[#6872D9]'"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Tampilkan lebih sedikit' : 'Tampilkan lebih banyak' }}
    </button>
  </div>
</template>
