<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  showFrame?: boolean
  device?: PreviewDevice
}>(), {
  showFrame: true,
  device: 'mobile',
})

// Device configurations
const DEVICE_CONFIG = {
  mobile: {
    aspectRatio: '393 / 852',
    borderRadius: '54px',
    bezelRadius: '46px',
    screenRadius: '44px',
    showNotch: true,
    showHomeIndicator: true,
    statusBarHeight: '48px',
    contentPaddingTop: '50px',
  },
  tablet: {
    aspectRatio: '820 / 1180',
    borderRadius: '24px',
    bezelRadius: '20px',
    screenRadius: '18px',
    showNotch: false,
    showHomeIndicator: true,
    statusBarHeight: '32px',
    contentPaddingTop: '36px',
  },
  desktop: {
    aspectRatio: '16 / 10',
    borderRadius: '12px',
    bezelRadius: '8px',
    screenRadius: '0px',
    showNotch: false,
    showHomeIndicator: false,
    statusBarHeight: '0px',
    contentPaddingTop: '0px',
  },
} as const

const config = computed(() => DEVICE_CONFIG[props.device])

const frameStyles = computed(() => ({
  '--aspect-ratio': config.value.aspectRatio,
  '--border-radius': config.value.borderRadius,
  '--bezel-radius': config.value.bezelRadius,
  '--screen-radius': config.value.screenRadius,
  '--status-bar-height': config.value.statusBarHeight,
  '--content-padding-top': config.value.contentPaddingTop,
}))

function formatTime() {
  return new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const time = ref(formatTime())
let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  interval = setInterval(() => {
    time.value = formatTime()
  }, 60000)
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})
</script>

<template>
  <div class="mobile-frame-container">
    <div
      class="smartphone-frame"
      :class="[
        { 'with-frame': showFrame },
        `device-${device}`,
      ]"
      :style="frameStyles"
    >
      <template v-if="showFrame">
        <div class="smartphone-bezel">
          <div class="smartphone-screen">
            <!-- Status Bar (mobile/tablet only) -->
            <header v-if="device !== 'desktop'" class="status-bar">
              <div class="time">
                {{ time }}
              </div>
              <div v-if="config.showNotch" class="notch-area" />
              <div class="status-icons">
                <!-- Signal -->
                <svg class="status-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M2 22h2V12H2v10zm4 0h2V8H6v14zm4 0h2V4h-2v18zm4 0h2V8h-2v14zm4 0h2V12h-2v10z" />
                </svg>
                <!-- WiFi -->
                <svg class="status-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                </svg>
                <!-- Battery -->
                <svg class="status-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
                </svg>
              </div>
            </header>

            <!-- Contenu -->
            <div class="app-content">
              <slot />
            </div>

            <!-- Home Indicator (mobile/tablet) -->
            <div v-if="config.showHomeIndicator" class="home-indicator" />
          </div>
        </div>
      </template>

      <!-- Mode sans frame -->
      <template v-else>
        <div class="frame-content-simple">
          <slot />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.mobile-frame-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

/* --- SMARTPHONE FRAME --- */
.smartphone-frame {
  position: relative;
  height: 100%;
  max-height: 100%;
  aspect-ratio: var(--aspect-ratio, 393 / 852);
  background: linear-gradient(135deg, #4a4a4a 0%, #2c2c2e 50%, #1c1c1e 100%);
  border-radius: var(--border-radius, 54px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 0 0 1px #1c1c1e,
    0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 8px;
  box-sizing: border-box;
  user-select: none;
  transition: all 0.3s ease;
}

.smartphone-frame:not(.with-frame) {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  aspect-ratio: auto;
  width: 100%;
}

/* Desktop specific styling */
.smartphone-frame.device-desktop {
  background: linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 50%, #c4c4c4 100%);
  padding: 4px;
  max-width: 100%;
}

.smartphone-bezel {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: var(--bezel-radius, 46px);
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 0 2px #000;
  transition: border-radius 0.3s ease;
}

.device-desktop .smartphone-bezel {
  background: #333;
  box-shadow: none;
}

.smartphone-screen {
  width: 100%;
  height: 100%;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  border-radius: var(--screen-radius, 44px);
  transition: border-radius 0.3s ease;
}

.status-bar {
  height: var(--status-bar-height, 48px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 600;
  color: #000;
  z-index: 20;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  transition: height 0.3s ease;
}

.device-tablet .status-bar {
  padding: 0 16px;
  font-size: 12px;
}

.status-bar .time {
  width: 40px;
  text-align: center;
}

.status-bar .status-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-bar .status-icon {
  width: 14px;
  height: 14px;
}

.device-tablet .status-bar .status-icon {
  width: 12px;
  height: 12px;
}

.notch-area {
  position: absolute;
  top: 11px;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 26px;
  background: #000;
  border-radius: 20px;
  z-index: 30;
}

.notch-area::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 8px;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
}

.app-content {
  flex: 1;
  background: #f5f5f7;
  padding-top: var(--content-padding-top, 50px);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  -ms-overflow-style: none;
  scrollbar-width: none;
  transition: padding-top 0.3s ease;
}

.app-content::-webkit-scrollbar {
  display: none;
}

.home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 4px;
  background: #000;
  border-radius: 100px;
  opacity: 0.8;
  z-index: 100;
}

.device-tablet .home-indicator {
  width: 140px;
  bottom: 6px;
}

/* Mode sans frame */
.frame-content-simple {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--color-surface);
}
</style>
