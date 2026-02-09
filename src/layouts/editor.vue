<script setup lang="ts">
import { getContentTypeSlug } from '#shared/utils/content'
import EditorToolbar from '@/components/layout/EditorToolbar.vue'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import { useAuthStore } from '@/stores/auth'

// Provide editor config for the layer — Kreo standalone wiring
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Read schema UUID from route query if provided (e.g. ?schemaUuid=xxx)
const schemaUuid = computed(() => (route.query.schemaUuid as string) || undefined)

const editorConfig: EditorConfig = {
  apiBaseUrl: '/api/v1',
  getAuthToken: () => authStore.accessToken,
  // theme: { primaryColor: '#3b82f6' }, // Uncomment to test theme override
  refreshToken: async () => {
    const success = await authStore.refresh()
    return success ? authStore.accessToken : null
  },
  onContentCreated: (id: number) => {
    const type = useContentStore().type || 'landing-page'
    router.replace(`/${getContentTypeSlug(type)}/${id}`)
  },
  onNavigateToHistory: (contentId: number) => {
    const type = useContentStore().type || 'landing-page'
    navigateTo(`/${getContentTypeSlug(type)}/${contentId}/history`)
  },
  onNavigateToEditor: (contentId: number) => {
    const type = useContentStore().type || 'landing-page'
    navigateTo(`/${getContentTypeSlug(type)}/${contentId}`)
  },
  onAuthFailure: () => {
    authStore.clearAuth()
    router.push('/login')
  },
  features: {
    ai: true,
    history: true,
    templates: true,
    variables: true,
  },
  variables: schemaUuid.value ? { schemaUuid: schemaUuid.value } : undefined,
}
provideEditorConfig(editorConfig)

// Initialize editor theme (applies CSS variables based on config.theme)
useEditorTheme(editorConfig)

// Initialize variable schema if configured
const { initialize: initVariables } = useVariableSchema()
if (schemaUuid.value) {
  initVariables({ schemaUuid: schemaUuid.value })
}

const uiStore = useUIStore()
const selectionStore = useSelectionStore()
const contentStore = useContentStore()
const { navigateToHistory, navigateToEditor, isActive: isHistoryActive } = useVersionHistory()

function handleKeydown(event: KeyboardEvent): void {
  // Ctrl+H / Cmd+H to toggle version history
  if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
    event.preventDefault()
    if (contentStore.id) {
      if (isHistoryActive.value) {
        navigateToEditor()
      }
      else {
        navigateToHistory()
      }
    }
  }

  // Escape to exit history mode
  if (event.key === 'Escape' && isHistoryActive.value) {
    navigateToEditor()
  }

  // Escape to exit preview mode
  if (event.key === 'Escape' && uiStore.isPreviewMode) {
    uiStore.setMode('designer')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleShellClick(event: MouseEvent) {
  // Only in designer mode
  if (uiStore.mode !== 'designer')
    return

  // Only if there's a selection
  if (!selectionStore.hasSelection)
    return

  const target = event.target as HTMLElement

  // Don't deselect if clicking inside the canvas
  if (target.closest('.designer-mode'))
    return

  // Don't deselect if clicking inside right sidebar (widget options)
  if (target.closest('.right-sidebar'))
    return

  // Don't deselect if clicking on modals or dropdowns
  if (target.closest('[role="dialog"], [role="listbox"], [role="menu"]'))
    return

  selectionStore.deselect()
}
</script>

<template>
  <div class="app-shell" @click="handleShellClick">
    <div class="shell-left">
      <transition name="slide-left">
        <LeftSidebar v-if="uiStore.leftSidebarOpen && !uiStore.isHistoryMode" />
      </transition>
    </div>

    <div class="shell-main">
      <transition name="fade">
        <EditorToolbar v-if="!uiStore.isPreviewMode" />
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

    <!-- Page-specific content (loading overlays, modals) -->
    <slot />

    <!-- Global toast notifications -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: var(--color-background-subtle);
  overflow: hidden;
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

/* Transitions */
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

/* Focus mode (preview) */
.canvas-wrapper.focus-mode {
  padding: 0;
}
</style>
