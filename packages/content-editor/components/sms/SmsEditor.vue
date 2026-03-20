<script setup lang="ts">
import { computed, ref } from 'vue'
import { Info, AlertTriangle, ChevronDown } from 'lucide-vue-next'
import type { SmsVariable, SmsLabels } from '../../types/sms'
import { getSmsStats, isForbiddenMessage, MAX_SENDER_CHARS } from '../../utils/sms'

const props = withDefaults(defineProps<{
  name: string
  sender: string
  message: string
  variables?: SmsVariable[]
  labels: SmsLabels
  showPreview?: boolean
}>(), {
  variables: () => [],
  showPreview: true,
})

const emit = defineEmits<{
  'update:name': [value: string]
  'update:sender': [value: string]
  'update:message': [value: string]
  dirty: []
}>()

const smsStats = computed(() => getSmsStats(props.message))
const hasForbidden = computed(() => isForbiddenMessage(props.message))
const isMultiSms = computed(() => smsStats.value.smsCount > 1)

const variableMenuOpen = ref(false)

function updateField(field: 'name' | 'sender' | 'message', value: string) {
  switch (field) {
    case 'name':
      emit('update:name', value)
      break
    case 'sender':
      emit('update:sender', value)
      break
    case 'message':
      emit('update:message', value)
      break
  }
  emit('dirty')
}

function insertVariable(token: string) {
  emit('update:message', props.message + token)
  emit('dirty')
  variableMenuOpen.value = false
}
</script>

<template>
  <div
    class="sms-editor"
    :class="{ 'sms-editor--with-preview': showPreview }"
  >
    <!-- Left: Form -->
    <div class="sms-editor__form">
      <!-- Name -->
      <div class="sms-field">
        <label class="sms-label">{{ labels.name }}</label>
        <input
          data-name-input
          type="text"
          class="sms-input"
          :value="name"
          :placeholder="labels.namePlaceholder"
          maxlength="255"
          @input="updateField('name', ($event.target as HTMLInputElement).value)"
        >
      </div>

      <!-- Sender -->
      <div class="sms-field">
        <label class="sms-label">{{ labels.sender }}</label>
        <input
          data-sender-input
          type="text"
          class="sms-input"
          :value="sender"
          :placeholder="labels.senderPlaceholder"
          :maxlength="MAX_SENDER_CHARS"
          @input="updateField('sender', ($event.target as HTMLInputElement).value)"
        >
        <p class="sms-help">{{ labels.senderHelp }}</p>
      </div>

      <!-- Message -->
      <div class="sms-field">
        <div class="sms-field__header">
          <label class="sms-label">{{ labels.messageLabel }}</label>
          <div v-if="variables.length > 0" class="sms-variable-menu">
            <button
              data-variable-trigger
              type="button"
              class="sms-variable-btn"
              @click="variableMenuOpen = !variableMenuOpen"
            >
              {{ labels.insertVariable }}
              <ChevronDown class="sms-icon-sm" />
            </button>
            <div v-if="variableMenuOpen" class="sms-variable-dropdown">
              <button
                v-for="v in variables"
                :key="v.key"
                data-variable-item
                type="button"
                class="sms-variable-option"
                @click="insertVariable(v.token)"
              >
                <code class="sms-variable-code">{{ v.token }}</code>
                {{ v.label }}
              </button>
            </div>
          </div>
        </div>
        <textarea
          data-message-textarea
          class="sms-textarea"
          :value="message"
          :placeholder="labels.messagePlaceholder"
          rows="5"
          @input="updateField('message', ($event.target as HTMLTextAreaElement).value)"
        />

        <!-- Char counter -->
        <div data-char-counter class="sms-counter">
          <span>{{ labels.charCount.replace('{count}', String(smsStats.charCount)).replace('{max}', String(smsStats.maxChars)) }}</span>
          <span>{{ labels.smsCount.replace('{count}', String(smsStats.smsCount || 1)) }}</span>
          <span>{{ labels.encoding.replace('{encoding}', smsStats.encoding) }}</span>
        </div>
      </div>

      <!-- STOP alert (always shown) -->
      <div data-stop-alert class="sms-alert sms-alert--info">
        <Info class="sms-alert-icon" />
        <div>
          <p class="sms-alert-title">{{ labels.stopTitle }}</p>
          <p class="sms-alert-desc">{{ labels.stopDescription }}</p>
        </div>
      </div>

      <!-- Multi-SMS warning -->
      <div v-if="isMultiSms" data-multi-sms-alert class="sms-alert sms-alert--destructive">
        <AlertTriangle class="sms-alert-icon" />
        <p class="sms-alert-desc">{{ labels.multiSmsWarning }}</p>
      </div>

      <!-- Forbidden domain warning -->
      <div v-if="hasForbidden" data-forbidden-alert class="sms-alert sms-alert--destructive">
        <AlertTriangle class="sms-alert-icon" />
        <p class="sms-alert-desc">{{ labels.forbiddenDomain }}</p>
      </div>
    </div>

    <!-- Right: Preview -->
    <div v-if="showPreview" class="sms-editor__preview">
      <div class="sms-editor__preview-sticky">
        <SmsPreview
          :sender="sender"
          :message="message"
          :placeholder="labels.previewPlaceholder"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sms-editor {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sms-editor--with-preview {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 1024px) {
  .sms-editor--with-preview {
    grid-template-columns: 1fr 320px;
  }
}

.sms-editor__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sms-editor__preview {
  display: none;
}

@media (min-width: 1024px) {
  .sms-editor__preview {
    display: block;
  }
}

.sms-editor__preview-sticky {
  position: sticky;
  top: 24px;
}

/* Fields */
.sms-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sms-field__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sms-label {
  font-size: 14px;
  font-weight: 500;
}

.sms-input {
  height: 40px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 0 12px;
  font-size: 14px;
  background: transparent;
  outline: none;
  transition: border-color 0.15s;
}

.sms-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.sms-textarea {
  width: 100%;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  font-size: 14px;
  background: transparent;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.15s;
}

.sms-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.sms-help {
  font-size: 12px;
  color: #6b7280;
}

.sms-counter {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

/* Variable menu */
.sms-variable-menu {
  position: relative;
}

.sms-variable-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  color: #374151;
  transition: background 0.15s;
}

.sms-variable-btn:hover {
  background: #f3f4f6;
}

.sms-variable-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  min-width: 200px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  padding: 4px;
}

.sms-variable-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  font-size: 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  text-align: left;
  transition: background 0.15s;
}

.sms-variable-option:hover {
  background: #f3f4f6;
}

.sms-variable-code {
  font-size: 12px;
  color: #6b7280;
}

/* Alerts */
.sms-alert {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  align-items: flex-start;
}

.sms-alert--info {
  border-color: #d1d5db;
}

.sms-alert--destructive {
  border-color: #fca5a5;
  background: #fef2f2;
}

.sms-alert-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.sms-alert--destructive .sms-alert-icon {
  color: #dc2626;
}

.sms-alert-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.sms-alert-desc {
  font-size: 13px;
  color: #4b5563;
}

.sms-alert--destructive .sms-alert-desc {
  color: #991b1b;
}

/* Icons */
.sms-icon-sm {
  width: 12px;
  height: 12px;
}
</style>
