<script setup lang="ts">
import {
  Home,
  Send,
  MapPin,
  Layout,
  BarChart3,
  Settings,
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
import AppLogo from './AppLogo.vue'

const { t } = useI18n()
const route = useRoute()

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
])

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

// TODO: Replace with real auth store data (D2)
const user = {
  name: 'Jean Dupont',
  email: 'jean@wellpack.fr',
  initials: 'JD',
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
    </SidebarContent>

    <SidebarFooter>
      <SidebarSeparator />
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
                <Avatar class="size-8 shrink-0">
                  <AvatarFallback class="text-xs">{{ user.initials }}</AvatarFallback>
                </Avatar>
                <div class="flex flex-1 flex-col text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span class="truncate font-medium">{{ user.name }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ user.email }}</span>
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
              <DropdownMenuItem class="text-destructive focus:text-destructive">
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
