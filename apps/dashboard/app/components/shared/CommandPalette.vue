<script setup lang="ts">
import { Building2, Home, Send, Settings, Plus } from 'lucide-vue-next'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
} from '@/components/ui/command'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useAuthStore } from '@/stores/auth'
import { useScopedNavigation } from '@/composables/useScopedNavigation'
import { useNavigationMode } from '@/composables/useNavigationMode'

const { t } = useI18n()
const auth = useAuthStore()
const { isScope } = useNavigationMode()
const { scopedRoute } = useScopedNavigation()
const { isOpen, searchQuery, partners, selectPartner } = useCommandPalette()

interface PageItem {
  label: string
  icon: typeof Home
  to: string
}

const pages = computed<PageItem[]>(() => {
  if (isScope.value) {
    return [
      { label: t('nav.dashboard'), icon: Home, to: scopedRoute('/dashboard') },
      { label: t('nav.campaigns'), icon: Send, to: scopedRoute('/campaigns') },
      { label: t('nav.settings'), icon: Settings, to: scopedRoute('/settings') },
    ]
  }
  return [
    { label: t('nav.dashboard'), icon: Home, to: '/hub/dashboard' },
    { label: t('nav.partners'), icon: Building2, to: '/hub/partners' },
  ]
})

const actions = computed<PageItem[]>(() => {
  const items: PageItem[] = []
  if (isScope.value) {
    items.push({ label: t('commandPalette.newCampaign'), icon: Plus, to: scopedRoute('/campaigns/new') })
  }
  if (auth.isAdmin) {
    items.push({ label: t('commandPalette.newPartner'), icon: Plus, to: '/hub/partners/new' })
  }
  return items
})

function navigateToPage(to: string) {
  isOpen.value = false
  searchQuery.value = ''
  navigateTo(to)
}
</script>

<template>
  <CommandDialog v-model:open="isOpen" data-command-palette>
    <CommandInput
      v-model="searchQuery"
      :placeholder="t('commandPalette.placeholder')"
    />
    <CommandList>
      <CommandEmpty>{{ t('commandPalette.noResults') }}</CommandEmpty>

      <CommandGroup
        v-if="partners.length"
        :heading="t('commandPalette.partners')"
        data-partner-results
      >
        <CommandItem
          v-for="p in partners"
          :key="p.id"
          :value="p.name"
          @select="selectPartner(p.id, p.name)"
        >
          <Building2 class="mr-2 size-4" />
          {{ p.name }}
        </CommandItem>
      </CommandGroup>

      <CommandSeparator v-if="partners.length" />

      <CommandGroup :heading="t('commandPalette.pages')" data-pages-group>
        <CommandItem
          v-for="page in pages"
          :key="page.to"
          :value="page.label"
          @select="navigateToPage(page.to)"
        >
          <component :is="page.icon" class="mr-2 size-4" />
          {{ page.label }}
        </CommandItem>
      </CommandGroup>

      <CommandSeparator v-if="actions.length" />

      <CommandGroup
        v-if="actions.length"
        :heading="t('commandPalette.actions')"
        data-actions-group
      >
        <CommandItem
          v-for="action in actions"
          :key="action.to"
          :value="action.label"
          @select="navigateToPage(action.to)"
        >
          <component :is="action.icon" class="mr-2 size-4" />
          {{ action.label }}
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
