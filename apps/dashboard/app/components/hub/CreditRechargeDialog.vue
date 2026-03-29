<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps<{
  open: boolean
  isRecharging: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [amount: number, description: string]
}>()

const { t } = useI18n()

const amount = ref<number | undefined>(undefined)
const description = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      amount.value = undefined
      description.value = ''
    }
  },
)

function handleConfirm() {
  if (!amount.value || amount.value <= 0 || !description.value.trim()) return
  emit('confirm', amount.value, description.value.trim())
}

function handleClose(val: boolean) {
  emit('update:open', val)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent data-recharge-dialog>
      <DialogHeader>
        <DialogTitle>{{ t('hub.credits.rechargeTitle') }}</DialogTitle>
        <DialogDescription>{{ t('hub.credits.rechargeDescription') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="recharge-amount">{{ t('hub.credits.amount') }}</Label>
          <Input
            id="recharge-amount"
            v-model.number="amount"
            type="number"
            min="0.01"
            step="0.01"
            data-amount-input
            :placeholder="t('hub.credits.amountPlaceholder')"
          />
        </div>

        <div class="space-y-2">
          <Label for="recharge-description">{{ t('hub.credits.description') }}</Label>
          <Textarea
            id="recharge-description"
            v-model="description"
            data-description-input
            :placeholder="t('hub.credits.descriptionPlaceholder')"
            rows="2"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          data-cancel-btn
          @click="handleClose(false)"
        >
          {{ t('hub.credits.cancel') }}
        </Button>
        <Button
          data-confirm-btn
          :disabled="isRecharging || !amount || amount <= 0 || !description.trim()"
          @click="handleConfirm"
        >
          {{ isRecharging ? t('hub.credits.processing') : t('hub.credits.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
