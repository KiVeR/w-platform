<script setup lang="ts">
import { Check, Expand, Pencil } from 'lucide-vue-next'
import { computed, ref } from 'vue'

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
      <MobileFrame :show-frame="true">
        <PreviewContent :design="designDoc" />
      </MobileFrame>
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
  background: var(--color-background-subtle);
  border: 1px solid var(--color-neutral-200);
  border-radius: 12px;
  overflow: hidden;
}

.ai-design-preview-frame {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: var(--color-neutral-100);
  height: 320px;
  overflow: hidden;
  transition: height 0.3s ease;
}

.ai-design-preview--expanded .ai-design-preview-frame {
  height: 520px;
}

.ai-design-preview-info {
  padding: 12px 16px;
  border-top: 1px solid var(--color-neutral-200);
  background: var(--color-surface);
}

.ai-design-preview-stats {
  font-size: 12px;
  color: var(--color-text-secondary);
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
  background: var(--color-info-500);
  color: var(--color-surface);
}

.ai-design-preview-btn--primary:hover {
  background: var(--color-info-600);
}

.ai-design-preview-btn--secondary {
  background: var(--color-neutral-100);
  color: var(--color-neutral-600);
  border: 1px solid var(--color-neutral-200);
}

.ai-design-preview-btn--secondary:hover {
  background: var(--color-neutral-200);
}

.ai-design-preview-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 12px 0 0;
}
</style>
