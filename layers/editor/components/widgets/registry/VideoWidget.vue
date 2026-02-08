<script setup lang="ts">
import type { Widget } from '../../types/widget'
import { Video } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

// Détection automatique de la plateforme et extraction de l'ID
function parseVideoUrl(url: string): { provider: 'youtube' | 'vimeo' | 'custom', videoId: string } {
  if (!url)
    return { provider: 'custom', videoId: '' }

  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ]
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern)
    if (match)
      return { provider: 'youtube', videoId: match[1] || '' }
  }

  // Vimeo patterns
  const vimeoPattern = /vimeo\.com\/(\d+)/
  const vimeoMatch = url.match(vimeoPattern)
  if (vimeoMatch)
    return { provider: 'vimeo', videoId: vimeoMatch[1] || '' }

  return { provider: 'custom', videoId: '' }
}

const parsedVideo = computed(() => {
  return parseVideoUrl(props.widget.content.videoUrl || '')
})

const embedUrl = computed(() => {
  const { provider, videoId } = parsedVideo.value
  const autoplay = props.widget.content.autoplay ? '1' : '0'
  const muted = props.widget.content.muted ? '1' : '0'
  const loop = props.widget.content.loop ? '1' : '0'
  const controls = props.widget.content.controls !== false ? '1' : '0'

  if (provider === 'youtube' && videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&mute=${muted}&loop=${loop}&controls=${controls}&rel=0`
  }
  if (provider === 'vimeo' && videoId) {
    return `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay}&muted=${muted}&loop=${loop}&controls=${controls}`
  }
  return ''
})

const hasVideo = computed(() => !!embedUrl.value)

const providerName = computed(() => {
  switch (parsedVideo.value.provider) {
    case 'youtube': return 'YouTube'
    case 'vimeo': return 'Vimeo'
    default: return 'Vidéo'
  }
})
</script>

<template>
  <div
    class="video-widget"
    :style="{
      borderRadius: widget.styles.borderRadius,
      padding: widget.styles.padding,
      margin: widget.styles.margin,
    }"
  >
    <!-- Preview avec vidéo -->
    <div v-if="hasVideo" class="video-container">
      <div class="video-provider-badge">
        <span class="badge-content"><Video :size="12" /> {{ providerName }}</span>
      </div>
      <iframe
        :src="embedUrl"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="video-iframe"
      />
    </div>

    <!-- Placeholder quand pas de vidéo -->
    <div v-else class="video-placeholder">
      <div class="placeholder-icon">
        <Video :size="48" />
      </div>
      <p class="placeholder-text">
        Collez une URL YouTube ou Vimeo
      </p>
      <p class="placeholder-hint">
        Détection automatique de la plateforme
      </p>
      <div class="placeholder-examples">
        <span class="example-badge youtube"><Video :size="10" /> YouTube</span>
        <span class="example-badge vimeo"><Video :size="10" /> Vimeo</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-widget {
  overflow: hidden;
}

.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.video-provider-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 500;
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-placeholder {
  width: 100%;
  min-height: 180px;
  background-color: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.placeholder-icon {
  margin-bottom: 8px;
}

.badge-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.placeholder-text {
  font-size: 14px;
}

.placeholder-hint {
  font-size: 12px;
  margin-top: 4px;
}

.placeholder-examples {
  display: flex;
  gap: 8px;
}

.example-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-xl);
  font-size: 11px;
  font-weight: 500;
}

.example-badge.youtube {
  background: rgba(255, 0, 0, 0.2);
  color: #ff4444;
}

.example-badge.vimeo {
  background: rgba(26, 183, 234, 0.2);
  color: #1ab7ea;
}
</style>
