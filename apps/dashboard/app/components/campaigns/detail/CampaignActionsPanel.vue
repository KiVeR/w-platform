<script setup lang="ts">
import { Copy, Download, FileDown, Pause, Pencil, Play, StopCircle, XCircle } from 'lucide-vue-next'
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
import { Separator } from '@/components/ui/separator'
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
  showStartRouting?: boolean
  showPauseRouting?: boolean
  showCancelRouting?: boolean
  showPullReport?: boolean
  isRoutingActionPending?: boolean
  routingActionError?: string | null
}>(), {
  showEdit: false,
  showDuplicate: false,
  showExport: false,
  showCancel: false,
  isExporting: false,
  isCancelling: false,
  cancelError: null,
  showStartRouting: false,
  showPauseRouting: false,
  showCancelRouting: false,
  showPullReport: false,
  isRoutingActionPending: false,
  routingActionError: null,
})

const emit = defineEmits<{
  edit: []
  duplicate: []
  export: []
  cancel: []
  startRouting: []
  pauseRouting: []
  cancelRouting: []
  pullReport: []
}>()

const hasRoutingActions = computed(() =>
  props.showStartRouting || props.showPauseRouting || props.showCancelRouting || props.showPullReport,
)

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

      <!-- Routing actions -->
      <template v-if="hasRoutingActions">
        <Separator class="my-2" />

        <Alert v-if="routingActionError" data-routing-error variant="destructive">
          <AlertDescription>
            {{ t('campaigns.routingActions.error') }}
          </AlertDescription>
        </Alert>

        <!-- Start/Resume Routing -->
        <AlertDialog v-if="showStartRouting">
          <AlertDialogTrigger as-child>
            <Button data-action-start-routing variant="outline" class="w-full justify-start" :disabled="isRoutingActionPending">
              <Play class="mr-2 size-4" />
              {{ t('campaigns.routingActions.start') }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t('campaigns.routingActions.start') }}</AlertDialogTitle>
              <AlertDialogDescription>{{ t('campaigns.routingActions.confirmStart') }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t('campaigns.deleteConfirm.cancel') }}</AlertDialogCancel>
              <AlertDialogAction @click="emit('startRouting')">{{ t('campaigns.routingActions.start') }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- Pause Routing -->
        <AlertDialog v-if="showPauseRouting">
          <AlertDialogTrigger as-child>
            <Button data-action-pause-routing variant="outline" class="w-full justify-start" :disabled="isRoutingActionPending">
              <Pause class="mr-2 size-4" />
              {{ t('campaigns.routingActions.pause') }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t('campaigns.routingActions.pause') }}</AlertDialogTitle>
              <AlertDialogDescription>{{ t('campaigns.routingActions.confirmPause') }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t('campaigns.deleteConfirm.cancel') }}</AlertDialogCancel>
              <AlertDialogAction @click="emit('pauseRouting')">{{ t('campaigns.routingActions.pause') }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- Cancel Routing -->
        <AlertDialog v-if="showCancelRouting">
          <AlertDialogTrigger as-child>
            <Button data-action-cancel-routing variant="destructive" class="w-full justify-start" :disabled="isRoutingActionPending">
              <StopCircle class="mr-2 size-4" />
              {{ t('campaigns.routingActions.cancel') }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t('campaigns.routingActions.cancel') }}</AlertDialogTitle>
              <AlertDialogDescription>{{ t('campaigns.routingActions.confirmCancel') }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t('campaigns.deleteConfirm.cancel') }}</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" @click="emit('cancelRouting')">{{ t('campaigns.routingActions.cancel') }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- Pull Report -->
        <AlertDialog v-if="showPullReport">
          <AlertDialogTrigger as-child>
            <Button data-action-pull-report variant="outline" class="w-full justify-start" :disabled="isRoutingActionPending">
              <FileDown class="mr-2 size-4" />
              {{ t('campaigns.routingActions.pullReport') }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t('campaigns.routingActions.pullReport') }}</AlertDialogTitle>
              <AlertDialogDescription>{{ t('campaigns.routingActions.confirmPullReport') }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t('campaigns.deleteConfirm.cancel') }}</AlertDialogCancel>
              <AlertDialogAction @click="emit('pullReport')">{{ t('campaigns.routingActions.pullReport') }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
    </CardContent>
  </Card>
</template>
