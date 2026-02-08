<script setup lang="ts">
import { AlertTriangle, BarChart3, ScanBarcode } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const barcodeImageSrc = ref<string>('')
const isLoading = ref(false)
const errorMessage = ref('')

// Configuration
const BWIP_API_URL = 'https://bwipjs-api.metafloor.com'

// Calcul de la clé de contrôle EAN (checksum)
function calculateCheckDigit(code: string): string {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const char = code[i]
    if (char) {
      const digit = Number.parseInt(char, 10)
      sum += i % 2 === 0 ? digit : digit * 3
    }
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return code + checkDigit
}

// Nettoyage et formatage du code selon le type
function formatBarcodeCode(code: string, type: 'ean13' | 'ean8'): string {
  // Nettoyer le code (garder seulement les chiffres)
  const cleanCode = code.replace(/\D/g, '')

  if (type === 'ean13') {
    // EAN-13 : 12 chiffres + 1 checksum = 13
    if (cleanCode.length <= 12) {
      const padded = cleanCode.padStart(12, '0')
      return calculateCheckDigit(padded)
    }
    else {
      const truncated = cleanCode.substring(0, 12)
      return calculateCheckDigit(truncated)
    }
  }
  else {
    // EAN-8 : 7 chiffres + 1 checksum = 8
    if (cleanCode.length <= 7) {
      const padded = cleanCode.padStart(7, '0')
      return calculateCheckDigit(padded)
    }
    else {
      const truncated = cleanCode.substring(0, 7)
      return calculateCheckDigit(truncated)
    }
  }
}

// Génération de l'URL pour l'API BWIP
function generateBarcodeUrl(code: string, color: string, type: 'ean13' | 'ean8'): string {
  const formattedCode = formatBarcodeCode(code, type)
  const cleanColor = color.replace('#', '')

  const params = new URLSearchParams({
    bcid: type,
    text: formattedCode,
    barcolor: cleanColor,
    textcolor: cleanColor,
    includetext: 'true',
    scaleX: '2',
    scaleY: '1',
    textyalign: 'below',
  })

  return `${BWIP_API_URL}?${params.toString()}`
}

// Vérifie si le code contient une variable (${...})
const hasVariable = computed(() => {
  const code = props.widget.content.barcodeCode || ''
  return /\$\{[^}]+\}/.test(code)
})

// Génération du code barre
async function generateBarcode() {
  const code = props.widget.content.barcodeCode || '0000000000000'
  const color = props.widget.content.barcodeColor || '#000000'
  const type = props.widget.content.barcodeType || 'ean13'

  // Ne pas générer si c'est une variable
  if (hasVariable.value) {
    barcodeImageSrc.value = ''
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const url = generateBarcodeUrl(code, color, type)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Erreur lors de la génération du code barre')
    }

    const blob = await response.blob()
    const reader = new FileReader()

    reader.onloadend = () => {
      barcodeImageSrc.value = reader.result as string
      isLoading.value = false
    }

    reader.onerror = () => {
      errorMessage.value = 'Erreur de lecture de l\'image'
      isLoading.value = false
    }

    reader.readAsDataURL(blob)
  }
  catch (error) {
    errorMessage.value = 'Impossible de générer le code barre'
    isLoading.value = false
    console.error('Erreur génération code barre:', error)
  }
}

// Réagir aux changements de contenu
watch(
  () => [
    props.widget.content.barcodeCode,
    props.widget.content.barcodeColor,
    props.widget.content.barcodeType,
  ],
  () => {
    generateBarcode()
  },
  { deep: true },
)

// Générer au montage
onMounted(() => {
  generateBarcode()
})

const barcodeTypeLabel = computed(() => {
  return props.widget.content.barcodeType === 'ean8' ? 'EAN-8' : 'EAN-13'
})
</script>

<template>
  <div
    class="barcode-widget"
    :style="{
      padding: widget.styles.padding,
      margin: widget.styles.margin,
      textAlign: widget.styles.textAlign,
    }"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="barcode-loading">
      <div class="loading-spinner" />
      <span>Génération...</span>
    </div>

    <!-- Variable placeholder -->
    <div v-else-if="hasVariable" class="barcode-variable">
      <div class="variable-icon">
        <BarChart3 :size="32" />
      </div>
      <p class="variable-code">
        {{ widget.content.barcodeCode }}
      </p>
      <p class="variable-hint">
        Variable dynamique - Le code barre sera généré lors du rendu
      </p>
    </div>

    <!-- Erreur -->
    <div v-else-if="errorMessage" class="barcode-error">
      <div class="error-icon">
        <AlertTriangle :size="32" />
      </div>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Code barre généré -->
    <div v-else-if="barcodeImageSrc" class="barcode-container">
      <div class="barcode-type-badge">
        {{ barcodeTypeLabel }}
      </div>
      <img
        :src="barcodeImageSrc"
        :alt="`Code barre ${widget.content.barcodeCode}`"
        class="barcode-image"
      >
    </div>

    <!-- Placeholder -->
    <div v-else class="barcode-placeholder">
      <div class="placeholder-icon">
        <ScanBarcode :size="48" />
      </div>
      <p class="placeholder-text">
        Ajouter un code-barres
      </p>
      <p class="placeholder-hint">
        Entrez un code EAN-13 ou EAN-8
      </p>
    </div>
  </div>
</template>

<style scoped>
.barcode-widget {
}

.barcode-container {
  position: relative;
  display: inline-block;
  background: white;
  padding: 16px;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.barcode-type-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #14b8a6;
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 600;
}

.barcode-image {
  display: block;
  max-width: 100%;
  height: auto;
}

.barcode-placeholder,
.barcode-error,
.barcode-variable {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  min-height: 120px;
  text-align: center;
}

.placeholder-icon,
.variable-icon {
  color: #64748b;
  margin-bottom: 8px;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 8px;
}

.placeholder-text,
.variable-code {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.placeholder-hint,
.variable-hint {
  color: #64748b;
  font-size: 12px;
  margin: 0;
}

.variable-code {
  font-family: monospace;
  background: #e2e8f0;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  margin: 8px 0;
}

.barcode-error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #fca5a5;
}

.barcode-error p {
  color: #dc2626;
  font-size: 13px;
  margin: 0;
}

.barcode-variable {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #86efac;
}

.barcode-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  min-height: 120px;
  color: #64748b;
  font-size: 13px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: #14b8a6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
