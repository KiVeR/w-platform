<script setup lang="ts">
import { AlertTriangle, Loader2, X } from 'lucide-vue-next'
import EditorLayout from '@/components/layout/EditorLayout.vue'
import RecoveryModal from '@/components/ui/RecoveryModal.vue'
import { usePersistence } from '@/composables/usePersistence'

definePageMeta({
  title: 'Editeur Landing Page',
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
  <div class="editor-view">
    <div v-if="persistence.isLoading.value" class="loading-overlay">
      <Loader2 :size="48" class="animate-spin text-primary" />
      <p class="mt-4 text-slate-600">
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

<style scoped>
.editor-view {
  width: 100%;
  height: 100vh;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 100;
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background-color: #1e293b;
  color: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toast-icon {
  color: #fbbf24;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.toast-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
