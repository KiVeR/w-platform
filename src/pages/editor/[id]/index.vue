<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'
import { nextTick } from 'vue'
import KreoLogo from '@/components/icons/KreoLogo.vue'
import EditorLayout from '@/components/layout/EditorLayout.vue'
import RecoveryModal from '@/components/ui/RecoveryModal.vue'
import { usePersistence } from '@/composables/usePersistence'
import { useVersionHistory } from '@/composables/useVersionHistory'

definePageMeta({
  title: 'Editeur Landing Page',
})

const route = useRoute()
const persistence = usePersistence()
const { exitHistoryMode, isActive: isHistoryActive } = useVersionHistory()

const showToast = ref(false)
const toastMessage = ref('')

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      const id = Number.parseInt(newId as string, 10)
      if (!Number.isNaN(id)) {
        await persistence.loadDesign(id)
      }
    }
  },
  { immediate: true },
)

watch(
  () => persistence.loadError.value,
  (error) => {
    if (error) {
      toastMessage.value = error
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 5000)
    }
  },
)

function dismissToast() {
  showToast.value = false
}

onMounted(async () => {
  persistence.setupBeforeUnloadGuard()

  // Si on vient du mode historique, sortir après le premier rendu
  // pour permettre à la transition slide-left-enter de s'exécuter
  if (isHistoryActive.value) {
    await nextTick()
    exitHistoryMode()
  }
})
</script>

<template>
  <div class="editor-view">
    <div v-if="persistence.isLoading.value" class="loading-overlay">
      <KreoLogo :size="56" class="loading-logo" />
      <p class="loading-text">
        Chargement du design...
      </p>
    </div>

    <EditorLayout v-if="!persistence.isLoading.value" />

    <Transition name="toast">
      <div v-if="showToast" class="toast">
        <AlertTriangle :size="16" class="toast-icon" />
        <span class="toast-message">{{ toastMessage }}</span>
        <button class="toast-close" @click="dismissToast">
          <X :size="14" />
        </button>
      </div>
    </Transition>

    <RecoveryModal
      v-if="persistence.showRecoveryModal.value"
      :recovery-data="persistence.recoveryData.value"
      @restore="persistence.restoreBackup"
      @discard="persistence.discardBackup"
    />
  </div>
</template>

<style src="@/styles/editor-page.css"></style>
