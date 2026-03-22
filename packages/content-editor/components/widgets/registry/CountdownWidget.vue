<script setup lang="ts">
import { Timer } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { primaryColor, textColor } = useGlobalStyles()

const now = ref(Date.now())
let intervalId: ReturnType<typeof setInterval> | null = null

const targetDate = computed(() => {
  const dateStr = props.widget.content.targetDate
  if (!dateStr)
    return null
  return new Date(dateStr).getTime()
})

const isExpired = computed(() => {
  if (!targetDate.value)
    return false
  return now.value >= targetDate.value
})

const timeRemaining = computed(() => {
  if (!targetDate.value || isExpired.value) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const diff = targetDate.value - now.value
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
})

const label = computed(() => props.widget.content.label || 'Fin de l\'offre dans')
const expiredLabel = computed(() => props.widget.content.expiredLabel || 'Offre terminée')

const showDays = computed(() => props.widget.content.showDays !== false)
const showHours = computed(() => props.widget.content.showHours !== false)
const showMinutes = computed(() => props.widget.content.showMinutes !== false)
const showSeconds = computed(() => props.widget.content.showSeconds !== false)

const labelStyle = computed(() => ({
  color: props.widget.styles.color || textColor.value,
  fontSize: props.widget.styles.fontSize || '14px',
}))

const numberStyle = computed(() => ({
  color: primaryColor.value,
  fontSize: '32px',
  fontWeight: 'bold',
  lineHeight: '1',
}))

const unitStyle = computed(() => ({
  color: props.widget.styles.color || textColor.value,
  fontSize: '12px',
  textTransform: 'uppercase' as const,
}))

function padZero(num: number): string {
  return num.toString().padStart(2, '0')
}

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <div
    class="countdown-widget"
    :style="{
      textAlign: widget.styles.textAlign || 'center',
      margin: widget.styles.margin,
    }"
  >
    <!-- Placeholder when no date set -->
    <div v-if="!targetDate" class="countdown-placeholder">
      <Timer :size="32" class="placeholder-icon" />
      <span class="placeholder-text">Définir une date cible</span>
    </div>

    <!-- Expired state -->
    <div v-else-if="isExpired" class="countdown-expired">
      <span :style="labelStyle">{{ expiredLabel }}</span>
    </div>

    <!-- Active countdown -->
    <div v-else class="countdown-active">
      <div class="countdown-label" :style="labelStyle">
        {{ label }}
      </div>
      <div class="countdown-timer" role="timer" aria-live="polite" aria-atomic="true">
        <div v-if="showDays" class="countdown-unit">
          <span class="countdown-number" :style="numberStyle">{{ padZero(timeRemaining.days) }}</span>
          <span class="countdown-unit-label" :style="unitStyle">Jours</span>
        </div>
        <div v-if="showHours" class="countdown-unit">
          <span class="countdown-number" :style="numberStyle">{{ padZero(timeRemaining.hours) }}</span>
          <span class="countdown-unit-label" :style="unitStyle">Heures</span>
        </div>
        <div v-if="showMinutes" class="countdown-unit">
          <span class="countdown-number" :style="numberStyle">{{ padZero(timeRemaining.minutes) }}</span>
          <span class="countdown-unit-label" :style="unitStyle">Min</span>
        </div>
        <div v-if="showSeconds" class="countdown-unit">
          <span class="countdown-number" :style="numberStyle">{{ padZero(timeRemaining.seconds) }}</span>
          <span class="countdown-unit-label" :style="unitStyle">Sec</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.countdown-placeholder {
  width: 100%;
  min-height: 120px;
  background-color: var(--color-neutral-100);
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-400);
}

.placeholder-icon {
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 14px;
}

.countdown-expired {
  padding: 16px;
  text-align: center;
}

.countdown-active {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.countdown-label {
  margin-bottom: 12px;
}

.countdown-timer {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.countdown-number {
  font-variant-numeric: tabular-nums;
}

.countdown-unit-label {
  margin-top: 4px;
}
</style>
