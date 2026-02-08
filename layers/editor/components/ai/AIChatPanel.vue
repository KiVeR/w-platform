<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'

const { store, fetchQuota } = useAIChat()

const messagesContainer = ref<HTMLElement | null>(null)
const inputRef = ref<InstanceType<typeof AIChatInput> | null>(null)

// Example prompts for empty state
const examplePrompts = [
  'Crée une landing page pour un restaurant avec menu et réservation',
  'Génère un formulaire de contact avec nom, email et message',
  'Crée une page promotionnelle avec carrousel d\'images et bouton CTA',
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

// Auto-scroll to bottom when messages change
watch([() => store.messages.length, () => store.currentStreamText], () => {
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
              v-if="!store.hasMessages && !store.isStreaming"
              class="ai-chat-empty"
            >
              <div class="ai-chat-empty-icon">
                ✨
              </div>
              <h3 class="ai-chat-empty-title">
                Comment puis-je vous aider ?
              </h3>
              <p class="ai-chat-empty-text">
                Décrivez le design que vous souhaitez créer. Vous pouvez aussi joindre une image ou un screenshot.
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

              <!-- Streaming message -->
              <AIChatMessage
                v-if="store.isStreaming"
                :message="{
                  id: 'streaming',
                  role: 'assistant',
                  content: store.displayStreamText,
                  createdAt: new Date(),
                }"
                :is-streaming="true"
                :is-generating-design="store.isGeneratingDesign"
              />
            </template>
          </div>

          <!-- Error message -->
          <div
            v-if="store.error"
            class="ai-chat-error"
          >
            <span>{{ store.error }}</span>
            <button @click="store.clearError()">
              ×
            </button>
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
  background: #ffffff;
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
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ai-chat-header-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-chat-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.ai-chat-quota {
  font-size: 12px;
  color: #6b7280;
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
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.ai-chat-close:hover {
  background: #e5e7eb;
  color: #111827;
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
  color: #111827;
  margin: 0 0 8px;
}

.ai-chat-empty-text {
  font-size: 14px;
  color: #6b7280;
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
  color: #9ca3af;
  margin: 0;
  text-align: left;
}

.ai-chat-example {
  padding: 12px 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.ai-chat-example:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

/* Error message */
.ai-chat-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 0 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
}

.ai-chat-error button {
  background: none;
  border: none;
  color: #dc2626;
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
