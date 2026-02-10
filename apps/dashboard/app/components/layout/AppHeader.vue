<script setup lang="ts">
import { Menu, ChevronsLeft } from 'lucide-vue-next'
import { useSidebar } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import AppBreadcrumb from './AppBreadcrumb.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import PartnerSelector from '@/components/partner/PartnerSelector.vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const { toggleSidebar, state } = useSidebar()
const auth = useAuthStore()
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
    <Button
      variant="ghost"
      size="icon"
      class="-ml-1 size-7"
      :aria-label="t('sidebar.toggle')"
      @click="toggleSidebar"
    >
      <ChevronsLeft v-if="state === 'expanded'" class="size-4" />
      <Menu v-else class="size-4" />
    </Button>
    <Separator orientation="vertical" class="mr-2 !h-4" />
    <AppBreadcrumb />

    <div class="ml-auto flex items-center gap-2">
      <PartnerSelector v-if="auth.isAdmin" />
      <ThemeSwitcher />
    </div>
  </header>
</template>
