<script setup lang="ts">
import type { DesignDocument } from '@/types/widget'
import { Check, Expand, Pencil } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import MobileFrame from '@/components/canvas/MobileFrame.vue'
import { useAIChat } from '@/composables/useAIChat'

const props = defineProps<{
  design: unknown // DesignDocument
}>()

const { applyDesign, store } = useAIChat()

const isExpanded = ref(false)

const designDoc = computed(() => props.design as DesignDocument)
const widgetCount = computed(() => {
  function count(widgets: unknown[]): number {
    let total = 0
    for (const widget of widgets) {
      total++
      const w = widget as { children?: unknown[] }
      if (w.children) {
        total += count(w.children)
      }
    }
    return total
  }
  return count(designDoc.value?.widgets || [])
})

function handleApply() {
  applyDesign(designDoc.value)
  store.close()
}

function handleExpand() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div
    class="ai-design-preview"
    :class="{ 'ai-design-preview--expanded': isExpanded }"
  >
    <!-- Preview frame -->
    <div class="ai-design-preview-frame">
      <MobileFrame
        :design="designDoc"
        :scale="isExpanded ? 0.7 : 0.5"
        :interactive="false"
      />
    </div>

    <!-- Info and actions -->
    <div class="ai-design-preview-info">
      <p class="ai-design-preview-stats">
        {{ widgetCount }} widget{{ widgetCount > 1 ? 's' : '' }}
      </p>

      <div class="ai-design-preview-actions">
        <button
          class="ai-design-preview-btn ai-design-preview-btn--secondary"
          title="Agrandir"
          @click="handleExpand"
        >
          <Expand :size="16" />
          {{ isExpanded ? 'Réduire' : 'Agrandir' }}
        </button>
        <button
          class="ai-design-preview-btn ai-design-preview-btn--primary"
          title="Appliquer ce design"
          @click="handleApply"
        >
          <Check :size="16" />
          Appliquer
        </button>
      </div>

      <p class="ai-design-preview-hint">
        <Pencil :size="12" />
        Continuez la conversation pour modifier
      </p>
    </div>
  </div>
</template>

<style scoped>
.ai-design-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.ai-design-preview-frame {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, #f3f4f6 25%, transparent 25%),
    linear-gradient(225deg, #f3f4f6 25%, transparent 25%),
    linear-gradient(45deg, #f3f4f6 25%, transparent 25%),
    linear-gradient(315deg, #f3f4f6 25%, #ffffff 25%);
  background-size: 16px 16px;
  background-position: 0 0, 8px 0, 8px -8px, 0px 8px;
  max-height: 300px;
  overflow-y: auto;
  transition: max-height 0.3s ease;
}

.ai-design-preview--expanded .ai-design-preview-frame {
  max-height: 500px;
}

.ai-design-preview-info {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

.ai-design-preview-stats {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 12px;
}

.ai-design-preview-actions {
  display: flex;
  gap: 8px;
}

.ai-design-preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.ai-design-preview-btn--primary {
  background: #3b82f6;
  color: #ffffff;
}

.ai-design-preview-btn--primary:hover {
  background: #2563eb;
}

.ai-design-preview-btn--secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.ai-design-preview-btn--secondary:hover {
  background: #e5e7eb;
}

.ai-design-preview-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #9ca3af;
  margin: 12px 0 0;
}
</style>
