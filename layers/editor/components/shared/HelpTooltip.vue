<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { HelpCircle } from 'lucide-vue-next'
import { ref } from 'vue'

defineProps<{
  /** Main description text */
  description?: string
  /** List of hints/tips */
  hints?: string[]
}>()

const isOpen = ref(false)
const tooltipRef = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

// Close on click outside
onClickOutside(tooltipRef, close)

// Close on Escape key
onKeyStroke('Escape', close)
</script>

<template>
  <div ref="tooltipRef" class="help-tooltip-container">
    <button
      type="button"
      class="help-trigger"
      :class="{ active: isOpen }"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggle"
    >
      <HelpCircle :size="14" />
    </button>

    <Transition name="fade">
      <div
        v-if="isOpen"
        class="help-popover"
        role="tooltip"
      >
        <p v-if="description" class="help-description">
          {{ description }}
        </p>
        <ul v-if="hints?.length" class="help-hints">
          <li v-for="hint in hints" :key="hint">
            {{ hint }}
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.help-tooltip-container {
  position: relative;
  display: inline-flex;
}

.help-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: none;
  border: none;
  color: var(--color-text-muted, #94a3b8);
  cursor: pointer;
  border-radius: var(--radius-sm, 4px);
  transition: color 150ms ease;
}

.help-trigger:hover,
.help-trigger.active {
  color: var(--color-info-500, #3b82f6);
}

.help-trigger:focus-visible {
  outline: 2px solid var(--color-info-500, #3b82f6);
  outline-offset: 2px;
}

.help-popover {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  min-width: 200px;
  max-width: 280px;
  padding: var(--space-2, 8px) var(--space-3, 12px);
  margin-top: var(--space-1, 4px);
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 6px);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
}

.help-description {
  margin: 0 0 var(--space-2, 8px) 0;
  font-size: var(--text-xs, 12px);
  color: var(--color-text-secondary, #64748b);
  line-height: 1.5;
}

.help-description:last-child {
  margin-bottom: 0;
}

.help-hints {
  margin: 0;
  padding-left: var(--space-4, 16px);
  font-size: var(--text-xs, 12px);
  color: var(--color-text-muted, #94a3b8);
  line-height: 1.5;
}

.help-hints li {
  margin-bottom: var(--space-1, 4px);
}

.help-hints li:last-child {
  margin-bottom: 0;
}

/* Transitions */
.fade-enter-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.fade-leave-active {
  transition: opacity 100ms ease-in, transform 100ms ease-in;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
