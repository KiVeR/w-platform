<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Sparkles, MapPin, Trash2, Clock, ChevronDown } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTargetingTemplates } from '@/composables/useTargetingTemplates'
import type { CampaignTargeting, TargetingTemplateRow } from '@/types/campaign'

const props = defineProps<{
  activityType?: string | null
}>()

const emit = defineEmits<{
  select: [targeting: CampaignTargeting]
}>()

const { t } = useI18n()
const { templates, presets, isLoading, fetchTemplates, useTemplate, deleteTemplate } = useTargetingTemplates()

const showAll = ref(false)
const deleteTarget = ref<TargetingTemplateRow | null>(null)
const isDeleting = ref(false)

const MAX_VISIBLE = 5

const visibleTemplates = computed(() =>
  showAll.value ? templates.value : templates.value.slice(0, MAX_VISIBLE),
)

const hasMore = computed(() => templates.value.length > MAX_VISIBLE)

onMounted(() => {
  fetchTemplates(props.activityType)
})

async function handleSelect(template: TargetingTemplateRow): Promise<void> {
  const targeting = await useTemplate(template.id)
  if (targeting) {
    emit('select', targeting)
  }
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  isDeleting.value = true
  await deleteTemplate(deleteTarget.value.id)
  isDeleting.value = false
  deleteTarget.value = null
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return t('wizard.savedZones.today')
  if (days === 1) return t('wizard.savedZones.yesterday')
  return t('wizard.savedZones.daysAgo', { count: days })
}
</script>

<template>
  <Card v-if="!isLoading && (presets.length > 0 || templates.length > 0)" data-saved-zones class="border-dashed">
    <CardHeader class="pb-3">
      <CardTitle class="flex items-center gap-2 text-sm font-semibold">
        <MapPin class="size-4 text-primary" />
        {{ t('wizard.savedZones.title') }}
      </CardTitle>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Presets -->
      <div v-if="presets.length > 0" data-presets-section>
        <p class="mb-2 text-xs font-medium text-muted-foreground">{{ t('wizard.savedZones.presets') }}</p>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="preset in presets"
            :key="preset.id"
            variant="outline"
            size="sm"
            class="gap-1.5 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
            data-preset-button
            @click="handleSelect(preset)"
          >
            <Sparkles class="size-3 text-primary" />
            {{ preset.name }}
          </Button>
        </div>
      </div>

      <!-- Partner templates -->
      <div v-if="templates.length > 0" data-templates-section>
        <p class="mb-2 text-xs font-medium text-muted-foreground">{{ t('wizard.savedZones.myZones') }}</p>
        <div class="space-y-1">
          <div
            v-for="tpl in visibleTemplates"
            :key="tpl.id"
            class="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/50"
            data-template-item
            @click="handleSelect(tpl)"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ tpl.name }}</p>
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <span data-usage-count>{{ t('wizard.savedZones.usedCount', { count: tpl.usage_count }) }}</span>
                <template v-if="tpl.last_used_at">
                  <span>&middot;</span>
                  <span class="flex items-center gap-1">
                    <Clock class="size-3" />
                    {{ formatRelativeDate(tpl.last_used_at) }}
                  </span>
                </template>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              class="size-7 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              data-delete-button
              @click.stop="deleteTarget = tpl"
            >
              <Trash2 class="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <Button
          v-if="hasMore && !showAll"
          variant="ghost"
          size="sm"
          class="mt-1 w-full text-xs"
          data-show-all-button
          @click="showAll = true"
        >
          <ChevronDown class="mr-1 size-3" />
          {{ t('wizard.savedZones.showAll', { count: templates.length }) }}
        </Button>
      </div>

    </CardContent>

    <!-- Delete confirmation dialog -->
    <Dialog :open="deleteTarget !== null" @update:open="v => { if (!v) deleteTarget = null }">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('wizard.savedZones.deleteConfirm.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('wizard.savedZones.deleteConfirm.description', { name: deleteTarget?.name }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" :disabled="isDeleting" @click="deleteTarget = null">
            {{ t('wizard.savedZones.deleteConfirm.cancel') }}
          </Button>
          <Button variant="destructive" :disabled="isDeleting" data-confirm-delete @click="confirmDelete">
            {{ t('wizard.savedZones.deleteConfirm.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>
