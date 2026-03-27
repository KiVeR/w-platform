<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { AcceptableValue } from 'reka-ui'
import type { UserFormData } from '@/types/user'

const props = defineProps<{
  open: boolean
  isSaving: boolean
  mode: 'create' | 'edit'
  initialData?: Partial<UserFormData>
  partners?: { id: number, name: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [data: UserFormData]
}>()

const { t } = useI18n()

const form = ref<UserFormData>({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  partner_id: null,
  role: 'partner',
  is_active: true,
})

const roles = ['admin', 'adv', 'partner', 'merchant', 'employee']

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      form.value = {
        firstname: props.initialData?.firstname ?? '',
        lastname: props.initialData?.lastname ?? '',
        email: props.initialData?.email ?? '',
        password: '',
        partner_id: props.initialData?.partner_id ?? null,
        role: props.initialData?.role ?? 'partner',
        is_active: props.initialData?.is_active ?? true,
      }
    }
  },
)

function handleConfirm() {
  if (!form.value.firstname.trim() || !form.value.lastname.trim() || !form.value.email.trim()) return
  if (props.mode === 'create' && !form.value.password?.trim()) return

  const data: UserFormData = { ...form.value }
  if (props.mode === 'edit') {
    delete data.password
  }
  emit('confirm', data)
}

function handleClose(val: boolean) {
  emit('update:open', val)
}

function handleRoleChange(value: AcceptableValue) {
  form.value.role = String(value)
}

function handlePartnerChange(value: AcceptableValue) {
  const str = String(value ?? '')
  form.value.partner_id = str ? Number(str) : null
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent data-user-form-dialog class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {{ mode === 'create' ? t('admin.users.form.titleCreate') : t('admin.users.form.titleEdit') }}
        </DialogTitle>
        <DialogDescription>
          {{ mode === 'create' ? t('admin.users.form.descriptionCreate') : t('admin.users.form.descriptionEdit') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="user-firstname">{{ t('admin.users.form.firstname') }}</Label>
            <Input
              id="user-firstname"
              v-model="form.firstname"
              data-firstname-input
              :placeholder="t('admin.users.form.firstnamePlaceholder')"
            />
          </div>
          <div class="space-y-2">
            <Label for="user-lastname">{{ t('admin.users.form.lastname') }}</Label>
            <Input
              id="user-lastname"
              v-model="form.lastname"
              data-lastname-input
              :placeholder="t('admin.users.form.lastnamePlaceholder')"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="user-email">{{ t('admin.users.form.email') }}</Label>
          <Input
            id="user-email"
            v-model="form.email"
            type="email"
            data-email-input
            :placeholder="t('admin.users.form.emailPlaceholder')"
          />
        </div>

        <div v-if="mode === 'create'" class="space-y-2">
          <Label for="user-password">{{ t('admin.users.form.password') }}</Label>
          <Input
            id="user-password"
            v-model="form.password"
            type="password"
            data-password-input
            :placeholder="t('admin.users.form.passwordPlaceholder')"
          />
        </div>

        <div v-if="partners && partners.length > 0" class="space-y-2">
          <Label>{{ t('admin.users.form.partner') }}</Label>
          <Select
            :model-value="form.partner_id != null ? String(form.partner_id) : ''"
            @update:model-value="handlePartnerChange"
          >
            <SelectTrigger data-partner-select>
              <SelectValue :placeholder="t('admin.users.form.partnerPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                {{ t('admin.users.form.noPartner') }}
              </SelectItem>
              <SelectItem
                v-for="p in partners"
                :key="p.id"
                :value="String(p.id)"
              >
                {{ p.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>{{ t('admin.users.form.role') }}</Label>
          <Select
            :model-value="form.role ?? 'partner'"
            @update:model-value="handleRoleChange"
          >
            <SelectTrigger data-role-select>
              <SelectValue :placeholder="t('admin.users.form.rolePlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="r in roles" :key="r" :value="r">
                {{ r }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-center gap-3">
          <Switch
            :checked="form.is_active"
            data-active-switch
            @update:checked="(val: boolean) => form.is_active = val"
          />
          <Label>{{ t('admin.users.form.isActive') }}</Label>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          data-cancel-btn
          @click="handleClose(false)"
        >
          {{ t('admin.users.form.cancel') }}
        </Button>
        <Button
          data-confirm-btn
          :disabled="isSaving || !form.firstname.trim() || !form.lastname.trim() || !form.email.trim() || (mode === 'create' && !form.password?.trim())"
          @click="handleConfirm"
        >
          {{ isSaving ? t('admin.users.form.saving') : t('admin.users.form.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
