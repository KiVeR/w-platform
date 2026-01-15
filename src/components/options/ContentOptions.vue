<script setup lang="ts">
import type { FormFieldType, GalleryImage, SelectOption, SocialLink, SocialPlatform, StoreLocation, Widget, WidgetContent } from '@/types/widget'
import { computed } from 'vue'
import { useWidgetsStore } from '@/stores/widgets'

const props = defineProps<{
  widget: Widget
}>()

const widgetsStore = useWidgetsStore()

function updateContent<K extends keyof WidgetContent>(key: K, value: WidgetContent[K]): void {
  widgetsStore.updateWidgetContent(props.widget.id, { [key]: value })
}

const optionsText = computed({
  get: () => {
    const options = props.widget.content.options || []
    return options.map(option => `${option.value}::${option.label}`).join('\n')
  },
  set: (text: string) => {
    const options: SelectOption[] = text
      .split('\n')
      .filter(line => line.trim())
      .map(parseOptionLine)
    updateContent('options', options)
  },
})

function parseOptionLine(line: string): SelectOption {
  const [value, label] = line.split('::')
  const trimmedValue = value?.trim() || ''
  return {
    value: trimmedValue,
    label: label?.trim() || trimmedValue,
  }
}

const fieldTypes: { value: FormFieldType, label: string }[] = [
  { value: 'text', label: 'Texte' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Téléphone' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Zone de texte' },
  { value: 'select', label: 'Liste déroulante' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'radio', label: 'Boutons radio' },
]

// Social widget helpers
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

function getSocialLabel(platform: SocialPlatform): string {
  return socialLabels[platform] || platform
}

function getSocialPlaceholder(platform: SocialPlatform): string {
  return socialPlaceholders[platform] || 'URL...'
}

function updateSocialLink(index: number, key: keyof SocialLink, value: any): void {
  const links = [...(props.widget.content.socialLinks || [])]
  if (links[index]) {
    links[index] = { ...links[index], [key]: value }
    updateContent('socialLinks', links)
  }
}

// Icon widget
const popularEmojis = ['⭐', '❤️', '✅', '📞', '✉️', '📍', '💡', '🎯', '🔥', '✨', '👍', '🏆']

// Store Locator widget
function addStore(): void {
  const stores = [...(props.widget.content.storeLocatorStores || [])]
  stores.push({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    phone: '',
  })
  updateContent('storeLocatorStores', stores)
}

function removeStore(index: number): void {
  const stores = [...(props.widget.content.storeLocatorStores || [])]
  stores.splice(index, 1)
  updateContent('storeLocatorStores', stores)
}

function updateStore(index: number, key: keyof StoreLocation, value: any): void {
  const stores = [...(props.widget.content.storeLocatorStores || [])]
  if (stores[index]) {
    stores[index] = { ...stores[index], [key]: value }
    updateContent('storeLocatorStores', stores)
  }
}

// Drive widget
function addDriveStore(): void {
  const stores = [...(props.widget.content.driveStores || [])]
  stores.push({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    phone: '',
    openingHours: '',
  })
  updateContent('driveStores', stores)
}

function removeDriveStore(index: number): void {
  const stores = [...(props.widget.content.driveStores || [])]
  stores.splice(index, 1)
  updateContent('driveStores', stores)
}

function updateDriveStore(index: number, key: keyof StoreLocation, value: any): void {
  const stores = [...(props.widget.content.driveStores || [])]
  if (stores[index]) {
    stores[index] = { ...stores[index], [key]: value }
    updateContent('driveStores', stores)
  }
}

// Gallery widget
function addGalleryImage(): void {
  const images = [...(props.widget.content.galleryImages || [])]
  images.push({ src: '', alt: '' })
  updateContent('galleryImages', images)
}

function removeGalleryImage(index: number): void {
  const images = [...(props.widget.content.galleryImages || [])]
  images.splice(index, 1)
  updateContent('galleryImages', images)
}

function updateGalleryImage(index: number, key: keyof GalleryImage, value: string): void {
  const images = [...(props.widget.content.galleryImages || [])]
  if (images[index]) {
    images[index] = { ...images[index], [key]: value }
    updateContent('galleryImages', images)
  }
}

// Slider widget (réutilise les mêmes fonctions avec sliderImages)
function addSliderImage(): void {
  const images = [...(props.widget.content.sliderImages || [])]
  images.push({ src: '', alt: '' })
  updateContent('sliderImages', images)
}

function removeSliderImage(index: number): void {
  const images = [...(props.widget.content.sliderImages || [])]
  images.splice(index, 1)
  updateContent('sliderImages', images)
}

function updateSliderImage(index: number, key: keyof GalleryImage, value: string): void {
  const images = [...(props.widget.content.sliderImages || [])]
  if (images[index]) {
    images[index] = { ...images[index], [key]: value }
    updateContent('sliderImages', images)
  }
}

// Effect widget - emojis prédéfinis
const effectEmojis = ['❄️', '🎉', '✨', '🌟', '💫', '🍂', '🌸', '🎈', '💖', '⭐']
</script>

<template>
  <div class="content-options">
    <!-- Title Widget -->
    <template v-if="widget.type === 'title'">
      <div class="option-group">
        <label class="option-label">Texte *</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.text"
          placeholder="Entrez le titre"
          @input="updateContent('text', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </template>

    <!-- Text Widget -->
    <template v-else-if="widget.type === 'text'">
      <div class="option-group">
        <label class="option-label">Texte *</label>
        <textarea
          class="option-textarea"
          :value="widget.content.text"
          placeholder="Entrez le texte"
          rows="5"
          @input="updateContent('text', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
    </template>

    <!-- Image Widget -->
    <template v-else-if="widget.type === 'image'">
      <div class="option-group">
        <label class="option-label">URL de l'image *</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.src"
          placeholder="https://exemple.com/image.jpg"
          @input="updateContent('src', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Texte alternatif</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.alt"
          placeholder="Description de l'image"
          @input="updateContent('alt', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </template>

    <!-- Button Widget -->
    <template v-else-if="widget.type === 'button'">
      <div class="option-group">
        <label class="option-label">Texte du bouton *</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.text"
          placeholder="Cliquez ici"
          @input="updateContent('text', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Action</label>
        <select
          class="option-select"
          :value="widget.content.action"
          @change="updateContent('action', ($event.target as HTMLSelectElement).value as 'link' | 'tel' | 'email')"
        >
          <option value="link">
            Lien
          </option>
          <option value="tel">
            Téléphone
          </option>
          <option value="email">
            Email
          </option>
        </select>
      </div>
      <div v-if="widget.content.action === 'tel'" class="option-group">
        <label class="option-label">Numéro de téléphone *</label>
        <input
          type="tel"
          class="option-input"
          :value="widget.content.phone"
          placeholder="+33123456789"
          @input="updateContent('phone', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div v-else class="option-group">
        <label class="option-label">{{ widget.content.action === 'email' ? 'Email' : 'URL' }} *</label>
        <input
          :type="widget.content.action === 'email' ? 'email' : 'url'"
          class="option-input"
          :value="widget.content.href"
          :placeholder="widget.content.action === 'email' ? 'contact@exemple.com' : 'https://exemple.com'"
          @input="updateContent('href', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </template>

    <!-- Click to Call Widget -->
    <template v-else-if="widget.type === 'click-to-call'">
      <div class="option-group">
        <label class="option-label">Texte *</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.text"
          placeholder="Appeler"
          @input="updateContent('text', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Téléphone *</label>
        <input
          type="tel"
          class="option-input"
          :value="widget.content.phone"
          placeholder="+33123456789"
          @input="updateContent('phone', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </template>

    <!-- Spacer Widget -->
    <template v-else-if="widget.type === 'spacer'">
      <div class="option-group">
        <label class="option-label">Hauteur</label>
        <div class="option-row">
          <input
            type="range"
            class="option-range"
            min="8"
            max="200"
            :value="parseInt(widget.styles.height || '32')"
            @input="widgetsStore.updateWidgetStyles(widget.id, { height: `${($event.target as HTMLInputElement).value}px` })"
          >
          <span class="range-value">{{ widget.styles.height || '32px' }}</span>
        </div>
      </div>
    </template>

    <!-- Separator Widget -->
    <template v-else-if="widget.type === 'separator'">
      <div class="option-group">
        <label class="option-label">Style de ligne</label>
        <select
          class="option-select"
          :value="widget.styles.borderStyle"
          @change="widgetsStore.updateWidgetStyles(widget.id, { borderStyle: ($event.target as HTMLSelectElement).value as any })"
        >
          <option value="solid">
            Solide
          </option>
          <option value="dashed">
            Tirets
          </option>
          <option value="dotted">
            Pointillés
          </option>
        </select>
      </div>
    </template>

    <!-- Row Widget -->
    <template v-else-if="widget.type === 'row'">
      <div class="option-group">
        <label class="option-label">Espacement (gap)</label>
        <select
          class="option-select"
          :value="widget.content.gap"
          @change="updateContent('gap', ($event.target as HTMLSelectElement).value)"
        >
          <option value="8px">
            Petit (8px)
          </option>
          <option value="16px">
            Moyen (16px)
          </option>
          <option value="24px">
            Grand (24px)
          </option>
          <option value="32px">
            Très grand (32px)
          </option>
        </select>
      </div>
      <div class="option-group">
        <label class="option-label">Alignement vertical</label>
        <select
          class="option-select"
          :value="widget.content.align"
          @change="updateContent('align', ($event.target as HTMLSelectElement).value as 'start' | 'center' | 'end' | 'stretch')"
        >
          <option value="stretch">
            Étirer
          </option>
          <option value="start">
            Haut
          </option>
          <option value="center">
            Centre
          </option>
          <option value="end">
            Bas
          </option>
        </select>
      </div>
      <div class="option-group">
        <label class="option-label">
          <input
            type="checkbox"
            :checked="widget.content.wrap !== false"
            @change="updateContent('wrap', ($event.target as HTMLInputElement).checked)"
          >
          Retour à la ligne sur mobile
        </label>
      </div>
    </template>

    <!-- Column Widget -->
    <template v-else-if="widget.type === 'column'">
      <div class="option-group">
        <label class="option-label">Largeur</label>
        <select
          class="option-select"
          :value="widget.content.columnWidth"
          @change="updateContent('columnWidth', ($event.target as HTMLSelectElement).value)"
        >
          <option value="auto">
            Auto (flexible)
          </option>
          <option value="25%">
            25%
          </option>
          <option value="33%">
            33%
          </option>
          <option value="50%">
            50%
          </option>
          <option value="66%">
            66%
          </option>
          <option value="75%">
            75%
          </option>
          <option value="100%">
            100%
          </option>
        </select>
      </div>
    </template>

    <!-- Form Widget -->
    <template v-else-if="widget.type === 'form'">
      <div class="option-group">
        <label class="option-label">Message de succès</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.successMessage"
          placeholder="Merci ! Votre message a été envoyé."
          @input="updateContent('successMessage', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">URL de redirection</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.redirectUrl"
          placeholder="https://exemple.com/merci"
          @input="updateContent('redirectUrl', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label checkbox-label">
          <input
            type="checkbox"
            :checked="widget.content.emailNotify"
            @change="updateContent('emailNotify', ($event.target as HTMLInputElement).checked)"
          >
          Envoyer une notification par email
        </label>
      </div>
      <template v-if="widget.content.emailNotify">
        <div class="option-group">
          <label class="option-label">Email destinataire</label>
          <input
            type="email"
            class="option-input"
            :value="widget.content.emailTo"
            placeholder="contact@exemple.com"
            @input="updateContent('emailTo', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="option-group">
          <label class="option-label">Sujet de l'email</label>
          <input
            type="text"
            class="option-input"
            :value="widget.content.emailSubject"
            placeholder="Nouveau message"
            @input="updateContent('emailSubject', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </template>
    </template>

    <!-- Form Field Widget -->
    <template v-else-if="widget.type === 'form-field'">
      <div class="option-group">
        <label class="option-label">Type de champ *</label>
        <select
          class="option-select"
          :value="widget.content.fieldType"
          @change="updateContent('fieldType', ($event.target as HTMLSelectElement).value as FormFieldType)"
        >
          <option v-for="ft in fieldTypes" :key="ft.value" :value="ft.value">
            {{ ft.label }}
          </option>
        </select>
      </div>
      <div class="option-group">
        <label class="option-label">Label *</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.label"
          placeholder="Votre nom"
          @input="updateContent('label', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div v-if="!['checkbox', 'radio'].includes(widget.content.fieldType || '')" class="option-group">
        <label class="option-label">Placeholder</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.placeholder"
          placeholder="Texte d'aide..."
          @input="updateContent('placeholder', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label checkbox-label">
          <input
            type="checkbox"
            :checked="widget.content.required"
            @change="updateContent('required', ($event.target as HTMLInputElement).checked)"
          >
          Champ obligatoire
        </label>
      </div>

      <!-- Options pour select/radio -->
      <template v-if="['select', 'radio'].includes(widget.content.fieldType || '')">
        <div class="option-group">
          <label class="option-label">Options</label>
          <textarea
            class="option-textarea"
            :value="optionsText"
            placeholder="valeur::Label&#10;valeur2::Label 2"
            rows="4"
            @input="optionsText = ($event.target as HTMLTextAreaElement).value"
          />
          <span class="option-hint">Format: valeur::Label (une option par ligne)</span>
        </div>
      </template>
    </template>

    <!-- Video Widget -->
    <template v-else-if="widget.type === 'video'">
      <div class="option-group">
        <label class="option-label">URL de la vidéo *</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.videoUrl"
          placeholder="https://youtube.com/watch?v=..."
          @input="updateContent('videoUrl', ($event.target as HTMLInputElement).value)"
        >
        <span class="option-hint">YouTube ou Vimeo détecté automatiquement</span>
      </div>
      <div class="option-group">
        <label class="option-label checkbox-label">
          <input
            type="checkbox"
            :checked="widget.content.autoplay"
            @change="updateContent('autoplay', ($event.target as HTMLInputElement).checked)"
          >
          Lecture automatique
        </label>
      </div>
      <div class="option-group">
        <label class="option-label checkbox-label">
          <input
            type="checkbox"
            :checked="widget.content.muted"
            @change="updateContent('muted', ($event.target as HTMLInputElement).checked)"
          >
          Son coupé
        </label>
      </div>
      <div class="option-group">
        <label class="option-label checkbox-label">
          <input
            type="checkbox"
            :checked="widget.content.loop"
            @change="updateContent('loop', ($event.target as HTMLInputElement).checked)"
          >
          Boucle
        </label>
      </div>
      <div class="option-group">
        <label class="option-label checkbox-label">
          <input
            type="checkbox"
            :checked="widget.content.controls !== false"
            @change="updateContent('controls', ($event.target as HTMLInputElement).checked)"
          >
          Afficher les contrôles
        </label>
      </div>
    </template>

    <!-- Map Widget -->
    <template v-else-if="widget.type === 'map'">
      <div class="option-group">
        <label class="option-label">Adresse *</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.address"
          placeholder="123 rue Example, Paris"
          @input="updateContent('address', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Zoom (1-20)</label>
        <input
          type="range"
          min="1"
          max="20"
          :value="widget.content.zoom || 15"
          @input="updateContent('zoom', parseInt(($event.target as HTMLInputElement).value))"
        >
        <span class="option-value">{{ widget.content.zoom || 15 }}</span>
      </div>
      <div class="option-group">
        <label class="option-label">Style de carte</label>
        <select
          class="option-select"
          :value="widget.content.mapStyle"
          @change="updateContent('mapStyle', ($event.target as HTMLSelectElement).value as 'roadmap' | 'satellite' | 'hybrid' | 'terrain')"
        >
          <option value="roadmap">
            Plan
          </option>
          <option value="satellite">
            Satellite
          </option>
          <option value="hybrid">
            Hybride
          </option>
          <option value="terrain">
            Terrain
          </option>
        </select>
      </div>
    </template>

    <!-- Social Widget -->
    <template v-else-if="widget.type === 'social'">
      <div class="option-group">
        <label class="option-label">Style d'affichage</label>
        <select
          class="option-select"
          :value="widget.content.socialStyle"
          @change="updateContent('socialStyle', ($event.target as HTMLSelectElement).value as 'icons' | 'buttons' | 'pills')"
        >
          <option value="icons">
            Icônes rondes
          </option>
          <option value="pills">
            Pilules
          </option>
          <option value="buttons">
            Boutons
          </option>
        </select>
      </div>
      <div class="option-group">
        <label class="option-label">Taille</label>
        <select
          class="option-select"
          :value="widget.content.socialSize"
          @change="updateContent('socialSize', ($event.target as HTMLSelectElement).value as 'small' | 'medium' | 'large')"
        >
          <option value="small">
            Petit
          </option>
          <option value="medium">
            Moyen
          </option>
          <option value="large">
            Grand
          </option>
        </select>
      </div>
      <div class="social-links-editor">
        <label class="option-label">Réseaux sociaux</label>
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
            <span class="social-platform">{{ getSocialLabel(link.platform) }}</span>
          </label>
          <input
            v-if="link.enabled"
            type="text"
            class="option-input social-url"
            :value="link.url"
            :placeholder="getSocialPlaceholder(link.platform)"
            @input="updateSocialLink(index, 'url', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </template>

    <!-- Icon Widget -->
    <template v-else-if="widget.type === 'icon'">
      <div class="option-group">
        <label class="option-label">Icône (emoji)</label>
        <div class="icon-picker">
          <input
            type="text"
            class="option-input icon-input"
            :value="widget.content.iconName"
            placeholder="⭐"
            @input="updateContent('iconName', ($event.target as HTMLInputElement).value)"
          >
          <div class="icon-suggestions">
            <button
              v-for="emoji in popularEmojis"
              :key="emoji"
              type="button"
              class="emoji-btn"
              @click="updateContent('iconName', emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>
      <div class="option-group">
        <label class="option-label">Taille</label>
        <select
          class="option-select"
          :value="widget.content.iconSize"
          @change="updateContent('iconSize', ($event.target as HTMLSelectElement).value)"
        >
          <option value="24px">
            Petit (24px)
          </option>
          <option value="36px">
            Moyen (36px)
          </option>
          <option value="48px">
            Grand (48px)
          </option>
          <option value="64px">
            Très grand (64px)
          </option>
          <option value="96px">
            Énorme (96px)
          </option>
        </select>
      </div>
      <div class="option-group">
        <label class="option-label">Lien (optionnel)</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.href"
          placeholder="https://..."
          @input="updateContent('href', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </template>

    <!-- Barcode Widget -->
    <template v-else-if="widget.type === 'barcode'">
      <div class="option-group">
        <label class="option-label">Type de code barre</label>
        <select
          class="option-select"
          :value="widget.content.barcodeType"
          @change="updateContent('barcodeType', ($event.target as HTMLSelectElement).value as 'ean13' | 'ean8')"
        >
          <option value="ean13">
            EAN-13 (13 chiffres)
          </option>
          <option value="ean8">
            EAN-8 (8 chiffres)
          </option>
        </select>
      </div>
      <div class="option-group">
        <label class="option-label">Code *</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.barcodeCode"
          :placeholder="widget.content.barcodeType === 'ean8' ? '12345678' : '1234567890123'"
          @input="updateContent('barcodeCode', ($event.target as HTMLInputElement).value)"
        >
        <span class="option-hint">
          {{ widget.content.barcodeType === 'ean8' ? '7-8 chiffres pour EAN-8' : '12-13 chiffres pour EAN-13' }}
          (le checksum est calculé automatiquement)
        </span>
      </div>
      <div class="option-group">
        <label class="option-label">Variable (optionnel)</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.barcodeVariable"
          placeholder="${barcode}"
          @input="updateContent('barcodeVariable', ($event.target as HTMLInputElement).value)"
        >
        <span class="option-hint">
          Utiliser une variable comme ${barcode} pour un code dynamique
        </span>
      </div>
      <div class="option-group">
        <label class="option-label">Couleur</label>
        <div class="color-input-row">
          <input
            type="color"
            class="color-picker"
            :value="widget.content.barcodeColor || '#000000'"
            @input="updateContent('barcodeColor', ($event.target as HTMLInputElement).value)"
          >
          <input
            type="text"
            class="option-input color-text"
            :value="widget.content.barcodeColor || '#000000'"
            placeholder="#000000"
            @input="updateContent('barcodeColor', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </template>

    <!-- Store Locator Widget -->
    <template v-else-if="widget.type === 'store-locator'">
      <div class="option-group">
        <label class="option-label">Titre</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.storeLocatorLabel"
          placeholder="Nos magasins"
          @input="updateContent('storeLocatorLabel', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Texte du bouton</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.storeLocatorButtonText"
          placeholder="Voir tous les lieux"
          @input="updateContent('storeLocatorButtonText', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Couleur du bouton</label>
        <div class="color-input-row">
          <input
            type="color"
            class="color-picker"
            :value="widget.content.storeLocatorButtonColor || '#14b8a6'"
            @input="updateContent('storeLocatorButtonColor', ($event.target as HTMLInputElement).value)"
          >
          <input
            type="text"
            class="option-input color-text"
            :value="widget.content.storeLocatorButtonColor || '#14b8a6'"
            placeholder="#14b8a6"
            @input="updateContent('storeLocatorButtonColor', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
      <div class="option-group">
        <label class="option-label">Lieux ({{ (widget.content.storeLocatorStores || []).length }})</label>
        <div class="stores-editor">
          <div
            v-for="(store, index) in (widget.content.storeLocatorStores || [])"
            :key="index"
            class="store-edit-item"
          >
            <div class="store-edit-header">
              <span class="store-edit-name">{{ store.name || `Lieu ${index + 1}` }}</span>
              <button
                type="button"
                class="store-remove-btn"
                @click="removeStore(index)"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              class="option-input"
              :value="store.name"
              placeholder="Nom du lieu *"
              @input="updateStore(index, 'name', ($event.target as HTMLInputElement).value)"
            >
            <input
              type="text"
              class="option-input"
              :value="store.address"
              placeholder="Adresse *"
              @input="updateStore(index, 'address', ($event.target as HTMLInputElement).value)"
            >
            <div class="store-coords">
              <input
                type="number"
                step="any"
                class="option-input"
                :value="store.latitude"
                placeholder="Latitude *"
                @input="updateStore(index, 'latitude', parseFloat(($event.target as HTMLInputElement).value))"
              >
              <input
                type="number"
                step="any"
                class="option-input"
                :value="store.longitude"
                placeholder="Longitude *"
                @input="updateStore(index, 'longitude', parseFloat(($event.target as HTMLInputElement).value))"
              >
            </div>
            <input
              type="tel"
              class="option-input"
              :value="store.phone"
              placeholder="Téléphone (optionnel)"
              @input="updateStore(index, 'phone', ($event.target as HTMLInputElement).value)"
            >
          </div>
          <button
            type="button"
            class="add-store-btn"
            @click="addStore"
          >
            + Ajouter un lieu
          </button>
        </div>
      </div>
    </template>

    <!-- Drive Widget -->
    <template v-else-if="widget.type === 'drive'">
      <div class="option-group">
        <label class="option-label">Texte du bouton</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.driveButtonText"
          placeholder="Trouver le magasin le plus proche"
          @input="updateContent('driveButtonText', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Couleur du bouton</label>
        <div class="color-input-row">
          <input
            type="color"
            class="color-picker"
            :value="widget.content.driveButtonColor || '#14b8a6'"
            @input="updateContent('driveButtonColor', ($event.target as HTMLInputElement).value)"
          >
          <input
            type="text"
            class="option-input color-text"
            :value="widget.content.driveButtonColor || '#14b8a6'"
            @input="updateContent('driveButtonColor', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
      <div class="option-group">
        <label class="option-label">Bouton "S'y rendre"</label>
        <div class="inline-options">
          <input
            type="text"
            class="option-input"
            :value="widget.content.driveBtnGoLabel"
            placeholder="S'y rendre"
            @input="updateContent('driveBtnGoLabel', ($event.target as HTMLInputElement).value)"
          >
          <input
            type="color"
            class="color-picker small"
            :value="widget.content.driveBtnGoColor || '#14b8a6'"
            @input="updateContent('driveBtnGoColor', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
      <div class="option-group">
        <label class="option-label">Bouton "Appeler"</label>
        <div class="inline-options">
          <input
            type="text"
            class="option-input"
            :value="widget.content.driveBtnCallLabel"
            placeholder="Appeler"
            @input="updateContent('driveBtnCallLabel', ($event.target as HTMLInputElement).value)"
          >
          <input
            type="color"
            class="color-picker small"
            :value="widget.content.driveBtnCallColor || '#6366f1'"
            @input="updateContent('driveBtnCallColor', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
      <div class="option-group">
        <label class="option-label">Magasins ({{ (widget.content.driveStores || []).length }})</label>
        <div class="stores-editor">
          <div
            v-for="(store, index) in (widget.content.driveStores || [])"
            :key="index"
            class="store-edit-item"
          >
            <div class="store-edit-header">
              <span class="store-edit-name">{{ store.name || `Magasin ${index + 1}` }}</span>
              <button type="button" class="store-remove-btn" @click="removeDriveStore(index)">
                ✕
              </button>
            </div>
            <input type="text" class="option-input" :value="store.name" placeholder="Nom *" @input="updateDriveStore(index, 'name', ($event.target as HTMLInputElement).value)">
            <input type="text" class="option-input" :value="store.address" placeholder="Adresse *" @input="updateDriveStore(index, 'address', ($event.target as HTMLInputElement).value)">
            <div class="store-coords">
              <input type="number" step="any" class="option-input" :value="store.latitude" placeholder="Lat *" @input="updateDriveStore(index, 'latitude', parseFloat(($event.target as HTMLInputElement).value))">
              <input type="number" step="any" class="option-input" :value="store.longitude" placeholder="Lng *" @input="updateDriveStore(index, 'longitude', parseFloat(($event.target as HTMLInputElement).value))">
            </div>
            <input type="tel" class="option-input" :value="store.phone" placeholder="Téléphone" @input="updateDriveStore(index, 'phone', ($event.target as HTMLInputElement).value)">
            <input type="text" class="option-input" :value="store.openingHours" placeholder="Horaires" @input="updateDriveStore(index, 'openingHours', ($event.target as HTMLInputElement).value)">
          </div>
          <button type="button" class="add-store-btn" @click="addDriveStore">
            + Ajouter un magasin
          </button>
        </div>
      </div>
    </template>

    <!-- Scratch Widget -->
    <template v-else-if="widget.type === 'scratch'">
      <div class="option-group">
        <label class="option-label">Image du dessus (à gratter) *</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.scratchImageFg"
          placeholder="https://..."
          @input="updateContent('scratchImageFg', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Image du dessous (révélée) *</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.scratchImageBg"
          placeholder="https://..."
          @input="updateContent('scratchImageBg', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Taille de la pièce (px)</label>
        <input
          type="range"
          min="10"
          max="100"
          :value="widget.content.scratchSize || 30"
          @input="updateContent('scratchSize', parseInt(($event.target as HTMLInputElement).value))"
        >
        <span class="option-value">{{ widget.content.scratchSize || 30 }}px</span>
      </div>
      <div class="option-group">
        <label class="option-label">Pourcentage à gratter (%)</label>
        <input
          type="range"
          min="30"
          max="100"
          :value="widget.content.scratchPercent || 80"
          @input="updateContent('scratchPercent', parseInt(($event.target as HTMLInputElement).value))"
        >
        <span class="option-value">{{ widget.content.scratchPercent || 80 }}%</span>
      </div>
      <div class="option-group">
        <label class="option-label">Lien de destination</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.scratchLink"
          placeholder="https://..."
          @input="updateContent('scratchLink', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </template>

    <!-- Flipcard Widget -->
    <template v-else-if="widget.type === 'flipcard'">
      <div class="option-group">
        <label class="option-label">Image recto (avant) *</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.flipcardImageFront"
          placeholder="https://..."
          @input="updateContent('flipcardImageFront', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Image verso (après) *</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.flipcardImageBack"
          placeholder="https://..."
          @input="updateContent('flipcardImageBack', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Lien de destination</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.flipcardLink"
          placeholder="https://..."
          @input="updateContent('flipcardLink', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </template>

    <!-- Gallery Widget -->
    <template v-else-if="widget.type === 'gallery'">
      <div class="option-group">
        <label class="option-label">Texte du bouton</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.galleryButtonText"
          placeholder="Voir la galerie"
          @input="updateContent('galleryButtonText', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Images ({{ (widget.content.galleryImages || []).length }})</label>
        <div class="images-editor">
          <div
            v-for="(image, index) in (widget.content.galleryImages || [])"
            :key="index"
            class="image-edit-item"
          >
            <div class="image-edit-header">
              <span class="image-edit-name">Image {{ index + 1 }}</span>
              <button type="button" class="store-remove-btn" @click="removeGalleryImage(index)">
                ✕
              </button>
            </div>
            <input type="url" class="option-input" :value="image.src" placeholder="URL de l'image *" @input="updateGalleryImage(index, 'src', ($event.target as HTMLInputElement).value)">
            <input type="text" class="option-input" :value="image.alt" placeholder="Texte alt" @input="updateGalleryImage(index, 'alt', ($event.target as HTMLInputElement).value)">
          </div>
          <button type="button" class="add-store-btn" @click="addGalleryImage">
            + Ajouter une image
          </button>
        </div>
      </div>
    </template>

    <!-- Slider Widget -->
    <template v-else-if="widget.type === 'slider'">
      <div class="option-group">
        <label class="option-label">Intervalle (ms)</label>
        <input
          type="number"
          class="option-input"
          :value="widget.content.sliderInterval"
          placeholder="3000"
          min="1000"
          step="500"
          @input="updateContent('sliderInterval', parseInt(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Couleur des chevrons</label>
        <div class="color-input-row">
          <input type="color" class="color-picker" :value="widget.content.sliderChevronColor || '#ffffff'" @input="updateContent('sliderChevronColor', ($event.target as HTMLInputElement).value)">
          <input type="text" class="option-input color-text" :value="widget.content.sliderChevronColor || '#ffffff'" @input="updateContent('sliderChevronColor', ($event.target as HTMLInputElement).value)">
        </div>
      </div>
      <div class="option-group">
        <label class="option-label checkbox-label">
          <input type="checkbox" :checked="widget.content.sliderAutoplay !== false" @change="updateContent('sliderAutoplay', ($event.target as HTMLInputElement).checked)">
          Lecture automatique
        </label>
      </div>
      <div class="option-group">
        <label class="option-label">Images ({{ (widget.content.sliderImages || []).length }})</label>
        <div class="images-editor">
          <div
            v-for="(image, index) in (widget.content.sliderImages || [])"
            :key="index"
            class="image-edit-item"
          >
            <div class="image-edit-header">
              <span class="image-edit-name">Slide {{ index + 1 }}</span>
              <button type="button" class="store-remove-btn" @click="removeSliderImage(index)">
                ✕
              </button>
            </div>
            <input type="url" class="option-input" :value="image.src" placeholder="URL de l'image *" @input="updateSliderImage(index, 'src', ($event.target as HTMLInputElement).value)">
            <input type="text" class="option-input" :value="image.alt" placeholder="Texte alt" @input="updateSliderImage(index, 'alt', ($event.target as HTMLInputElement).value)">
          </div>
          <button type="button" class="add-store-btn" @click="addSliderImage">
            + Ajouter une slide
          </button>
        </div>
      </div>
    </template>

    <!-- Link-Image Widget -->
    <template v-else-if="widget.type === 'link-image'">
      <div class="option-group">
        <label class="option-label">URL de l'image *</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.linkImageSrc"
          placeholder="https://..."
          @input="updateContent('linkImageSrc', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Texte alternatif</label>
        <input
          type="text"
          class="option-input"
          :value="widget.content.linkImageAlt"
          placeholder="Description de l'image"
          @input="updateContent('linkImageAlt', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="option-group">
        <label class="option-label">Lien de destination</label>
        <input
          type="url"
          class="option-input"
          :value="widget.content.linkImageHref"
          placeholder="https://..."
          @input="updateContent('linkImageHref', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </template>

    <!-- Effect Widget -->
    <template v-else-if="widget.type === 'effect'">
      <div class="option-group">
        <label class="option-label">Particule (emoji)</label>
        <div class="icon-picker">
          <input
            type="text"
            class="option-input icon-input"
            :value="widget.content.effectImage"
            placeholder="❄️"
            @input="updateContent('effectImage', ($event.target as HTMLInputElement).value)"
          >
          <div class="icon-suggestions">
            <button
              v-for="emoji in effectEmojis"
              :key="emoji"
              type="button"
              class="emoji-btn"
              @click="updateContent('effectImage', emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>
      <div class="option-group">
        <label class="option-label">Taille (px)</label>
        <input type="range" min="10" max="60" :value="widget.content.effectSize || 20" @input="updateContent('effectSize', parseInt(($event.target as HTMLInputElement).value))">
        <span class="option-value">{{ widget.content.effectSize || 20 }}px</span>
      </div>
      <div class="option-group">
        <label class="option-label">Nombre de particules</label>
        <input type="range" min="10" max="100" :value="widget.content.effectNbItems || 50" @input="updateContent('effectNbItems', parseInt(($event.target as HTMLInputElement).value))">
        <span class="option-value">{{ widget.content.effectNbItems || 50 }}</span>
      </div>
      <div class="option-group">
        <label class="option-label">Vitesse (%)</label>
        <input type="range" min="10" max="100" :value="widget.content.effectSpeed || 50" @input="updateContent('effectSpeed', parseInt(($event.target as HTMLInputElement).value))">
        <span class="option-value">{{ widget.content.effectSpeed || 50 }}%</span>
      </div>
      <div class="option-group">
        <label class="option-label">Direction</label>
        <select
          class="option-select"
          :value="widget.content.effectDirection || 'down'"
          @change="updateContent('effectDirection', ($event.target as HTMLSelectElement).value as 'down' | 'up')"
        >
          <option value="down">
            Vers le bas
          </option>
          <option value="up">
            Vers le haut
          </option>
        </select>
      </div>
    </template>

    <p class="required-hint">
      * champs obligatoires
    </p>
  </div>
</template>

<style scoped>
.content-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Images editor (gallery/slider) */
.images-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-edit-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.image-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.image-edit-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.option-label.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.option-label.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.option-input,
.option-textarea,
.option-select {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--color-surface);
  transition: border-color 0.2s;
}

.option-input:focus,
.option-textarea:focus,
.option-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.option-textarea {
  resize: vertical;
  min-height: 100px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-range {
  flex: 1;
  cursor: pointer;
}

.range-value {
  font-size: 13px;
  color: var(--color-text-muted);
  min-width: 50px;
}

.option-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
}

.required-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 8px;
}

/* Social links editor */
.social-links-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.social-link-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--color-background);
  border-radius: 6px;
}

.social-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.social-checkbox input {
  width: 16px;
  height: 16px;
}

.social-platform {
  font-size: 13px;
  font-weight: 500;
}

.social-url {
  margin-top: 4px;
}

/* Icon picker */
.icon-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-input {
  font-size: 24px;
  text-align: center;
  padding: 12px;
}

.icon-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.emoji-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-background);
  transform: scale(1.1);
}

/* Range value display */
.option-value {
  font-size: 12px;
  color: var(--color-text-muted);
  min-width: 30px;
  text-align: right;
}

/* Color input */
.color-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-picker {
  width: 48px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
}

.color-text {
  flex: 1;
  font-family: monospace;
}

/* Store locator editor */
.stores-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.store-edit-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.store-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.store-edit-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.store-remove-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
}

.store-remove-btn:hover {
  background: #fecaca;
}

.store-coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.add-store-btn {
  padding: 10px;
  border: 2px dashed var(--color-border);
  background: transparent;
  border-radius: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.add-store-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Inline options (label + color) */
.inline-options {
  display: flex;
  gap: 8px;
  align-items: center;
}

.inline-options .option-input {
  flex: 1;
}

.color-picker.small {
  width: 36px;
  height: 36px;
}
</style>
