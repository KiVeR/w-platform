<script setup lang="ts">
import { Sun, Monitor, Moon } from 'lucide-vue-next'
import type { ColorMode } from '@/composables/useColorMode'

const { t } = useI18n()
const { mode, setMode } = useColorMode()

const options: { value: ColorMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'header.theme.light' },
  { value: 'system', icon: Monitor, label: 'header.theme.system' },
  { value: 'dark', icon: Moon, label: 'header.theme.dark' },
]

const activeIndex = computed(() => options.findIndex(o => o.value === mode.value))
</script>

<template>
  <div
    class="theme-switcher"
    role="radiogroup"
    :aria-label="t('header.theme.label')"
  >
    <!-- Animated pill -->
    <div
      class="theme-switcher-pill"
      :style="{ transform: `translateX(${activeIndex * 100}%)` }"
    />

    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="mode === option.value"
      :aria-label="t(option.label)"
      :title="t(option.label)"
      class="theme-switcher-btn"
      :class="{ 'is-active': mode === option.value }"
      @click="setMode(option.value)"
    >
      <component :is="option.icon" class="size-3.5" />
    </button>
  </div>
</template>

<style scoped>
.theme-switcher {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 2px;
  border-radius: 8px;
  background: oklch(0.920 0.004 286 / 0.6);
}

:root.dark .theme-switcher {
  background: oklch(0.270 0.006 286 / 0.6);
}

.theme-switcher-pill {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(100% / 3 - 1.33px);
  height: calc(100% - 4px);
  border-radius: 6px;
  background: white;
  box-shadow:
    0 1px 3px oklch(0 0 0 / 0.08),
    0 0 0 1px oklch(0 0 0 / 0.04);
  transition: transform 200ms cubic-bezier(0.65, 0, 0.35, 1);
  pointer-events: none;
}

:root.dark .theme-switcher-pill {
  background: oklch(0.370 0.010 286);
  box-shadow:
    0 1px 3px oklch(0 0 0 / 0.3),
    0 0 0 1px oklch(1 0 0 / 0.04);
}

.theme-switcher-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border-radius: 6px;
  color: oklch(0.550 0.010 286);
  cursor: pointer;
  transition: color 200ms ease;
}

:root.dark .theme-switcher-btn {
  color: oklch(0.550 0.010 286);
}

.theme-switcher-btn.is-active {
  color: oklch(0.250 0.006 286);
}

:root.dark .theme-switcher-btn.is-active {
  color: oklch(0.920 0.004 286);
}

.theme-switcher-btn:hover:not(.is-active) {
  color: oklch(0.400 0.010 286);
}

:root.dark .theme-switcher-btn:hover:not(.is-active) {
  color: oklch(0.700 0.010 286);
}

.theme-switcher-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}
</style>
