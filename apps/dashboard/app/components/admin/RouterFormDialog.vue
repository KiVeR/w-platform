<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createEmptyRouterForm } from '@/types/admin'
import type { Router, RouterForm } from '@/types/admin'

const props = withDefaults(defineProps<{
  open: boolean
  router?: Router | null
  isLoading?: boolean
}>(), {
  router: null,
  isLoading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [form: RouterForm]
}>()

const { t } = useI18n()

const name = ref('')
const externalId = ref('')
const numStop = ref('')
const isActive = ref(true)
const nameError = ref('')

const isEditMode = computed(() => props.router !== null)

function resetFromProps(): void {
  const form = props.router
    ? {
        name: props.router.name,
        external_id: props.router.external_id,
        num_stop: props.router.num_stop,
        is_active: props.router.is_active,
      }
    : createEmptyRouterForm()

  name.value = form.name
  externalId.value = form.external_id == null ? '' : String(form.external_id)
  numStop.value = form.num_stop ?? ''
  isActive.value = form.is_active
  nameError.value = ''
}

watch(
  () => [props.open, props.router] as const,
  () => {
    resetFromProps()
  },
  { immediate: true },
)

function close(): void {
  emit('update:open', false)
}

function parseExternalId(value: string): number | null {
  if (value.trim().length === 0) {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function submit(): void {
  if (name.value.trim().length === 0) {
    nameError.value = t('admin.routers.dialog.validation.name')
    return
  }

  nameError.value = ''
  emit('submit', {
    name: name.value.trim(),
    external_id: parseExternalId(externalId.value),
    num_stop: numStop.value.trim().length === 0 ? null : numStop.value.trim(),
    is_active: isActive.value,
  })
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent data-router-form-dialog class="max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{ isEditMode ? t('admin.routers.dialog.editTitle') : t('admin.routers.dialog.createTitle') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('admin.routers.dialog.description') }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-5" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="router-name">
            {{ t('admin.routers.dialog.fields.name') }}
          </Label>
          <Input
            id="router-name"
            v-model="name"
            data-router-name
            :placeholder="t('admin.routers.dialog.placeholders.name')"
          />
          <p v-if="nameError" data-router-name-error class="text-sm text-destructive">
            {{ nameError }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="router-external-id">
              {{ t('admin.routers.dialog.fields.externalId') }}
            </Label>
            <Input
              id="router-external-id"
              v-model="externalId"
              data-router-external-id
              type="number"
              inputmode="numeric"
              :placeholder="t('admin.routers.dialog.placeholders.externalId')"
            />
          </div>

          <div class="space-y-2">
            <Label for="router-num-stop">
              {{ t('admin.routers.dialog.fields.numStop') }}
            </Label>
            <Input
              id="router-num-stop"
              v-model="numStop"
              data-router-num-stop
              :placeholder="t('admin.routers.dialog.placeholders.numStop')"
            />
          </div>
        </div>

        <div class="rounded-lg border px-4 py-3">
          <div class="flex items-center justify-between gap-3">
            <div class="space-y-1">
              <Label for="router-is-active">
                {{ t('admin.routers.dialog.fields.isActive') }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t('admin.routers.dialog.help.isActive') }}
              </p>
            </div>
            <Switch
              id="router-is-active"
              v-model="isActive"
              data-router-is-active
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="close">
            {{ t('admin.routers.dialog.cancel') }}
          </Button>
          <Button
            data-router-submit
            type="submit"
            :disabled="isLoading"
          >
            {{ isEditMode ? t('admin.routers.dialog.save') : t('admin.routers.dialog.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
