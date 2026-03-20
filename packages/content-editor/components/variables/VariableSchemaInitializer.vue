<script setup lang="ts">
/**
 * Invisible component that handles variable schema initialization.
 * Must be a CHILD of the component that calls provideEditorConfig(),
 * because useVariableSchema() → useEditorApi() → useEditorConfig() → inject()
 * and inject() only looks at ancestor components, not the current one.
 */
const props = defineProps<{
  schemaUuid?: string
}>()

const contentStore = useContentStore()
const variableSchemaStore = useVariableSchemaStore()
const { initialize } = useVariableSchema()

// Initialize from prop (query param)
if (props.schemaUuid) {
  initialize({ schemaUuid: props.schemaUuid })
}

// Auto-load from DB when page sets variableSchemaUuid via setMetadata
watch(() => contentStore.variableSchemaUuid, (uuid) => {
  if (uuid && !props.schemaUuid) {
    initialize({ schemaUuid: uuid })
  }
  else if (!uuid && !props.schemaUuid) {
    variableSchemaStore.clearSchema()
  }
})
</script>

<template>
  <slot />
</template>
