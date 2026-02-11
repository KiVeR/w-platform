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
      :show-preview="true"
      @update:name="onUpdateName"
      @update:sender="onUpdateSender"
      @update:message="onUpdateMessage"
      @dirty="wizard.isDirty = true"
    />
  </div>
</template>
