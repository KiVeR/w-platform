<script setup lang="ts">
import { ref, computed } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
import PartnerForm from '@/components/hub/PartnerForm.vue'
import PartnerCreditPanel from '@/components/hub/PartnerCreditPanel.vue'
import CreditRechargeDialog from '@/components/hub/CreditRechargeDialog.vue'
import PartnerFeaturesPanel from '@/components/hub/PartnerFeaturesPanel.vue'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import { usePartnerDetail } from '@/composables/usePartnerDetail'
import { usePartnerCredits } from '@/composables/usePartnerCredits'
import { usePartnerFeatures } from '@/composables/usePartnerFeatures'
import { useAuthStore } from '@/stores/auth'
import type { PartnerFormData } from '@/types/partner'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['manage partners'],
})

const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()

const partnerId = computed(() => Number(route.params.id))
const isAdmin = computed(() => auth.isAdmin)

const {
  partner, isLoading, isSaving, hasError, saveError,
  fetchPartner, updatePartner,
} = usePartnerDetail()

const {
  balance, transactions,
  isLoadingBalance, isLoadingTransactions, isRecharging,
  rechargeError, fetchBalance, fetchTransactions, rechargeCredits,
} = usePartnerCredits()

const {
  features, isLoading: isLoadingFeatures,
  fetchFeatures, toggleFeature,
} = usePartnerFeatures()

const showRechargeDialog = ref(false)
const activeTab = ref('info')

const formData = computed(() => {
  if (!partner.value) return undefined
  return {
    id: partner.value.id,
    name: partner.value.name,
    code: partner.value.code ?? undefined,
    email: partner.value.email ?? undefined,
    phone: partner.value.phone ?? undefined,
    address: partner.value.address ?? undefined,
    city: partner.value.city ?? undefined,
    zip_code: partner.value.zip_code ?? undefined,
    activity_type: partner.value.activity_type ?? undefined,
    is_active: partner.value.is_active,
    router_id: partner.value.router_id ?? undefined,
    billing_mode: partner.value.billing_mode ?? undefined,
  }
})

async function handleUpdate(data: PartnerFormData) {
  await updatePartner(partnerId.value, data)
}

function handleCancel() {
  navigateTo('/hub/partners')
}

async function handleRecharge(amount: number, description: string) {
  const success = await rechargeCredits(partnerId.value, amount, description)
  if (success) {
    showRechargeDialog.value = false
  }
}

async function handleRefreshCredits() {
  await Promise.all([
    fetchBalance(partnerId.value),
    fetchTransactions(partnerId.value),
  ])
}

async function handleToggleFeature(key: string, enabled: boolean) {
  await toggleFeature(partnerId.value, key, enabled)
}

onMounted(async () => {
  await Promise.all([
    fetchPartner(partnerId.value),
    fetchBalance(partnerId.value),
    fetchTransactions(partnerId.value),
    fetchFeatures(partnerId.value),
  ])
})
</script>

<template>
  <div data-partner-detail-page class="max-w-4xl mx-auto py-6 space-y-6">
    <!-- Back button & title -->
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" data-back-btn @click="handleCancel">
        <ArrowLeft class="size-5" />
      </Button>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ partner?.name ?? t('hub.partnerDetail.loading') }}
        </h1>
        <p v-if="partner?.code" class="text-sm text-muted-foreground">
          {{ partner.code }}
        </p>
      </div>
    </div>

    <PageSkeleton v-if="isLoading" variant="card" />

    <div v-else-if="hasError" class="text-center py-12 text-muted-foreground">
      {{ t('hub.partnerDetail.error') }}
    </div>

    <Tabs v-else v-model="activeTab" class="w-full">
      <TabsList data-tabs-list>
        <TabsTrigger value="info" data-tab-info>
          {{ t('hub.partnerDetail.tabs.info') }}
        </TabsTrigger>
        <TabsTrigger value="credits" data-tab-credits>
          {{ t('hub.partnerDetail.tabs.credits') }}
        </TabsTrigger>
        <TabsTrigger value="features" data-tab-features>
          {{ t('hub.partnerDetail.tabs.features') }}
        </TabsTrigger>
        <TabsTrigger value="users" data-tab-users>
          {{ t('hub.partnerDetail.tabs.users') }}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <div v-if="saveError" class="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm" data-save-error>
          {{ saveError }}
        </div>
        <PartnerForm
          v-if="formData"
          mode="edit"
          :initial-data="formData"
          :is-saving="isSaving"
          @submit="handleUpdate"
          @cancel="handleCancel"
        />
      </TabsContent>

      <TabsContent value="credits">
        <div v-if="rechargeError" class="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {{ rechargeError }}
        </div>
        <PartnerCreditPanel
          :balance="balance"
          :transactions="transactions"
          :is-loading-balance="isLoadingBalance"
          :is-loading-transactions="isLoadingTransactions"
          :is-admin="isAdmin"
          @recharge="showRechargeDialog = true"
          @refresh="handleRefreshCredits"
        />
        <CreditRechargeDialog
          v-model:open="showRechargeDialog"
          :is-recharging="isRecharging"
          @confirm="handleRecharge"
        />
      </TabsContent>

      <TabsContent value="features">
        <PartnerFeaturesPanel
          :features="features"
          :is-loading="isLoadingFeatures"
          :is-admin="isAdmin"
          @toggle="handleToggleFeature"
        />
      </TabsContent>

      <TabsContent value="users">
        <div class="text-center py-12 text-muted-foreground">
          {{ t('hub.partnerDetail.usersPlaceholder') }}
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
