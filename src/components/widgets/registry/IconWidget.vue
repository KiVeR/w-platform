<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

// Bibliothèque d'emojis populaires par catégorie
const emojiLibrary = {
  actions: ['📞', '✉️', '💬', '📍', '🔗', '⬇️', '➡️', '✅', '❌', '⚡'],
  business: ['💼', '📊', '💰', '🏢', '📈', '🎯', '🏆', '⭐', '💡', '🔑'],
  tech: ['📱', '💻', '🖥️', '⚙️', '🔒', '🌐', '📡', '💾', '🔋', '📸'],
  social: ['❤️', '👍', '🎉', '🔥', '✨', '💪', '🙌', '👏', '🤝', '💯'],
  nature: ['🌟', '☀️', '🌙', '⚡', '🌊', '🔥', '💧', '🌱', '🍀', '🌈'],
  arrows: ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '🔄', '↩️'],
}

const iconName = computed(() => props.widget.content.iconName || '⭐')
const iconSize = computed(() => props.widget.content.iconSize || '48px')
const hasLink = computed(() => !!props.widget.content.href)

const wrapperStyle = computed(() => ({
  fontSize: iconSize.value,
  color: props.widget.content.iconColor || 'inherit',
  textAlign: props.widget.styles.textAlign || 'center',
  padding: props.widget.styles.padding,
  margin: props.widget.styles.margin,
}))
</script>

<template>
  <div class="icon-widget" :style="wrapperStyle">
    <!-- Avec lien -->
    <a
      v-if="hasLink"
      :href="widget.content.href"
      :target="widget.content.href?.startsWith('http') ? '_blank' : '_self'"
      rel="noopener noreferrer"
      class="icon-link"
    >
      <span class="icon-display">{{ iconName }}</span>
    </a>

    <!-- Sans lien -->
    <span v-else class="icon-display">{{ iconName }}</span>

    <!-- Placeholder en mode édition si pas d'icône -->
    <div v-if="editable && !iconName" class="icon-picker-hint">
      <p>Choisissez une icône</p>
      <div class="icon-samples">
        <span v-for="emoji in emojiLibrary.actions.slice(0, 6)" :key="emoji">{{ emoji }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  line-height: 1;
}

.icon-display {
  display: inline-block;
  transition: transform 0.2s;
}

.icon-link {
  text-decoration: none;
  color: inherit;
}

.icon-link:hover .icon-display {
  transform: scale(1.15);
}

.icon-picker-hint {
  margin-top: 8px;
  text-align: center;
}

.icon-picker-hint p {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0 0 8px 0;
}

.icon-samples {
  display: flex;
  gap: 4px;
  font-size: 20px;
}
</style>
