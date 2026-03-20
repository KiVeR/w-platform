<script setup lang="ts">
import OptionCheckbox from '../shared/OptionCheckbox.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionInputWithVariables from '../shared/OptionInputWithVariables.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Message de succès">
      <OptionInputWithVariables
        :model-value="widget.content.successMessage"
        placeholder="Merci ! Votre message a été envoyé."
        @update:model-value="updateContent('successMessage', $event)"
      />
    </OptionGroup>

    <OptionGroup label="URL de redirection">
      <OptionInput
        :model-value="widget.content.redirectUrl"
        type="url"
        placeholder="https://exemple.com/merci"
        @update:model-value="updateContent('redirectUrl', $event)"
      />
    </OptionGroup>

    <OptionCheckbox
      :model-value="widget.content.emailNotify"
      label="Envoyer une notification par email"
      @update:model-value="updateContent('emailNotify', $event)"
    />

    <template v-if="widget.content.emailNotify">
      <OptionGroup label="Email destinataire">
        <OptionInput
          :model-value="widget.content.emailTo"
          type="email"
          placeholder="contact@exemple.com"
          @update:model-value="updateContent('emailTo', $event)"
        />
      </OptionGroup>

      <OptionGroup label="Sujet de l'email">
        <OptionInput
          :model-value="widget.content.emailSubject"
          placeholder="Nouveau message"
          @update:model-value="updateContent('emailSubject', $event)"
        />
      </OptionGroup>
    </template>
  </div>
</template>

<style scoped>
.options-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
