<script setup lang="ts">
import { computed } from 'vue'
import { useCampaignWizardStore } from '@/stores/campaignWizard'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const variables = [
  { key: 'shortUrl', token: '${shortUrl}', label: t('wizard.message.variables.shortUrl') },
  { key: 'prenom', token: '${prenom}', label: t('wizard.message.variables.prenom') },
  { key: 'nom', token: '${nom}', label: t('wizard.message.variables.nom') },
]

const smsLabels = computed(() => ({
  name: t('wizard.message.name'),
  namePlaceholder: t('wizard.message.namePlaceholder'),
  sender: t('wizard.message.sender'),
  senderPlaceholder: t('wizard.message.senderPlaceholder'),
  senderHelp: t('wizard.message.senderHelp'),
  messageLabel: t('wizard.message.messageLabel'),
  messagePlaceholder: t('wizard.message.messagePlaceholder'),
  insertVariable: t('wizard.message.insertVariable'),
  stopTitle: 'STOP SMS',
  stopDescription: t('wizard.message.stopInfo'),
  multiSmsWarning: t('wizard.message.multiSmsWarning', { count: 2 }),
  forbiddenDomain: t('wizard.message.forbiddenDomain'),
  charCount: t('wizard.message.charCount', { count: '{count}', max: '{max}' }),
  smsCount: t('wizard.message.smsCount', { count: '{count}' }),
  encoding: t('wizard.message.encoding', { encoding: '{encoding}' }),
  previewPlaceholder: t('wizard.message.previewEmpty'),
}))

const smsErrors = computed<SmsEditorErrors | undefined>(() => {
  if (!wizard.showValidation) return undefined
  const errors: SmsEditorErrors = {}
  if (wizard.campaign.name.trim().length === 0) {
    errors.name = t('wizard.validation.nameRequired')
  }
  if (wizard.campaign.message.trim().length === 0) {
    errors.message = t('wizard.validation.messageRequired')
  }
  else if (isForbiddenMessage(wizard.campaign.message)) {
    errors.message = t('wizard.validation.messageForbidden')
  }
  if (wizard.campaign.sender.trim().length === 0) {
    errors.sender = t('wizard.validation.senderRequired')
  }
  else if (!/^[a-zA-Z0-9 .\-']{3,11}$/.test(wizard.campaign.sender)) {
    errors.sender = t('wizard.validation.senderInvalid')
  }
  return Object.keys(errors).length > 0 ? errors : undefined
})

function onUpdateName(value: string) {
  wizard.campaign.name = value
  wizard.isDirty = true
}

function onUpdateSender(value: string) {
  wizard.campaign.sender = value
  wizard.isDirty = true
}

function onUpdateMessage(value: string) {
  wizard.campaign.message = value
  wizard.isDirty = true
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">
      {{ t('wizard.message.title') }}
    </h2>

    <SmsEditor
      :name="wizard.campaign.name"
      :sender="wizard.campaign.sender"
      :message="wizard.campaign.message"
      :variables="variables"
      :labels="smsLabels"
      :show-preview="false"
      :errors="smsErrors"
      @update:name="onUpdateName"
      @update:sender="onUpdateSender"
      @update:message="onUpdateMessage"
      @dirty="wizard.isDirty = true"
    />
  </div>
</template>
