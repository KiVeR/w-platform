<script setup lang="ts">
import { History } from 'lucide-vue-next'

defineProps<{
  version: string
  date: string
  isLatest: boolean
}>()
</script>

<template>
  <div class="history-banner" :class="{ 'is-latest': isLatest }">
    <div class="banner-content">
      <History :size="16" />
      <span v-if="isLatest">
        Version actuelle (v{{ version }})
      </span>
      <span v-else>
        Aperçu de la version {{ version }} — {{ date }}
      </span>
    </div>

    <div v-if="!isLatest" class="banner-badge">
      Ancienne version
    </div>
  </div>
</template>

<style scoped>
.history-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: linear-gradient(135deg, #fbbf24 0%, var(--color-warning-500) 100%);
  color: #78350f;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-banner.is-latest {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  color: #064e3b;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.banner-badge {
  background: color-mix(in srgb, var(--color-surface) 30%, transparent);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
</style>
