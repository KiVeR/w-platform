<script setup lang="ts">
import type { ContentType } from '#shared/types/content'
import { CONTENT_TYPE_EMOJI, CONTENT_TYPE_LABELS, CONTENT_TYPES, isEditorAvailable } from '#shared/types/content'
import { onClickOutside } from '@vueuse/core'
import { ChevronDown, Plus } from 'lucide-vue-next'

const emit = defineEmits<{
  create: [type: ContentType]
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

onClickOutside(containerRef, () => {
  isOpen.value = false
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function handleTypeClick(type: ContentType) {
  isOpen.value = false
  emit('create', type)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isOpen.value = false
  }
}

function open() {
  isOpen.value = true
}

defineExpose({ open })
</script>

<template>
  <div
    ref="containerRef"
    class="split-button"
    @keydown="handleKeydown"
  >
    <!-- Main button with dropdown -->
    <button
      class="split-button-main"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      @click="toggleDropdown"
    >
      <Plus :size="18" aria-hidden="true" />
      <span>Nouveau contenu</span>
      <ChevronDown
        :size="16"
        class="chevron"
        :class="{ rotated: isOpen }"
        aria-hidden="true"
      />
    </button>

    <!-- Dropdown menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="split-button-menu"
        role="menu"
        aria-label="Types de contenu"
      >
        <button
          v-for="type in CONTENT_TYPES"
          :key="type"
          role="menuitem"
          class="menu-item"
          @click="handleTypeClick(type)"
        >
          <span class="menu-item-emoji" aria-hidden="true">{{ CONTENT_TYPE_EMOJI[type] }}</span>
          <span class="menu-item-label">{{ CONTENT_TYPE_LABELS[type] }}</span>
          <span v-if="!isEditorAvailable(type)" class="coming-soon-badge">À venir</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.split-button {
  position: relative;
  display: inline-flex;
}

.split-button-main {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.split-button-main:hover {
  background-color: var(--color-primary-dark);
}

.split-button-main:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  z-index: 1;
}

.chevron {
  transition: transform 0.2s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.split-button-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 220px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1);
  z-index: 50;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--transition-fast);
}

.menu-item:hover {
  background-color: var(--color-background);
}

.menu-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.menu-item-emoji {
  font-size: var(--text-base);
}

.menu-item-label {
  flex: 1;
  font-weight: var(--font-medium);
}

.coming-soon-badge {
  padding: 2px 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-warning-700);
  background-color: var(--color-warning-100);
  border-radius: var(--radius-sm);
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }
}
</style>
