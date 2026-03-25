<script setup lang="ts">
import {
  Home,
  Send,
  Settings,
  Router,
  FileCode,
  LogOut,
  ChevronsUpDown,
  ClipboardList,
  Receipt,
  FileText,
  Building2,
  Users,
  ArrowLeft,
} from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import { useNavigationMode } from '@/composables/useNavigationMode'
import { useScopedNavigation } from '@/composables/useScopedNavigation'
import type { NavGroup } from '@/types/navigation'
import AppLogo from './AppLogo.vue'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const { can, hasAnyRole } = usePermission()
const { mode, isScope } = useNavigationMode()
const { scopedRoute, exitToHub } = useScopedNavigation()

async function handleLogout() {
  await auth.logout()
  await navigateTo('/login')
}

/**
 * Hub navigation — visible when user is on /hub/* or any non-scoped route.
 * Shows platform-level pages: dashboard, partners list, operations, admin.
 */
const hubNavGroups = computed<NavGroup[]>(() => [
  {
    label: t('nav.groups.platform'),
    items: [
      { label: t('nav.hubDashboard'), icon: Home, to: '/hub/dashboard' },
      { label: t('nav.partners'), icon: Building2, to: '/hub/partners' },
      { label: t('nav.demandes'), icon: FileText, to: '/demandes', requiredPermissions: ['view demandes'] },
      { label: t('nav.operations'), icon: ClipboardList, to: '/operations', requiredPermissions: ['view operations'] },
      { label: t('nav.billing'), icon: Receipt, to: '/billing', requiredPermissions: ['view operations'] },
    ],
  },
  ...(auth.isAdmin
    ? [{
        label: t('nav.groups.admin'),
        items: [
          { label: t('nav.users'), icon: Users, to: '/admin/users' },
          { label: t('nav.routers'), icon: Router, to: '/admin/routers' },
          { label: t('nav.variableSchemas'), icon: FileCode, to: '/admin/variable-schemas' },
        ],
      }]
    : []),
])

/**
 * Scope navigation — visible when user is scoped to a partner.
 * Shows partner-level pages: dashboard, campaigns, shops, etc.
 */
const scopeNavGroups = computed<NavGroup[]>(() => [
  {
    label: t('nav.groups.main'),
    items: [
      { label: t('nav.dashboard'), icon: Home, to: scopedRoute('/dashboard') },
      { label: t('nav.campaigns'), icon: Send, to: scopedRoute('/campaigns') },
    ],
  },
  {
    label: t('nav.groups.adv'),
    requiredPermissions: ['view operations'],
    items: [
      { label: t('nav.demandes'), icon: FileText, to: scopedRoute('/demandes'), requiredPermissions: ['view demandes'] },
      { label: t('nav.operations'), icon: ClipboardList, to: scopedRoute('/operations'), requiredPermissions: ['view operations'] },
      { label: t('nav.billing'), icon: Receipt, to: scopedRoute('/billing'), requiredPermissions: ['view operations'] },
    ],
  },
  {
    label: t('nav.groups.config'),
    items: [
      { label: t('nav.settings'), icon: Settings, to: scopedRoute('/settings') },
    ],
  },
])

/**
 * Active navigation groups based on current mode.
 * Filtered by role/permissions — admins bypass all restrictions.
 */
const navGroups = computed<NavGroup[]>(() => {
  const groups = isScope.value ? scopeNavGroups.value : hubNavGroups.value
  return groups
    .filter((group) => {
      if (auth.isAdmin) return true
      if (group.requiredRoles?.length && !hasAnyRole(group.requiredRoles)) return false
      if (group.requiredPermissions?.length && !group.requiredPermissions.every(p => can(p))) return false
      return true
    })
    .map(group => ({
      ...group,
      items: group.items.filter((item) => {
        if (auth.isAdmin) return true
        if (item.requiredRoles?.length && !hasAnyRole(item.requiredRoles)) return false
        if (item.requiredPermissions?.length && !item.requiredPermissions.every(p => can(p))) return false
        return true
      }),
    }))
    .filter(group => group.items.length > 0)
})

function isActive(to: string): boolean {
  if (to === '/' || to === '/hub/dashboard') return route.path === to
  return route.path.startsWith(to)
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader class="p-4 group-data-[collapsible=icon]:p-2">
      <AppLogo />
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="group in navGroups" :key="group.label">
        <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in group.items" :key="item.to">
              <SidebarMenuButton
                as-child
                :tooltip="item.label"
                :data-active="isActive(item.to)"
              >
                <NuxtLink :to="item.to">
                  <component :is="item.icon" />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Back to Hub button in scope mode for internal users -->
      <SidebarGroup v-if="isScope && !auth.isPartnerBound" data-back-to-hub>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child :tooltip="t('nav.backToHub')">
                <button type="button" @click="exitToHub">
                  <ArrowLeft />
                  <span>{{ t('nav.backToHub') }}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarSeparator />
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
                <Avatar class="size-8 shrink-0">
                  <AvatarFallback class="text-xs">{{ auth.initials }}</AvatarFallback>
                </Avatar>
                <div class="flex flex-1 flex-col text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span class="truncate font-medium">{{ auth.fullName }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ auth.user?.email }}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              :side-offset="8"
              class="w-56"
            >
              <DropdownMenuItem as-child>
                <NuxtLink to="/settings">
                  <Settings class="mr-2 size-4" />
                  {{ t('header.profile') }}
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogout">
                <LogOut class="mr-2 size-4" />
                {{ t('sidebar.logout') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
