<script setup lang="ts">
import type { Widget } from '../../types/widget'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const effectImage = computed(() => props.widget.content.effectImage || '❄️')
const effectSize = computed(() => props.widget.content.effectSize || 20)
const effectNbItems = computed(() => props.widget.content.effectNbItems || 50)
const effectSpeed = computed(() => props.widget.content.effectSpeed || 50)
const effectDirection = computed(() => props.widget.content.effectDirection || 'down')

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

const particles = ref<Particle[]>([])
let animationFrame: number | null = null

function createParticles() {
  const count = Math.min(effectNbItems.value, 100)
  particles.value = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: effectSize.value * (0.5 + Math.random() * 0.5),
    speed: (effectSpeed.value / 100) * (0.5 + Math.random() * 0.5),
    opacity: 0.5 + Math.random() * 0.5,
  }))
}

function animate() {
  particles.value = particles.value.map((p) => {
    let newY = effectDirection.value === 'down'
      ? p.y + p.speed
      : p.y - p.speed

    if (effectDirection.value === 'down' && newY > 100) {
      newY = -10
      p.x = Math.random() * 100
    }
    else if (effectDirection.value === 'up' && newY < -10) {
      newY = 100
      p.x = Math.random() * 100
    }

    return { ...p, y: newY }
  })

  animationFrame = requestAnimationFrame(animate)
}

function startAnimation() {
  createParticles()
  if (!animationFrame) {
    animate()
  }
}

function stopAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

watch([effectNbItems, effectSize, effectSpeed], () => {
  createParticles()
})

onMounted(() => {
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<template>
  <div
    class="effect-widget"
    :style="{
      margin: widget.styles.margin,
      height: widget.styles.height || '100px',
    }"
  >
    <!-- Config badge -->
    <div class="effect-badge">
      {{ effectImage }} Effet {{ effectDirection === 'up' ? '↑' : '↓' }}
    </div>

    <!-- Particules -->
    <div class="particles-container">
      <span
        v-for="particle in particles"
        :key="particle.id"
        class="particle"
        :style="{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          fontSize: `${particle.size}px`,
          opacity: particle.opacity,
        }"
      >
        {{ effectImage }}
      </span>
    </div>

    <!-- Info -->
    <div class="effect-info">
      <span>{{ effectNbItems }} particules</span>
      <span>Taille: {{ effectSize }}px</span>
      <span>Vitesse: {{ effectSpeed }}%</span>
    </div>
  </div>
</template>

<style scoped>
.effect-widget {
  position: relative;
  min-height: 80px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 12px;
  overflow: hidden;
}

.effect-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  color: #1e293b;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.particles-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  transform: translate(-50%, -50%);
  transition: top 0.05s linear;
}

.effect-info {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  gap: 12px;
  justify-content: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
