<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useWidgetsStore } from '@/stores/widgets'

const editorStore = useEditorStore()
const widgetsStore = useWidgetsStore()

const activeTab = ref<'html' | 'css'>('html')

// Generate HTML from widgets
const generatedHtml = computed(() => {
  let html = ''
  for (const widget of widgetsStore.sortedItems) {
    html += `${generateWidgetHtml(widget)}\n`
  }
  return html || '<!-- Aucun widget -->'
})

// Generate CSS from global styles
const generatedCss = computed(() => {
  const { backgroundColor, textColor } = editorStore.globalStyles
  return `.landing-page {
  background-color: ${backgroundColor};
  color: ${textColor};
  font-family: system-ui, sans-serif;
  padding: 0;
  margin: 0;
}

.widget {
  width: 100%;
}

.title-widget h1 {
  margin: 0;
}

.text-widget p {
  margin: 0;
  line-height: 1.6;
}

.button-widget a {
  display: block;
  text-decoration: none;
  text-align: center;
}

.image-widget img {
  max-width: 100%;
  height: auto;
}

.separator-widget hr {
  border: none;
  border-top: 1px solid #e2e8f0;
}
`
})

function generateWidgetHtml(widget: any): string {
  const styles = Object.entries(widget.styles)
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join('; ')

  switch (widget.type) {
    case 'title':
      return `<div class="widget title-widget" style="${styles}">
  <h1>${escapeHtml(widget.content.text || 'Titre')}</h1>
</div>`

    case 'text':
      return `<div class="widget text-widget" style="${styles}">
  <p>${escapeHtml(widget.content.text || 'Texte...')}</p>
</div>`

    case 'image':
      return `<div class="widget image-widget" style="${styles}">
  <img src="${widget.content.src || ''}" alt="${escapeHtml(widget.content.alt || 'Image')}" />
</div>`

    case 'button': {
      const href = widget.content.action === 'tel'
        ? `tel:${widget.content.phone}`
        : widget.content.href || '#'
      return `<div class="widget button-widget">
  <a href="${href}" style="${styles}">${escapeHtml(widget.content.text || 'Bouton')}</a>
</div>`
    }

    case 'click-to-call':
      return `<div class="widget click-to-call-widget">
  <a href="tel:${widget.content.phone || ''}" style="${styles}">
    📞 ${escapeHtml(widget.content.text || 'Appeler')}
  </a>
</div>`

    case 'separator':
      return `<div class="widget separator-widget" style="${styles}">
  <hr />
</div>`

    case 'spacer':
      return `<div class="widget spacer-widget" style="height: ${widget.styles.height || '32px'}"></div>`

    default:
      return `<!-- Unknown widget type: ${widget.type} -->`
  }
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <div class="expert-mode">
    <div class="code-container">
      <div class="code-tabs">
        <button
          class="code-tab"
          :class="{ active: activeTab === 'html' }"
          @click="activeTab = 'html'"
        >
          HTML
        </button>
        <button
          class="code-tab"
          :class="{ active: activeTab === 'css' }"
          @click="activeTab = 'css'"
        >
          CSS
        </button>
        <button
          class="copy-btn"
          @click="copyToClipboard(activeTab === 'html' ? generatedHtml : generatedCss)"
        >
          📋 Copier
        </button>
      </div>

      <div class="code-editor">
        <pre v-if="activeTab === 'html'" class="code-content"><code>{{ generatedHtml }}</code></pre>
        <pre v-else class="code-content"><code>{{ generatedCss }}</code></pre>
      </div>

      <div class="code-info">
        <p class="info-text">
          💡 Mode lecture seule. Pour modifier le design, retournez en mode Designer.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expert-mode {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.code-container {
  width: 100%;
  max-width: 900px;
  height: 100%;
  background: #1e293b;
  border-radius: var(--radius-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.code-tabs {
  display: flex;
  background: #0f172a;
  padding: 8px 16px;
  gap: 8px;
}

.code-tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.code-tab:hover {
  color: #f8fafc;
}

.code-tab.active {
  background: #1e293b;
  color: #14b8a6;
}

.copy-btn {
  margin-left: auto;
  padding: 8px 16px;
  border: 1px solid #334155;
  background: transparent;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #334155;
  color: #f8fafc;
}

.code-editor {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.code-content {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.code-info {
  padding: 12px 16px;
  background: #0f172a;
  border-top: 1px solid #334155;
}

.info-text {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}
</style>
