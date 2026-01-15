<script setup lang="ts">
import { getWidgetsByCategory, widgetCategories } from '@/config/widgets'
import WidgetItem from './WidgetItem.vue'
</script>

<template>
  <div class="widget-palette">
    <div
      v-for="category in widgetCategories"
      :key="category.id"
      class="widget-category"
    >
      <h3 class="category-title">
        {{ category.label }}
      </h3>
      <div class="widget-grid">
        <WidgetItem
          v-for="config in getWidgetsByCategory(category.id)"
          :key="config.type"
          :config="config"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.widget-palette {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.widget-category {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin: 0;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--color-border);
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
</style>
