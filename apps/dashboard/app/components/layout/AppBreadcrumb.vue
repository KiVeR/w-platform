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
import { useNavigationMode } from '@/composables/useNavigationMode'
import { usePartnerStore } from '@/stores/partner'

const { t } = useI18n()
const route = useRoute()
const { isScope, scopedPartnerId } = useNavigationMode()
const partner = usePartnerStore()

interface BreadcrumbEntry {
  label: string
  to?: string
}

const routeLabels: Record<string, string> = {
  admin: 'breadcrumb.admin',
  hub: 'breadcrumb.hub',
  campaigns: 'breadcrumb.campaigns',
  new: 'breadcrumb.newCampaign',
  shops: 'breadcrumb.shops',
  'landing-pages': 'breadcrumb.landingPages',
  stats: 'breadcrumb.stats',
  settings: 'breadcrumb.settings',
  routers: 'breadcrumb.routers',
  users: 'breadcrumb.users',
  partner: 'breadcrumb.partner',
  partners: 'breadcrumb.partners',
  'variable-schemas': 'breadcrumb.variableSchemas',
  dashboard: 'breadcrumb.dashboard',
  demandes: 'breadcrumb.demandes',
  operations: 'breadcrumb.operations',
  billing: 'breadcrumb.billing',
}

const breadcrumbs = computed<BreadcrumbEntry[]>(() => {
  const segments = route.path.split('/').filter(Boolean)

  // Scope mode: Hub > PartnerName > Page
  if (isScope.value && scopedPartnerId.value !== null) {
    const items: BreadcrumbEntry[] = [
      { label: t('breadcrumb.hub'), to: '/hub/dashboard' },
    ]

    // Partner name segment
    const partnerName = partner.currentPartnerName ?? `#${scopedPartnerId.value}`
    const partnerBasePath = `/partners/${scopedPartnerId.value}`
    items.push({ label: partnerName, to: `${partnerBasePath}/dashboard` })

    // Remaining segments after /partners/:id
    const partnerIndex = segments.indexOf('partners')
    const pageSegments = partnerIndex >= 0 ? segments.slice(partnerIndex + 2) : []
    let path = partnerBasePath
    for (const segment of pageSegments) {
      path += `/${segment}`
      const key = routeLabels[segment]
      if (key) {
        items.push({ label: t(key), to: path })
      } else if (/^\d+$/.test(segment)) {
        const pageTitle = route.meta.breadcrumbLabel as string | undefined
        if (pageTitle) {
          items.push({ label: pageTitle, to: path })
        }
      }
    }

    return items
  }

  // Hub mode: Dashboard > Page
  const items: BreadcrumbEntry[] = [
    { label: t('breadcrumb.dashboard'), to: '/hub/dashboard' },
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
