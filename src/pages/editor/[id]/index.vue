<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'
import KreoLogo from '@/components/icons/KreoLogo.vue'
import RecoveryModal from '@/components/ui/RecoveryModal.vue'
import { usePersistence } from '@/composables/usePersistence'

definePageMeta({
  title: 'Editeur Landing Page',
  layout: 'editor',
})

const route = useRoute()
const persistence = usePersistence()

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

onMounted(() => {
  persistence.setupBeforeUnloadGuard()
})
</script>

<template>
  <!-- Loading overlay -->
  <div v-if="persistence.isLoading.value" class="loading-overlay">
    <KreoLogo :size="56" class="loading-logo" />
    <p class="loading-text">
      Chargement du design...
    </p>
  </div>

  <!-- Toast notification -->
  <Transition name="toast">
    <div v-if="showToast" class="toast">
      <AlertTriangle :size="16" class="toast-icon" />
      <span class="toast-message">{{ toastMessage }}</span>
      <button class="toast-close" @click="dismissToast">
        <X :size="14" />
      </button>
    </div>
  </Transition>

  <!-- Recovery modal -->
  <RecoveryModal
    v-if="persistence.showRecoveryModal.value"
    :recovery-data="persistence.recoveryData.value"
    @restore="persistence.restoreBackup"
    @discard="persistence.discardBackup"
  />
</template>

<style src="@/styles/editor-page.css"></style>
