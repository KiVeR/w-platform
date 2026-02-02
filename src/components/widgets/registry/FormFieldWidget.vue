<script setup lang="ts">
import type { FormFieldType, Widget } from '@/types/widget'
import { GripVertical } from 'lucide-vue-next'
import { computed } from 'vue'
import { useWidgetsStore } from '@/stores/widgets'
import { generateFieldName } from '@/utils/form'

const props = defineProps<{
  widget: Widget
  parentId: string
  editable?: boolean
  isSelected?: boolean
  readonly?: boolean
}>()

const widgetsStore = useWidgetsStore()

const fieldType = computed(() => props.widget.content.fieldType || 'text')

const fieldName = computed(() => {
  if (props.widget.content.name)
    return props.widget.content.name
  return generateFieldName(props.widget.content.label || '') || `field_${props.widget.id.slice(0, 8)}`
})
const label = computed(() => props.widget.content.label || 'Label')
const placeholder = computed(() => {
  if (props.widget.content.placeholder)
    return props.widget.content.placeholder
  // Placeholders par défaut selon le type
  const defaults: Record<FormFieldType, string> = {
    text: 'Votre texte...',
    email: 'exemple@email.com',
    tel: '+33 6 12 34 56 78',
    number: '0',
    date: 'JJ/MM/AAAA',
    select: '',
    checkbox: '',
    radio: '',
    textarea: 'Votre message...',
  }
  return defaults[fieldType.value] || ''
})

const isRequired = computed(() => props.widget.content.required)
const options = computed(() => props.widget.content.options || [])

function handleRemove() {
  widgetsStore.removeChildWidget(props.parentId, props.widget.id)
}
</script>

<template>
  <div
    class="form-field-widget"
    :class="{
      'is-selected': isSelected && !readonly,
      'form-field-widget--readonly': readonly,
    }"
  >
    <div v-if="!readonly" class="field-handle" title="Glisser pour réordonner">
      <GripVertical :size="16" />
    </div>

    <div class="field-content">
      <label class="field-label">
        {{ label }}
        <span v-if="isRequired" class="required-mark">*</span>
      </label>

      <!-- Text, Email, Tel, Number, Date -->
      <input
        v-if="['text', 'email', 'tel', 'number', 'date'].includes(fieldType)"
        :type="fieldType"
        :name="fieldName"
        class="field-input"
        :placeholder="placeholder"
        disabled
      >

      <!-- Textarea -->
      <textarea
        v-else-if="fieldType === 'textarea'"
        :name="fieldName"
        class="field-textarea"
        :placeholder="placeholder"
        rows="3"
        disabled
      />

      <!-- Select -->
      <select
        v-else-if="fieldType === 'select'"
        :name="fieldName"
        class="field-select"
        disabled
      >
        <option value="">
          Choisissez...
        </option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <!-- Checkbox -->
      <div v-else-if="fieldType === 'checkbox'" class="field-checkbox">
        <input type="checkbox" :name="fieldName" disabled>
        <span>{{ label }}</span>
      </div>

      <!-- Radio -->
      <div v-else-if="fieldType === 'radio'" class="field-radio-group">
        <div v-for="opt in options" :key="opt.value" class="field-radio">
          <input type="radio" :name="fieldName" disabled>
          <span>{{ opt.label }}</span>
        </div>
      </div>
    </div>

    <button
      v-if="editable && !readonly"
      class="field-remove"
      title="Supprimer ce champ"
      @click.stop="handleRemove"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.form-field-widget {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 6px 4px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.form-field-widget:hover {
  border-color: var(--color-primary);
}

.form-field-widget.is-selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
}

.form-field-widget--readonly {
  padding: 0;
  background: transparent;
  border: none;
}

.form-field-widget--readonly:hover {
  border-color: transparent;
}

.field-handle {
  cursor: grab;
  color: #94a3b8;
  font-size: 12px;
  padding: 4px;
  user-select: none;
}

.field-handle:active {
  cursor: grabbing;
}

.field-content {
  flex: 1;
  min-width: 0;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
}

.required-mark {
  color: #ef4444;
  margin-left: 2px;
}

.field-input,
.field-textarea,
.field-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  font-size: 14px;
  background: #f8fafc;
  color: #64748b;
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

.field-checkbox,
.field-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #475569;
}

.field-radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s;
}

.form-field-widget:hover .field-remove {
  opacity: 1;
}

.field-remove:hover {
  background: #ef4444;
  color: white;
}
</style>
