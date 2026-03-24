<script setup lang="ts">
import type { DemandeRow } from '../types/demandes'

const props = defineProps<{
  demandes: DemandeRow[]
  isLoading: boolean
  sort: string
}>()

const emit = defineEmits<{
  select: [demande: DemandeRow]
  sort: [field: string]
}>()

const { t, locale } = useI18n()

const sortField = computed(() => {
  if (!props.sort) return ''
  return props.sort.startsWith('-') ? props.sort.slice(1) : props.sort
})

const sortDir = computed(() => {
  return props.sort.startsWith('-') ? 'desc' : 'asc'
})

function onSort(field: string) {
  if (sortField.value === field) {
    emit('sort', sortDir.value === 'asc' ? `-${field}` : field)
  } else {
    emit('sort', field)
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function progressPercent(demande: DemandeRow): number {
  if (demande.operations_count === 0) return 0
  return Math.round((demande.operations_completed_count / demande.operations_count) * 100)
}
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-12 bg-muted animate-pulse rounded" />
    </div>

    <!-- Empty state -->
    <div v-else-if="demandes.length === 0" class="text-center py-12 text-muted-foreground">
      <slot name="empty">
        {{ t('demandes.list.empty') }}
      </slot>
    </div>

    <!-- Table -->
    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead class="cursor-pointer select-none" @click="onSort('ref_demande')">
            {{ t('demandes.list.columns.reference') }}
            <span v-if="sortField === 'ref_demande'" class="ml-1">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
          </TableHead>
          <TableHead>{{ t('demandes.list.columns.partner') }}</TableHead>
          <TableHead>{{ t('demandes.list.columns.operations') }}</TableHead>
          <TableHead>{{ t('demandes.list.columns.blocked') }}</TableHead>
          <TableHead class="cursor-pointer select-none" @click="onSort('created_at')">
            {{ t('demandes.list.columns.date') }}
            <span v-if="sortField === 'created_at'" class="ml-1">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="demande in demandes"
          :key="demande.id"
          class="cursor-pointer hover:bg-muted/50"
          @click="emit('select', demande)"
        >
          <TableCell class="font-medium">{{ demande.ref_demande }}</TableCell>
          <TableCell>{{ demande.partner?.name ?? '—' }}</TableCell>
          <TableCell>
            <div class="flex flex-col gap-1 min-w-[80px]">
              <span class="text-sm">{{ demande.operations_completed_count }}/{{ demande.operations_count }}</span>
              <div class="w-full bg-muted rounded-full h-1.5">
                <div
                  class="bg-primary h-1.5 rounded-full transition-all"
                  :style="{ width: `${progressPercent(demande)}%` }"
                />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <span
              v-if="demande.operations_blocked_count > 0"
              class="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-0.5 min-w-[1.5rem]"
            >
              {{ demande.operations_blocked_count }}
            </span>
          </TableCell>
          <TableCell>{{ formatDate(demande.created_at) }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
