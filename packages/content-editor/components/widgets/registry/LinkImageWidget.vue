<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const src = computed(() => props.widget.content.linkImageSrc || '')
const alt = computed(() => props.widget.content.linkImageAlt || 'Image')
const href = computed(() => props.widget.content.linkImageHref || '')

const hasImage = computed(() => !!src.value)
const hasLink = computed(() => !!href.value)
</script>

<template>
  <div
    class="link-image-widget"
    :style="{
      padding: widget.styles.padding,
      margin: widget.styles.margin,
      textAlign: widget.styles.textAlign,
    }"
  >
    <div v-if="hasImage" class="link-image-container">
      <!-- Badge lien -->
      <div v-if="hasLink" class="link-badge">
        🔗 Lien actif
      </div>
      <div v-else class="link-badge no-link">
        Aucun lien
      </div>

      <!-- Image cliquable -->
      <a
        :href="href || '#'"
        class="image-link"
        :class="{ 'has-link': hasLink }"
        @click.prevent
      >
        <img :src="src" :alt="alt" class="linked-image">
        <div v-if="hasLink" class="link-overlay">
          <span class="link-icon">🔗</span>
        </div>
      </a>

      <!-- URL si définie -->
      <div v-if="hasLink" class="link-url">
        <span class="url-text">{{ href }}</span>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="link-image-empty">
      <div class="empty-icon">
        🔗
      </div>
      <p class="empty-text">
        Ajouter une image cliquable
      </p>
      <p class="empty-hint">
        Configurez l'image et le lien dans les options
      </p>
    </div>
  </div>
</template>

<style scoped>
.link-image-widget {
}

.link-image-container {
  display: inline-block;
  position: relative;
}

.link-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: #22c55e;
  color: var(--color-surface);
  padding: 4px 10px;
  border-radius: var(--radius-xl);
  font-size: 11px;
  font-weight: 500;
}

.link-badge.no-link {
  background: var(--color-neutral-400);
}

.image-link {
  display: block;
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.2s;
}

.image-link.has-link {
  cursor: pointer;
}

.image-link.has-link:hover .link-overlay {
  opacity: 1;
}

.linked-image {
  display: block;
  max-width: 100%;
  height: auto;
}

.link-overlay {
  position: absolute;
  inset: 0;
  background: rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.link-icon {
  font-size: 32px;
  background: var(--color-surface);
  padding: 12px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.link-url {
  margin-top: 8px;
  padding: 6px 12px;
  background: var(--color-neutral-100);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-neutral-500);
}

.url-text {
  max-width: 250px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.link-image-empty {
  padding: 32px 16px;
  background: linear-gradient(135deg, var(--color-neutral-50) 0%, var(--color-neutral-200) 100%);
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-lg);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.empty-text {
  color: var(--color-neutral-500);
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.empty-hint {
  color: var(--color-neutral-400);
  font-size: 13px;
  margin: 0;
}
</style>
