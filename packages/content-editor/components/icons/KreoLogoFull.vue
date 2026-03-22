<script setup lang="ts">
interface Props {
  size?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 48,
  color: 'currentColor',
})

const gradientId = useId()
const useGradient = computed(() => props.color === 'currentColor')

// Width is ~3.25x the height to accommodate "Kreo"
const width = computed(() => props.size * 3.25)
</script>

<template>
  <svg
    :width="width"
    :height="size"
    viewBox="0 0 130 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs v-if="useGradient">
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#14B8A6" />
        <stop offset="100%" stop-color="#5EEAD4" />
      </linearGradient>
    </defs>

    <!-- K: Vertical bar -->
    <path
      d="M10 8 L10 32"
      :stroke="useGradient ? '#14B8A6' : color"
      stroke-width="4"
      stroke-linecap="round"
    />
    <!-- K: Upper diagonal curve -->
    <path
      d="M10 20 Q18 20 26 11"
      :stroke="useGradient ? `url(#${gradientId})` : color"
      stroke-width="4"
      stroke-linecap="round"
      fill="none"
    />
    <!-- K: Lower diagonal curve -->
    <path
      d="M10 20 Q18 20 26 29"
      :stroke="useGradient ? '#0D9488' : color"
      stroke-width="4"
      stroke-linecap="round"
      fill="none"
    />
    <!-- K: Connection points -->
    <circle cx="26" cy="11" r="3.5" :fill="useGradient ? '#5EEAD4' : color" />
    <circle cx="26" cy="29" r="3.5" :fill="useGradient ? '#5EEAD4' : color" />

    <!-- r: Vertical bar -->
    <path
      d="M42 16 L42 32"
      :stroke="useGradient ? '#14B8A6' : color"
      stroke-width="4"
      stroke-linecap="round"
    />
    <!-- r: Top curve -->
    <path
      d="M42 18 Q42 12 50 12"
      :stroke="useGradient ? '#14B8A6' : color"
      stroke-width="4"
      stroke-linecap="round"
      fill="none"
    />

    <!-- e: Arc (270°) -->
    <path
      d="M76 22 A8 8 0 1 0 68 30"
      :stroke="useGradient ? '#0D9488' : color"
      stroke-width="4"
      stroke-linecap="round"
      fill="none"
    />
    <!-- e: Middle bar -->
    <path
      d="M60 22 L76 22"
      :stroke="useGradient ? '#0D9488' : color"
      stroke-width="4"
      stroke-linecap="round"
    />

    <!-- o: Circle -->
    <circle
      cx="98"
      cy="22"
      r="10"
      :stroke="useGradient ? `url(#${gradientId})` : color"
      stroke-width="4"
      fill="none"
    />
  </svg>
</template>
