<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

const props = withDefaults(defineProps<{
  schemaUuid?: string
  homePath?: string | null
  homeAriaLabel?: string
  height?: 'viewport' | 'parent'
}>(), {
  schemaUuid: undefined,
  homePath: null,
  homeAriaLabel: 'Retour',
  height: 'viewport',
})

const editorConfig = useEditorConfig()
const uiStore = useUIStore()
const selectionStore = useSelectionStore()
const contentStore = useContentStore()
const historyEnabled = computed(() =>
  editorConfig.features?.history !== false && !!editorConfig.versionAdapter,
)
const { navigateToHistory, navigateToEditor, isActive: isHistoryActive } = useVersionHistory()

function handleKeydown(event: KeyboardEvent): void {
  if (historyEnabled.value && (event.ctrlKey || event.metaKey) && event.key === 'h') {
    event.preventDefault()
    if (contentStore.id) {
      if (isHistoryActive.value)
        navigateToEditor()
      else
        navigateToHistory()
    }
  }

  if (event.key === 'Escape') {
    if (isHistoryActive.value)
      navigateToEditor()
    else if (uiStore.isPreviewMode)
      uiStore.setMode('designer')
  }
}

function handleShellClick(event: MouseEvent) {
  if (uiStore.mode !== 'designer' || !selectionStore.hasSelection)
    return

  const target = event.target as HTMLElement
  if (target.closest('.designer-mode'))
    return
  if (target.closest('.right-sidebar'))
    return
  if (target.closest('[role="dialog"], [role="listbox"], [role="menu"]'))
    return

  selectionStore.deselect()
}

useEventListener(document, 'keydown', handleKeydown)
</script>

<template>
  <VariableSchemaInitializer :schema-uuid="props.schemaUuid">
    <div
      class="app-shell"
      :class="{ 'app-shell--viewport': props.height === 'viewport', 'app-shell--parent': props.height === 'parent' }"
      @click="handleShellClick"
    >
      <div class="shell-left">
        <transition name="slide-left">
          <LeftSidebar
            v-if="uiStore.leftSidebarOpen && !uiStore.isHistoryMode"
            :home-path="props.homePath"
            :home-aria-label="props.homeAriaLabel"
          />
        </transition>
      </div>

      <div class="shell-main">
        <transition name="fade">
          <EditorToolbar
            v-if="!uiStore.isPreviewMode"
            :home-path="props.homePath"
            :home-aria-label="props.homeAriaLabel"
          />
        </transition>
        <div class="canvas-wrapper" :class="{ 'focus-mode': uiStore.isPreviewMode }">
          <CenterCanvas />
        </div>
      </div>

      <div class="shell-right">
        <transition name="slide-right">
          <RightSidebar v-if="uiStore.rightSidebarOpen" />
        </transition>
      </div>

      <slot />
      <ToastContainer />
    </div>
  </VariableSchemaInitializer>
</template>

<style scoped>
.app-shell {
  display: flex;
  width: 100%;
  background-color: var(--color-background-subtle);
  overflow: hidden;
}

.app-shell--viewport {
  height: 100vh;
}

.app-shell--parent {
  height: 100%;
}

.shell-left,
.shell-right {
  display: flex;
  flex-direction: column;
  z-index: 20;
  flex-shrink: 0;
}

.shell-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

.canvas-wrapper {
  flex: 1;
  padding: 16px;
  background-color: transparent;
  display: flex;
  overflow: hidden;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.canvas-wrapper.focus-mode {
  padding: 0;
}
</style>
