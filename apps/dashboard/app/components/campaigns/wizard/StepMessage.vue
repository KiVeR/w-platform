<script setup lang="ts">
import { computed } from 'vue'
import { Info, AlertTriangle, ChevronDown } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import SmsPreview from '@/components/campaigns/wizard/SmsPreview.vue'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { getSmsStats, isForbiddenMessage } from '@/utils/sms'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const smsStats = computed(() => getSmsStats(wizard.campaign.message))
const hasForbidden = computed(() => isForbiddenMessage(wizard.campaign.message))
const isMultiSms = computed(() => smsStats.value.smsCount > 1)

const variables = [
  { key: 'shortUrl', token: '${shortUrl}' },
  { key: 'prenom', token: '${prenom}' },
  { key: 'nom', token: '${nom}' },
]

function insertVariable(token: string) {
  wizard.campaign.message += token
  wizard.isDirty = true
}

function markDirty() {
  wizard.isDirty = true
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">{{ t('wizard.message.title') }}</h2>

    <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
      <!-- Left: Form -->
      <div class="space-y-5">
        <div class="space-y-2">
          <Label>{{ t('wizard.message.name') }}</Label>
          <Input
            v-model="wizard.campaign.name"
            data-name-input
            :placeholder="t('wizard.message.namePlaceholder')"
            maxlength="255"
            @input="markDirty"
          />
        </div>

        <div class="space-y-2">
          <Label>{{ t('wizard.message.sender') }}</Label>
          <Input
            v-model="wizard.campaign.sender"
            data-sender-input
            :placeholder="t('wizard.message.senderPlaceholder')"
            maxlength="11"
            @input="markDirty"
          />
          <p class="text-xs text-muted-foreground">{{ t('wizard.message.senderHelp') }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label>{{ t('wizard.message.messageLabel') }}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs">
                  {{ t('wizard.message.insertVariable') }}
                  <ChevronDown class="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  v-for="v in variables"
                  :key="v.key"
                  data-variable-item
                  @click="insertVariable(v.token)"
                >
                  <code class="mr-2 text-xs">{{ v.token }}</code>
                  {{ t(`wizard.message.variables.${v.key}`) }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Textarea
            v-model="wizard.campaign.message"
            data-message-textarea
            :placeholder="t('wizard.message.messagePlaceholder')"
            rows="5"
            class="resize-y"
            @input="markDirty"
          />

          <div data-char-counter class="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{{ t('wizard.message.charCount', { count: smsStats.charCount, max: smsStats.maxChars }) }}</span>
            <span>{{ t('wizard.message.smsCount', { count: smsStats.smsCount || 1 }) }}</span>
            <span>{{ t('wizard.message.encoding', { encoding: smsStats.encoding }) }}</span>
          </div>
        </div>

        <Alert data-stop-alert>
          <Info class="size-4" />
          <AlertTitle>STOP SMS</AlertTitle>
          <AlertDescription>{{ t('wizard.message.stopInfo') }}</AlertDescription>
        </Alert>

        <Alert v-if="isMultiSms" data-multi-sms-alert variant="destructive">
          <AlertTriangle class="size-4" />
          <AlertDescription>{{ t('wizard.message.multiSmsWarning', { count: smsStats.smsCount }) }}</AlertDescription>
        </Alert>

        <Alert v-if="hasForbidden" data-forbidden-alert variant="destructive">
          <AlertTriangle class="size-4" />
          <AlertDescription>{{ t('wizard.message.forbiddenDomain') }}</AlertDescription>
        </Alert>
      </div>

      <!-- Right: Preview -->
      <div class="hidden lg:block">
        <div class="sticky top-6">
          <SmsPreview :sender="wizard.campaign.sender" :message="wizard.campaign.message" />
        </div>
      </div>
    </div>
  </div>
</template>
