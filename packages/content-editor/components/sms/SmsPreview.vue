<script setup lang="ts">
import { computed } from 'vue'

interface MessageSegment {
  text: string
  isVariable: boolean
}

const props = withDefaults(defineProps<{
  sender: string
  message: string
  placeholder?: string
}>(), {
  placeholder: '',
})

const segments = computed<MessageSegment[]>(() => {
  if (!props.message) return []
  const parts: MessageSegment[] = []
  const regex = /\$\{(\w+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(props.message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: props.message.slice(lastIndex, match.index), isVariable: false })
    }
    parts.push({ text: match[0], isVariable: true })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < props.message.length) {
    parts.push({ text: props.message.slice(lastIndex), isVariable: false })
  }
  return parts
})
</script>

<template>
  <MobileFrame device="mobile">
    <div data-sms-preview class="sms-preview-content">
      <!-- Header -->
      <div class="sms-preview-header">
        <p class="sms-preview-sender">
          {{ sender || 'SMS' }}
        </p>
      </div>

      <!-- Messages area -->
      <div class="sms-preview-messages">
        <div v-if="message" class="sms-bubble">
          <p class="sms-bubble-text">
            <template v-for="(seg, i) in segments" :key="i">
              <span
                v-if="seg.isVariable"
                data-variable
                class="sms-variable"
              >{{ seg.text }}</span>
              <span v-else>{{ seg.text }}</span>
            </template>
          </p>
        </div>
        <p v-else class="sms-preview-empty">
          {{ placeholder }}
        </p>
      </div>
    </div>
  </MobileFrame>
</template>

<style scoped>
.sms-preview-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sms-preview-header {
  padding: 12px 16px;
  text-align: center;
  background: #e5e7eb;
}

.sms-preview-sender {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #374151;
}

.sms-preview-messages {
  padding: 16px;
  flex: 1;
}

.sms-bubble {
  max-width: 85%;
  background: #e5e7eb;
  border-radius: 16px;
  border-top-left-radius: 4px;
  padding: 10px 14px;
}

.sms-bubble-text {
  font-size: 14px;
  line-height: 1.625;
  word-break: break-word;
}

.sms-variable {
  display: inline-block;
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border-radius: 4px;
  padding: 1px 6px;
  font-family: monospace;
  font-size: 12px;
}

.sms-preview-empty {
  text-align: center;
  font-size: 14px;
  font-style: italic;
  color: #9ca3af;
}
</style>
