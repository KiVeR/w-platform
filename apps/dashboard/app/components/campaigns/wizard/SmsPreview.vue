<script setup lang="ts">
import { computed } from 'vue'

interface MessageSegment {
  text: string
  isVariable: boolean
}

const props = defineProps<{
  sender: string
  message: string
}>()

const { t } = useI18n()

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
  <div data-sms-preview class="mx-auto w-[280px]">
    <!-- Phone frame -->
    <div class="rounded-[2.5rem] border-[3px] border-zinc-800 bg-white p-1.5 shadow-xl dark:border-zinc-600 dark:bg-zinc-950">
      <!-- Notch -->
      <div class="mx-auto mb-2 h-5 w-24 rounded-full bg-zinc-800 dark:bg-zinc-600" />

      <!-- Screen -->
      <div class="min-h-[360px] rounded-[2rem] bg-zinc-50 dark:bg-zinc-900">
        <!-- Header -->
        <div class="rounded-t-[2rem] bg-zinc-100 px-4 py-3 text-center dark:bg-zinc-800">
          <p class="text-xs font-bold tracking-wide text-zinc-700 dark:text-zinc-300">
            {{ sender || 'SMS' }}
          </p>
        </div>

        <!-- Messages area -->
        <div class="p-4">
          <div v-if="message" class="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5">
            <p class="text-sm leading-relaxed break-words">
              <template v-for="(seg, i) in segments" :key="i">
                <span
                  v-if="seg.isVariable"
                  data-variable
                  class="inline-block rounded bg-primary/15 px-1.5 py-0.5 font-mono text-xs text-primary"
                >{{ seg.text }}</span>
                <span v-else>{{ seg.text }}</span>
              </template>
            </p>
          </div>
          <p v-else class="text-center text-sm italic text-muted-foreground">
            {{ t('wizard.message.previewEmpty') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
