<script setup lang="ts">
import type { AIChatMessage } from '#shared/types/ai'
import { computed } from 'vue'

const props = defineProps<{
  message: AIChatMessage
}>()

const isUser = computed(() => props.message.role === 'user')
const hasDesign = computed(() => !!props.message.design)

// Create thumbnail URL from base64 image
const imageThumbnail = computed(() => {
  if (!props.message.image)
    return null
  return `data:${props.message.image.mimeType};base64,${props.message.image.data}`
})

// Format timestamp
const formattedTime = computed(() => {
  const date = new Date(props.message.createdAt)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <div
    class="ai-message"
    :class="{ 'ai-message--user': isUser, 'ai-message--assistant': !isUser }"
  >
    <!-- Avatar -->
    <div class="ai-message-avatar">
      <span v-if="isUser">👤</span>
      <span v-else>✨</span>
    </div>

    <!-- Content -->
    <div class="ai-message-content">
      <!-- Header -->
      <div class="ai-message-header">
        <span class="ai-message-role">{{ isUser ? 'Vous' : 'Assistant' }}</span>
        <span class="ai-message-time">{{ formattedTime }}</span>
      </div>

      <!-- Text content -->
      <div class="ai-message-text">
        <template v-if="message.content">
          {{ message.content }}
        </template>
      </div>

      <!-- User attached image -->
      <div
        v-if="imageThumbnail"
        class="ai-message-image"
      >
        <img
          :src="imageThumbnail"
          alt="Image jointe"
        >
      </div>

      <!-- Generated design preview -->
      <AIDesignPreview
        v-if="hasDesign && message.design"
        :design="message.design"
        class="ai-message-design"
      />
    </div>
  </div>
</template>

<style scoped>
.ai-message {
  display: flex;
  gap: 12px;
  animation: message-fade-in 0.3s ease;
}

@keyframes message-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.ai-message--user .ai-message-avatar {
  background: var(--color-info-100);
}

.ai-message--assistant .ai-message-avatar {
  background: var(--color-warning-100);
}

.ai-message-content {
  flex: 1;
  min-width: 0;
}

.ai-message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.ai-message-role {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.ai-message-time {
  font-size: 11px;
  color: var(--color-text-muted);
}

.ai-message-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-neutral-600);
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-message--user .ai-message-text {
  background: var(--color-neutral-100);
  padding: 12px 16px;
  border-radius: 12px;
  border-top-left-radius: 4px;
}

.ai-message--assistant .ai-message-text {
  padding: 4px 0;
}

/* Attached image */
.ai-message-image {
  margin-top: 8px;
  max-width: 200px;
}

.ai-message-image img {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--color-neutral-200);
}

/* Design preview */
.ai-message-design {
  margin-top: 12px;
}
</style>
