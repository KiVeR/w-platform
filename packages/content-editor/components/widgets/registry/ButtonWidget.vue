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

const href = computed(() => {
  const { action, phone, href } = props.widget.content
  switch (action) {
    case 'tel':
      return `tel:${phone || ''}`
    case 'email':
      return `mailto:${href || ''}`
    default:
      return href || '#'
  }
})

const displayText = computed(() => {
  const raw = props.widget.content.text || ''
  if (resolveText && !props.editable)
    return resolveText(raw)
  return raw
})

const showVariableBadges = computed(
  () => !resolveText && hasVariables(props.widget.content.text ?? ''),
)

const icon = computed(() => props.widget.content.icon || '')
const iconPosition = computed(() => props.widget.content.iconPosition || 'start')
</script>

<template>
  <div class="button-widget" :style="wrapperStyles">
    <a
      :href="href"
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
        <template v-else>{{ displayText || 'Bouton' }}</template>
      </IconText>
    </a>
  </div>
</template>

<style scoped>
.widget-button {
  display: inline-block;
  padding: 12px 24px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.widget-button.is-full-width {
  display: block;
}

.widget-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>
