<script setup lang="ts">
import type { SocialLink, SocialPlatform, Widget } from '@/types/widget'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

// Configuration des plateformes sociales
const platformConfig: Record<SocialPlatform, { icon: string, color: string, label: string }> = {
  facebook: { icon: 'f', color: '#1877f2', label: 'Facebook' },
  instagram: { icon: '📷', color: '#e4405f', label: 'Instagram' },
  twitter: { icon: '𝕏', color: '#000000', label: 'X (Twitter)' },
  linkedin: { icon: 'in', color: '#0077b5', label: 'LinkedIn' },
  youtube: { icon: '▶', color: '#ff0000', label: 'YouTube' },
  tiktok: { icon: '♪', color: '#000000', label: 'TikTok' },
  whatsapp: { icon: '💬', color: '#25d366', label: 'WhatsApp' },
  telegram: { icon: '✈', color: '#0088cc', label: 'Telegram' },
  email: { icon: '✉', color: '#6b7280', label: 'Email' },
}

const enabledLinks = computed(() => {
  return (props.widget.content.socialLinks || []).filter(link => link.enabled && link.url)
})

const socialStyle = computed(() => props.widget.content.socialStyle || 'icons')
const socialSize = computed(() => props.widget.content.socialSize || 'medium')

const sizeClass = computed(() => {
  switch (socialSize.value) {
    case 'small': return 'size-small'
    case 'large': return 'size-large'
    default: return 'size-medium'
  }
})

function getPlatformConfig(platform: SocialPlatform) {
  return platformConfig[platform] || { icon: '?', color: '#999', label: platform }
}

function getHref(link: SocialLink) {
  if (link.platform === 'email') {
    return `mailto:${link.url}`
  }
  if (link.platform === 'whatsapp') {
    const phone = link.url.replace(/\D/g, '')
    return `https://wa.me/${phone}`
  }
  if (link.platform === 'telegram') {
    return `https://t.me/${link.url.replace('@', '')}`
  }
  return link.url
}
</script>

<template>
  <div
    class="social-widget"
    :class="[socialStyle, sizeClass]"
    :style="{
      justifyContent: widget.styles.textAlign === 'center' ? 'center'
        : widget.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
      padding: widget.styles.padding,
      margin: widget.styles.margin,
    }"
  >
    <!-- Liens activés -->
    <template v-if="enabledLinks.length > 0">
      <a
        v-for="link in enabledLinks"
        :key="link.platform"
        :href="getHref(link)"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link"
        :style="{
          '--platform-color': getPlatformConfig(link.platform).color,
        }"
        :title="getPlatformConfig(link.platform).label"
      >
        <span class="social-icon">{{ getPlatformConfig(link.platform).icon }}</span>
        <span v-if="socialStyle === 'buttons'" class="social-label">
          {{ getPlatformConfig(link.platform).label }}
        </span>
      </a>
    </template>

    <!-- Placeholder -->
    <div v-else class="social-placeholder">
      <div class="placeholder-icons">
        <span class="placeholder-icon" style="--platform-color: #1877f2">f</span>
        <span class="placeholder-icon" style="--platform-color: #e4405f">📷</span>
        <span class="placeholder-icon" style="--platform-color: #000">𝕏</span>
        <span class="placeholder-icon" style="--platform-color: #0077b5">in</span>
        <span class="placeholder-icon" style="--platform-color: #ff0000">▶</span>
      </div>
      <p class="placeholder-text">
        Réseaux sociaux
      </p>
      <p class="placeholder-hint">
        Configurez vos liens dans le panneau
      </p>
    </div>
  </div>
</template>

<style scoped>
.social-widget {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

/* Style Icons (default) */
.social-widget.icons .social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--platform-color);
  color: white;
  text-decoration: none;
  transition: all 0.2s;
  font-weight: bold;
}

.social-widget.icons .social-link:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Style Pills */
.social-widget.pills .social-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  background: var(--platform-color);
  color: white;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 500;
}

.social-widget.pills .social-link:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

/* Style Buttons */
.social-widget.buttons .social-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  background: var(--platform-color);
  color: white;
  text-decoration: none;
  transition: all 0.2s;
  font-weight: 500;
}

.social-widget.buttons .social-link:hover {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Sizes */
.social-widget.size-small .social-link {
  transform: scale(0.85);
}

.social-widget.size-small.icons .social-link {
  width: 32px;
  height: 32px;
  font-size: 12px;
}

.social-widget.size-large .social-link {
  transform: scale(1.1);
}

.social-widget.size-large.icons .social-link {
  width: 52px;
  height: 52px;
  font-size: 20px;
}

.social-icon {
  font-style: normal;
}

.social-label {
  font-size: inherit;
}

/* Placeholder */
.social-placeholder {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.placeholder-icons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.placeholder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.placeholder-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.placeholder-hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 0;
}
</style>
