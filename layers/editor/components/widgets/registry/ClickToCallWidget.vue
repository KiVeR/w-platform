<script setup lang="ts">
import { computed, inject, toRef } from 'vue'
import VariableText from '../../variables/VariableText.vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { isFullWidth, wrapperStyles, buttonStyles, iconSize } = useButtonWidget(toRef(props, 'widget'))
const { hasVariables } = useVariables()
const resolveText = inject<((text: string) => string) | null>('resolveText', null)

const displayText = computed(() => {
  const raw = props.widget.content.text || ''
  if (resolveText && !props.editable)
    return resolveText(raw)
  return raw
})

const showVariableBadges = computed(
  () => !resolveText && hasVariables(props.widget.content.text),
)

// Default to Phone icon, but allow customization
const icon = computed(() => props.widget.content.icon || 'Phone')
const iconPosition = computed(() => props.widget.content.iconPosition || 'start')
</script>

<template>
  <div class="click-to-call-widget" :style="wrapperStyles">
    <a
      :href="`tel:${widget.content.phone || ''}`"
      class="widget-button"
      :class="{ 'is-full-width': isFullWidth }"
      :style="buttonStyles"
      @click.prevent
    >
      <IconText
        :icon="icon"
        :icon-position="iconPosition"
        :icon-size="iconSize"
        gap="8px"
      >
        <VariableText v-if="showVariableBadges" :text="widget.content.text" tag="span" />
        <template v-else>{{ displayText || 'Appeler' }}</template>
      </IconText>
    </a>
    <div v-if="widget.content.phone" class="phone-number">
      {{ widget.content.phone }}
    </div>
  </div>
</template>

<style scoped>
.widget-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.widget-button.is-full-width {
  display: flex;
}

.widget-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.phone-number {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
