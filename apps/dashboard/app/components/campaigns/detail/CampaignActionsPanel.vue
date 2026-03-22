<script setup lang="ts">
import { Copy, Download, Pencil, XCircle } from 'lucide-vue-next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { CampaignDetailEnriched } from '@/types/campaign'

const props = withDefaults(defineProps<{
  campaign: CampaignDetailEnriched
  showEdit?: boolean
  showDuplicate?: boolean
  showExport?: boolean
  showCancel?: boolean
  isExporting?: boolean
  isCancelling?: boolean
  cancelError?: string | null
}>(), {
  showEdit: false,
  showDuplicate: false,
  showExport: false,
  showCancel: false,
  isExporting: false,
  isCancelling: false,
  cancelError: null,
})

const emit = defineEmits<{
  edit: []
  duplicate: []
  export: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<template>
  <Card data-actions-panel class="gap-4 border-border/70 shadow-sm">
    <CardHeader class="pb-0">
      <CardTitle class="text-base">
        {{ t('campaigns.detail.actionsPanel.title') }}
      </CardTitle>
      <CardDescription>
        {{ t('campaigns.detail.actionsPanel.description') }}
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-3">
      <Alert
        v-if="cancelError"
        data-actions-error
        variant="destructive"
      >
        <AlertDescription>
          {{ t('campaigns.detail.actionsPanel.cancelError') }}
        </AlertDescription>
      </Alert>

      <Button
        v-if="showEdit"
        data-action-edit
        variant="outline"
        class="w-full justify-start"
        @click="emit('edit')"
      >
        <Pencil class="mr-2 size-4" />
        {{ t('campaigns.detail.editDraft') }}
      </Button>

      <Button
        v-if="showDuplicate"
        data-action-duplicate
        variant="outline"
        class="w-full justify-start"
        @click="emit('duplicate')"
      >
        <Copy class="mr-2 size-4" />
        {{ t('campaigns.detail.duplicate') }}
      </Button>

      <Button
        v-if="showExport"
        data-action-export
        variant="outline"
        class="w-full justify-start"
        :disabled="isExporting"
        @click="emit('export')"
      >
        <Download class="mr-2 size-4" />
        {{ t('campaigns.detail.export') }}
      </Button>

      <AlertDialog v-if="showCancel">
        <AlertDialogTrigger as-child>
          <Button
            data-action-cancel
            variant="destructive"
            class="w-full justify-start"
            :disabled="isCancelling"
          >
            <XCircle class="mr-2 size-4" />
            {{ t('campaigns.detail.cancel') }}
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ t('campaigns.detail.actionsPanel.cancelConfirm.title') }}</AlertDialogTitle>
            <AlertDialogDescription>
              {{ t('campaigns.detail.actionsPanel.cancelConfirm.description', { name: campaign.name }) }}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              {{ t('campaigns.detail.actionsPanel.cancelConfirm.cancel') }}
            </AlertDialogCancel>
            <AlertDialogAction
              data-action-confirm-cancel
              class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              @click="emit('cancel')"
            >
              {{ t('campaigns.detail.actionsPanel.cancelConfirm.confirm') }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>
  </Card>
</template>
