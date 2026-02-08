<script setup lang="ts">
const uiStore = useUIStore()
const selectionStore = useSelectionStore()
</script>

<template>
  <div class="options-panel">
    <ContentOptions
      v-if="uiStore.activeTab === 'content' && selectionStore.selectedWidget"
      :widget="selectionStore.selectedWidget"
    />
    <StyleOptions
      v-else-if="uiStore.activeTab === 'style' && selectionStore.selectedWidget"
      :widget="selectionStore.selectedWidget"
    />
    <div v-else class="no-selection">
      <p>Sélectionnez un widget pour modifier ses options</p>
    </div>
  </div>
</template>

<style scoped>
.options-panel {
  width: 100%;
}

.no-selection {
  text-align: center;
  color: var(--color-text-muted);
  padding: 40px 20px;
}
</style>
