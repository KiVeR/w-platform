<script setup lang="ts">
import { Slash } from 'lucide-vue-next'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const { t } = useI18n()
const route = useRoute()

interface BreadcrumbEntry {
  label: string
  to?: string
}

const routeLabels: Record<string, string> = {
  admin: 'breadcrumb.admin',
  campaigns: 'breadcrumb.campaigns',
  new: 'breadcrumb.newCampaign',
  shops: 'breadcrumb.shops',
  'landing-pages': 'breadcrumb.landingPages',
  stats: 'breadcrumb.stats',
  settings: 'breadcrumb.settings',
  routers: 'breadcrumb.routers',
  users: 'breadcrumb.users',
  partner: 'breadcrumb.partner',
  'variable-schemas': 'breadcrumb.variableSchemas',
}

const breadcrumbs = computed<BreadcrumbEntry[]>(() => {
  const segments = route.path.split('/').filter(Boolean)
  const items: BreadcrumbEntry[] = [
    { label: t('breadcrumb.dashboard'), to: '/' },
  ]

  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    const key = routeLabels[segment]
    if (key) {
      items.push({
        label: t(key),
        to: segment === 'admin' && segments.length > 1 ? undefined : path,
      })
    } else if (/^\d+$/.test(segment)) {
      // Dynamic route segment — use page title from route meta if available
      const pageTitle = route.meta.breadcrumbLabel as string | undefined
      if (pageTitle) {
        items.push({ label: pageTitle, to: path })
      }
    }
  }

  return items
})
</script>

<template>
  <Breadcrumb>
    <BreadcrumbList>
      <template v-for="(item, index) in breadcrumbs" :key="item.to ?? index">
        <BreadcrumbSeparator v-if="index > 0">
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage v-if="index === breadcrumbs.length - 1 || !item.to">
            {{ item.label }}
          </BreadcrumbPage>
          <BreadcrumbLink v-else as-child>
            <NuxtLink :to="item.to">
              {{ item.label }}
            </NuxtLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
