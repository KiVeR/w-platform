<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  text: string
}>()

const store = useVariableSchemaStore()
const { findUndefinedVariables } = useVariables()

const undefinedVars = computed(() =>
  findUndefinedVariables(props.text, store.variableNames),
)

const hasWarning = computed(() => undefinedVars.value.length > 0)
</script>

<template>
  <div v-if="hasWarning" class="variable-validation-banner" role="alert">
    <AlertTriangle :size="14" class="banner-icon" />
    <span class="banner-text">
      Variable{{ undefinedVars.length > 1 ? 's' : '' }} non définie{{ undefinedVars.length > 1 ? 's' : '' }} :
      <strong>{{ undefinedVars.join(', ') }}</strong>
    </span>
  </div>
</template>

<style scoped>
.variable-validation-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius-md, 6px);
  font-size: 12px;
  color: #92400e;
}

.banner-icon {
  flex-shrink: 0;
  color: #d97706;
}

.banner-text {
  line-height: 1.4;
}
</style>
