import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { PartnerFormData } from '@/types/partner'

export interface PartnerDetail {
  id: number
  name: string
  code: string | null
  activity_type: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  zip_code: string | null
  euro_credits: number
  is_active: boolean
  router_id: number | null
  billing_mode: string | null
  adv_id: number | null
  created_at: string
  users_count: number
  shops_count: number
}

function mapPartnerDetail(raw: Record<string, unknown>): PartnerDetail {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    code: raw.code != null ? String(raw.code) : null,
    activity_type: raw.activity_type != null ? String(raw.activity_type) : null,
    email: raw.email != null ? String(raw.email) : null,
    phone: raw.phone != null ? String(raw.phone) : null,
    address: raw.address != null ? String(raw.address) : null,
    city: raw.city != null ? String(raw.city) : null,
    zip_code: raw.zip_code != null ? String(raw.zip_code) : null,
    euro_credits: parseFloat(String(raw.euro_credits ?? '0')),
    is_active: raw.is_active === true || raw.is_active === 'true' || raw.is_active === 1,
    router_id: raw.router_id != null ? Number(raw.router_id) : null,
    billing_mode: raw.billing_mode != null ? String(raw.billing_mode) : null,
    adv_id: raw.adv_id != null ? Number(raw.adv_id) : null,
    created_at: String(raw.created_at ?? ''),
    users_count: Number(raw.users_count ?? 0),
    shops_count: Number(raw.shops_count ?? 0),
  }
}

export function usePartnerDetail() {
  const api = useApi()

  const partner = ref<PartnerDetail | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const hasError = ref(false)
  const saveError = ref<string | null>(null)

  async function fetchPartner(id: number): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const { data, error } = await api.GET('/partners/{partner}', {
        params: {
          path: { partner: id },
          query: { include: 'users,shops' },
        },
      } as never)

      if (error) {
        hasError.value = true
        return
      }

      if (data) {
        const raw = data as { data: Record<string, unknown> }
        partner.value = mapPartnerDetail(raw.data)
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function updatePartner(id: number, formData: PartnerFormData): Promise<boolean> {
    isSaving.value = true
    saveError.value = null
    try {
      const { error } = await api.PUT('/partners/{partner}', {
        params: { path: { partner: id } },
        body: formData,
      } as never)

      if (error) {
        saveError.value = 'update_failed'
        return false
      }

      await fetchPartner(id)
      return true
    }
    catch {
      saveError.value = 'update_failed'
      return false
    }
    finally {
      isSaving.value = false
    }
  }

  async function createPartner(formData: PartnerFormData): Promise<number | null> {
    isSaving.value = true
    saveError.value = null
    try {
      const { data, error } = await api.POST('/partners', {
        body: formData,
      } as never)

      if (error) {
        saveError.value = 'create_failed'
        return null
      }

      if (data) {
        const raw = data as { data: Record<string, unknown> }
        return Number(raw.data.id)
      }
      return null
    }
    catch {
      saveError.value = 'create_failed'
      return null
    }
    finally {
      isSaving.value = false
    }
  }

  return {
    partner,
    isLoading,
    isSaving,
    hasError,
    saveError,
    fetchPartner,
    updatePartner,
    createPartner,
  }
}
