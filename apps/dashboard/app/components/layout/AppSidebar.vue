<script setup lang="ts">
import {
  Home,
  Send,
  MapPin,
  Layout,
  BarChart3,
  Settings,
  Router,
  FileCode,
  LogOut,
  ChevronsUpDown,
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
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { usePartnerStore } from '@/stores/partner'
import AppLogo from './AppLogo.vue'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const partner = usePartnerStore()

async function handleLogout() {
  await auth.logout()
  await navigateTo('/login')
}

interface NavItem {
  label: string
  icon: typeof Home
  to: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups = computed<NavGroup[]>(() => [
  {
    label: t('nav.groups.main'),
    items: [
      { label: t('nav.dashboard'), icon: Home, to: '/' },
      { label: t('nav.campaigns'), icon: Send, to: '/campaigns' },
      { label: t('nav.shops'), icon: MapPin, to: '/shops' },
      { label: t('nav.landingPages'), icon: Layout, to: '/landing-pages' },
    ],
  },
  {
    label: t('nav.groups.analysis'),
    items: [
      { label: t('nav.stats'), icon: BarChart3, to: '/stats' },
    ],
  },
  {
    label: t('nav.groups.config'),
    items: [
      { label: t('nav.settings'), icon: Settings, to: '/settings' },
    ],
  },
  ...(auth.isAdmin
    ? [{
        label: t('nav.groups.admin'),
        items: [
          { label: t('nav.routers'), icon: Router, to: '/admin/routers' },
          { label: t('nav.variableSchemas'), icon: FileCode, to: '/admin/variable-schemas' },
        ],
      }]
    : []),
])

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader class="p-4 group-data-[collapsible=icon]:p-2">
      <AppLogo />
      <Badge
        v-if="auth.isAdmin && partner.isScoped"
        variant="secondary"
        class="mt-1 truncate group-data-[collapsible=icon]:hidden"
      >
        {{ partner.currentPartnerName }}
      </Badge>
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
