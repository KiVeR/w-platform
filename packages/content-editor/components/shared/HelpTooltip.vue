<script setup lang="ts">
import { HelpCircle } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

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

function handleDocumentPointerDown(event: MouseEvent) {
  const target = event.target
  if (!tooltipRef.value || !(target instanceof Node))
    return

  if (!tooltipRef.value.contains(target))
    close()
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape')
    close()
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
})
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
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color 150ms ease;
}

.help-trigger:hover,
.help-trigger.active {
  color: var(--color-info-500);
}

.help-trigger:focus-visible {
  outline: 2px solid var(--color-info-500);
  outline-offset: 2px;
}

.help-popover {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  min-width: 200px;
  max-width: 280px;
  padding: var(--space-2) var(--space-3);
  margin-top: var(--space-1);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.help-description {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.help-description:last-child {
  margin-bottom: 0;
}

.help-hints {
  margin: 0;
  padding-left: var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.help-hints li {
  margin-bottom: var(--space-1);
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
