<script setup lang="ts">
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
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
</template>
