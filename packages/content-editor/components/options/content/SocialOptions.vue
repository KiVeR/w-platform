<script setup lang="ts">
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const styleOptions = [
  { value: 'icons', label: 'Icônes rondes' },
  { value: 'pills', label: 'Pilules' },
  { value: 'buttons', label: 'Boutons' },
]

const sizeOptions = [
  { value: 'small', label: 'Petit' },
  { value: 'medium', label: 'Moyen' },
  { value: 'large', label: 'Grand' },
]

const socialLabels: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  email: 'Email',
}

const socialPlaceholders: Record<SocialPlatform, string> = {
  facebook: 'https://facebook.com/...',
  instagram: 'https://instagram.com/...',
  twitter: 'https://x.com/...',
  linkedin: 'https://linkedin.com/in/...',
  youtube: 'https://youtube.com/@...',
  tiktok: 'https://tiktok.com/@...',
  whatsapp: '+33612345678',
  telegram: '@username',
  email: 'contact@example.com',
}

function updateSocialLink(index: number, key: keyof SocialLink, value: any): void {
  const links = [...(props.widget.content.socialLinks || [])]
  if (links[index]) {
    links[index] = { ...links[index], [key]: value }
    updateContent('socialLinks', links)
  }
}
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Style d'affichage">
      <OptionSelect
        :model-value="widget.content.socialStyle"
        :options="styleOptions"
        @update:model-value="updateContent('socialStyle', $event as 'icons' | 'buttons' | 'pills')"
      />
    </OptionGroup>

    <OptionGroup label="Taille">
      <OptionSelect
        :model-value="widget.content.socialSize"
        :options="sizeOptions"
        @update:model-value="updateContent('socialSize', $event as 'small' | 'medium' | 'large')"
      />
    </OptionGroup>

    <div class="social-links-editor">
      <label class="editor-label">Réseaux sociaux</label>
      <div
        v-for="(link, index) in widget.content.socialLinks"
        :key="link.platform"
        class="social-link-row"
      >
        <label class="social-checkbox">
          <input
            type="checkbox"
            :checked="link.enabled"
            @change="updateSocialLink(index, 'enabled', ($event.target as HTMLInputElement).checked)"
          >
          <span class="social-platform">{{ socialLabels[link.platform] || link.platform }}</span>
        </label>
        <OptionInput
          v-if="link.enabled"
          :model-value="link.url"
          :placeholder="socialPlaceholders[link.platform] || 'URL...'"
          class="social-url"
          @update:model-value="updateSocialLink(index, 'url', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.options-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.social-links-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.editor-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.social-link-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--color-background);
  border-radius: var(--radius-md);
}

.social-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.social-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.social-platform {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.social-url {
  margin-top: var(--space-1);
}
</style>
