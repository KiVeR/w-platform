<script setup lang="ts">
import { ref, watch } from 'vue'
import { Building2, Check, ChevronsUpDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { usePartnerStore } from '@/stores/partner'

interface PartnerOption {
  id: number
  name: string
}

const { t } = useI18n()
const api = useNuxtApp().$api
const partner = usePartnerStore()

const open = ref(false)
const search = ref('')
const partners = ref<PartnerOption[]>([])
const isLoading = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(search, (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchPartners(value), 300)
})

watch(open, (value) => {
  if (value) {
    search.value = ''
    fetchPartners('')
  }
})

async function fetchPartners(query: string) {
  isLoading.value = true
  try {
    const params: Record<string, unknown> = {
      'fields[partners]': 'id,name',
      'per_page': 20,
    }
    if (query) {
      params['filter[name]'] = query
    }
    const { data } = await api.GET('/partners', { params: { query: params as any } })
    const items = (data as any)?.data ?? []
    partners.value = items.map((p: PartnerOption) => ({ id: p.id, name: p.name }))
  } catch {
    partners.value = []
  } finally {
    isLoading.value = false
  }
}

function selectPartner(p: PartnerOption) {
  partner.setPartner(p.id, p.name)
  open.value = false
}

function selectAll() {
  partner.clearPartner()
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-[220px] justify-between"
      >
        <Building2 class="mr-2 size-4 shrink-0 opacity-50" />
        <span class="truncate">
          {{ partner.currentPartnerName ?? t('partner.allPartners') }}
        </span>
        <ChevronsUpDown class="ml-auto size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-[220px] p-0" align="start">
      <Command>
        <CommandInput
          v-model="search"
          :placeholder="t('partner.search')"
        />
        <CommandList>
          <CommandEmpty>{{ t('partner.noResults') }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              value="__all__"
              @select="selectAll"
            >
              <Check
                class="mr-2 size-4"
                :class="partner.isScoped ? 'opacity-0' : 'opacity-100'"
              />
              {{ t('partner.allPartners') }}
            </CommandItem>
            <CommandItem
              v-for="p in partners"
              :key="p.id"
              :value="p.name"
              @select="selectPartner(p)"
            >
              <Check
                class="mr-2 size-4"
                :class="partner.currentPartnerId === p.id ? 'opacity-100' : 'opacity-0'"
              />
              {{ p.name }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
