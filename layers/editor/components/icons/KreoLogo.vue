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
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs v-if="useGradient">
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#14B8A6" />
        <stop offset="100%" stop-color="#5EEAD4" />
      </linearGradient>
    </defs>
    <!-- Vertical bar -->
    <path
      d="M10 8 L10 32"
      :stroke="useGradient ? '#14B8A6' : color"
      stroke-width="4"
      stroke-linecap="round"
    />
    <!-- Upper diagonal curve -->
    <path
      d="M10 20 Q18 20 26 11"
      :stroke="useGradient ? `url(#${gradientId})` : color"
      stroke-width="4"
      stroke-linecap="round"
      fill="none"
    />
    <!-- Lower diagonal curve -->
    <path
      d="M10 20 Q18 20 26 29"
      :stroke="useGradient ? '#0D9488' : color"
      stroke-width="4"
      stroke-linecap="round"
      fill="none"
    />
    <!-- Connection points -->
    <circle cx="26" cy="11" r="3.5" :fill="useGradient ? '#5EEAD4' : color" />
    <circle cx="26" cy="29" r="3.5" :fill="useGradient ? '#5EEAD4' : color" />
  </svg>
</template>
