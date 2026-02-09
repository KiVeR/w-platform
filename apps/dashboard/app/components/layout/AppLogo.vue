<script setup lang="ts">
</script>

<template>
  <div class="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:overflow-visible">
    <!-- Icon: "Data Pillars" — 3 bars, diagonal tops, V-notch bottoms -->
    <svg
      class="size-7 shrink-0 group-data-[collapsible=icon]:size-6"
      viewBox="0 0 46 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="var(--logo-grad-start)" />
          <stop offset="100%" stop-color="var(--logo-grad-end)" />
        </linearGradient>
      </defs>
      <path d="M0 30 L12 23.3 V46 L6 40 L0 46 Z" fill="url(#logo-grad)" />
      <path d="M15.5 21.3 L27.5 14.7 V46 L21.5 40 L15.5 46 Z" fill="url(#logo-grad)" />
      <path d="M31 12.7 L43 6 V46 L37 40 L31 46 Z" fill="url(#logo-grad)" />
    </svg>

    <!-- Text: WEdata (hidden when sidebar collapsed) -->
    <span class="logo-text whitespace-nowrap leading-none group-data-[collapsible=icon]:hidden">
      <span class="font-bold text-primary">WE</span><span class="font-semibold text-foreground">data</span>
    </span>
  </div>
</template>

<style scoped>
div {
  --logo-grad-start: var(--color-orange-500);
  --logo-grad-end: var(--color-orange-700);
}

:root.dark div {
  --logo-grad-start: var(--color-orange-300);
  --logo-grad-end: var(--color-orange-500);
}

.logo-text {
  font-family: 'Inter', sans-serif;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  font-feature-settings: "cv02" 1;
}
</style>
