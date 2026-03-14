import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import type { Shop } from '@/types/campaign'

function toNullableString(value: unknown): string | null {
  return value != null ? String(value) : null
}

function toNullableNumber(value: unknown): number | null {
  return value != null ? Number(value) : null
}

function mapShop(raw: Record<string, unknown>): Shop {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    address: toNullableString(raw.address),
    city: toNullableString(raw.city),
    zip_code: toNullableString(raw.zip_code),
    latitude: toNullableNumber(raw.latitude),
    longitude: toNullableNumber(raw.longitude),
  }
}

export function usePartnerShops() {
  const api = useApi()

  const shops = ref<Shop[]>([])
  const isLoading = ref(false)

  async function fetchShops(partnerId: number): Promise<void> {
    isLoading.value = true
    try {
      const { data, error } = await api.GET('/shops' as never, {
        params: {
          query: {
            'filter[partner_id]': partnerId,
            'filter[is_active]': true,
          },
        },
      } as never)
      if (error || !data) return
      const raw = data as { data: Record<string, unknown>[] }
      shops.value = raw.data.map(mapShop)
    }
    catch {
      // Silently fail — shop data is optional
    }
    finally {
      isLoading.value = false
    }
  }

  const primaryShop = computed(() => shops.value[0] ?? null)

  return { shops, primaryShop, isLoading, fetchShops }
}
