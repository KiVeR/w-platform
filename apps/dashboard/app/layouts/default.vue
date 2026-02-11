<script setup lang="ts">
import { computed } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Sonner } from '@/components/ui/sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useColorMode } from '@/composables/useColorMode'

const { isDark } = useColorMode()
const sonnerTheme = computed(() => isDark.value ? 'dark' : 'light')
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <div class="mx-auto max-w-[--content-max-width]">
          <slot />
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>
  <Sonner position="bottom-right" :theme="sonnerTheme" />
</template>
