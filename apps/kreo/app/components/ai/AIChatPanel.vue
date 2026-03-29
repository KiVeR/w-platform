<script setup lang="ts">
import { Loader2, X } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'

const { store, fetchQuota, cancel } = useAIChat()

const messagesContainer = ref<HTMLElement | null>(null)
const inputRef = ref<InstanceType<typeof AIChatInput> | null>(null)

// Example prompts for empty state
const examplePrompts = [
  'Cree une landing page pour un restaurant avec menu et reservation',
  'Genere un formulaire de contact avec nom, email et message',
  'Cree une page promotionnelle avec carrousel d\'images et bouton CTA',
]

// Fetch quota on mount
onMounted(() => {
  fetchQuota()
})

// Focus input when panel opens
watch(() => store.isOpen, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      inputRef.value?.focus()
    }, 300) // After transition
  }
})

// Auto-scroll to bottom when messages change or progress updates
watch([() => store.messages.length, () => store.progress], () => {
  scrollToBottom()
})

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function handleClose() {
  store.close()
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClose()
  }
}

function handleExampleClick(prompt: string) {
  inputRef.value?.setPrompt(prompt)
}

function handleCancel() {
  cancel()
}

function handleRetry() {
  store.clearError()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-over">
      <div
        v-if="store.isOpen"
        class="ai-chat-overlay"
        @keydown="handleEscape"
      >
        <!-- Backdrop -->
        <div
          class="ai-chat-backdrop"
          @click="handleClose"
        />

        <!-- Panel -->
        <aside
          class="ai-chat-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-chat-title"
        >
          <!-- Header -->
          <header class="ai-chat-header">
            <div class="ai-chat-header-content">
              <h2
                id="ai-chat-title"
                class="ai-chat-title"
              >
                AI Assistant
              </h2>
              <p
                v-if="store.quota"
                class="ai-chat-quota"
              >
                {{ store.quota.remaining }}/{{ store.quota.limit }} restants
              </p>
            </div>
            <button
              class="ai-chat-close"
              aria-label="Fermer"
              @click="handleClose"
            >
              <X :size="20" />
            </button>
          </header>

          <!-- Messages -->
          <div
            ref="messagesContainer"
            class="ai-chat-messages"
          >
            <!-- Empty state -->
            <div
              v-if="!store.hasMessages && !store.isGenerating"
              class="ai-chat-empty"
            >
              <div class="ai-chat-empty-icon">
                <span aria-hidden="true">&#10024;</span>
              </div>
              <h3 class="ai-chat-empty-title">
                Comment puis-je vous aider ?
              </h3>
              <p class="ai-chat-empty-text">
                Decrivez le design que vous souhaitez creer. Vous pouvez aussi joindre une image ou un screenshot.
              </p>
              <div class="ai-chat-examples">
                <p class="ai-chat-examples-label">
                  Exemples :
                </p>
                <button
                  v-for="(prompt, index) in examplePrompts"
                  :key="index"
                  class="ai-chat-example"
                  @click="handleExampleClick(prompt)"
                >
                  {{ prompt }}
                </button>
              </div>
            </div>

            <!-- Messages list -->
            <template v-else>
              <AIChatMessage
                v-for="message in store.messages"
                :key="message.id"
                :message="message"
              />

              <!-- Generation progress indicator -->
              <div
                v-if="store.isGenerating"
                class="ai-chat-progress"
              >
                <div class="ai-chat-progress-content">
                  <Loader2
                    :size="20"
                    class="ai-chat-spinner"
                  />
                  <span v-if="store.progress === 'submitting'" class="ai-chat-progress-text">
                    Envoi...
                  </span>
                  <span v-else-if="store.progress === 'generating'" class="ai-chat-progress-text">
                    Generation en cours...
                    <span v-if="store.elapsedSeconds > 0" class="ai-chat-elapsed">
                      {{ store.elapsedSeconds }}s
                    </span>
                  </span>
                </div>
                <button
                  class="ai-chat-cancel"
                  @click="handleCancel"
                >
                  Annuler
                </button>
              </div>
            </template>
          </div>

          <!-- Error message -->
          <div
            v-if="store.error"
            class="ai-chat-error"
          >
            <span>{{ store.error }}</span>
            <div class="ai-chat-error-actions">
              <button
                class="ai-chat-retry"
                @click="handleRetry"
              >
                Reessayer
              </button>
              <button @click="store.clearError()">
                &times;
              </button>
            </div>
          </div>

          <!-- Input -->
          <AIChatInput ref="inputRef" />
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ai-chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.ai-chat-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

.ai-chat-panel {
  position: relative;
  width: 480px;
  max-width: 100%;
  height: 100%;
  background: var(--color-surface);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

/* Header */
.ai-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-neutral-200);
  background: var(--color-background-subtle);
}

.ai-chat-header-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-chat-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.ai-chat-quota {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.ai-chat-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.ai-chat-close:hover {
  background: var(--color-neutral-200);
  color: var(--color-text-primary);
}

/* Messages area */
.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Empty state */
.ai-chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  height: 100%;
}

.ai-chat-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.ai-chat-empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.ai-chat-empty-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 24px;
  max-width: 320px;
}

.ai-chat-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 400px;
}

.ai-chat-examples-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin: 0;
  text-align: left;
}

.ai-chat-example {
  padding: 12px 16px;
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-neutral-600);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.ai-chat-example:hover {
  background: var(--color-neutral-200);
  border-color: var(--color-neutral-300);
}

/* Generation progress indicator */
.ai-chat-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: 8px;
}

.ai-chat-progress-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-chat-spinner {
  animation: spin 1s linear infinite;
  color: var(--color-primary-500);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-chat-progress-text {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.ai-chat-elapsed {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.ai-chat-cancel {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid var(--color-neutral-300);
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.ai-chat-cancel:hover {
  background: var(--color-neutral-200);
  color: var(--color-text-primary);
}

/* Error message */
.ai-chat-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 0 16px;
  background: var(--color-error-50);
  border: 1px solid var(--color-error-200);
  border-radius: 8px;
  color: var(--color-error-600);
  font-size: 13px;
}

.ai-chat-error-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-chat-retry {
  padding: 2px 8px;
  background: transparent;
  border: 1px solid var(--color-error-300);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-error-600);
  cursor: pointer;
  transition: all 0.15s;
}

.ai-chat-retry:hover {
  background: var(--color-error-100);
}

.ai-chat-error button:last-child {
  background: none;
  border: none;
  color: var(--color-error-600);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
}

/* Slide-over transition */
.slide-over-enter-active,
.slide-over-leave-active {
  transition: opacity 0.3s ease;
}

.slide-over-enter-active .ai-chat-panel,
.slide-over-leave-active .ai-chat-panel {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-over-enter-from,
.slide-over-leave-to {
  opacity: 0;
}

.slide-over-enter-from .ai-chat-panel,
.slide-over-leave-to .ai-chat-panel {
  transform: translateX(100%);
}
</style>
