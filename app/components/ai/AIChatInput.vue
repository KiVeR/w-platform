<script setup lang="ts">
import { Paperclip, Send, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const { store, sendMessage, attachImage, removeImage } = useAIChat()

const prompt = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const canSubmit = computed(() => {
  return store.canSend && prompt.value.trim().length > 0
})

// Create thumbnail URL from pending image
const pendingImageThumbnail = computed(() => {
  if (!store.pendingImage)
    return null
  return `data:${store.pendingImage.mimeType};base64,${store.pendingImage.data}`
})

async function handleSubmit() {
  if (!canSubmit.value)
    return

  const text = prompt.value.trim()
  const image = store.pendingImage || undefined

  prompt.value = ''
  await sendMessage(text, image)
}

function handleKeyDown(e: KeyboardEvent) {
  // Submit on Enter (without Shift)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    attachImage(file)
  }

  // Reset input for re-selection
  input.value = ''
}

function triggerFileSelect() {
  fileInput.value?.click()
}

function handleRemoveImage() {
  removeImage()
}

// Expose methods for parent
function focus() {
  textareaRef.value?.focus()
}

function setPrompt(text: string) {
  prompt.value = text
  focus()
}

defineExpose({ focus, setPrompt })
</script>

<template>
  <div class="ai-input">
    <!-- Pending image preview -->
    <div
      v-if="pendingImageThumbnail"
      class="ai-input-image-preview"
    >
      <img
        :src="pendingImageThumbnail"
        alt="Image jointe"
      >
      <button
        class="ai-input-image-remove"
        aria-label="Supprimer l'image"
        @click="handleRemoveImage"
      >
        <X :size="14" />
      </button>
    </div>

    <!-- Input area -->
    <div class="ai-input-row">
      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        class="ai-input-file"
        @change="handleFileSelect"
      >

      <!-- Attach button -->
      <button
        class="ai-input-attach"
        :disabled="store.isStreaming"
        title="Joindre une image"
        @click="triggerFileSelect"
      >
        <Paperclip :size="20" />
      </button>

      <!-- Textarea -->
      <textarea
        ref="textareaRef"
        v-model="prompt"
        class="ai-input-textarea"
        placeholder="Décrivez ce que vous voulez créer..."
        rows="1"
        :disabled="store.isStreaming"
        @keydown="handleKeyDown"
      />

      <!-- Send button -->
      <button
        class="ai-input-send"
        :disabled="!canSubmit"
        title="Envoyer"
        @click="handleSubmit"
      >
        <Send :size="20" />
      </button>
    </div>

    <!-- Help text -->
    <p class="ai-input-help">
      Entrée pour envoyer, Shift+Entrée pour nouvelle ligne
    </p>
  </div>
</template>

<style scoped>
.ai-input {
  padding: 16px;
  border-top: 1px solid var(--color-neutral-200);
  background: var(--color-background-subtle);
}

/* Image preview */
.ai-input-image-preview {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}

.ai-input-image-preview img {
  max-width: 120px;
  max-height: 80px;
  border-radius: 8px;
  border: 1px solid var(--color-neutral-200);
}

.ai-input-image-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-error-500);
  color: var(--color-surface);
  border: 2px solid var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.ai-input-image-remove:hover {
  background: var(--color-error-600);
}

/* Input row */
.ai-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-neutral-200);
  border-radius: 12px;
  padding: 8px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.ai-input-row:focus-within {
  border-color: var(--color-info-500);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-info-500) 10%, transparent);
}

.ai-input-file {
  display: none;
}

.ai-input-attach,
.ai-input-send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.ai-input-attach {
  background: transparent;
  color: var(--color-text-secondary);
}

.ai-input-attach:hover:not(:disabled) {
  background: var(--color-neutral-100);
  color: var(--color-neutral-600);
}

.ai-input-attach:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-input-send {
  background: var(--color-info-500);
  color: var(--color-surface);
}

.ai-input-send:hover:not(:disabled) {
  background: var(--color-info-600);
}

.ai-input-send:disabled {
  background: var(--color-neutral-200);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.ai-input-textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  padding: 8px 0;
  min-height: 36px;
  max-height: 120px;
  color: var(--color-text-primary);
}

.ai-input-textarea::placeholder {
  color: var(--color-text-muted);
}

.ai-input-textarea:disabled {
  background: transparent;
  color: var(--color-text-muted);
}

/* Help text */
.ai-input-help {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 8px 0 0;
  text-align: center;
}
</style>
