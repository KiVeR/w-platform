<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarIcon, Clock, Zap, CalendarClock, Info } from 'lucide-vue-next'
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCampaignWizardStore } from '@/stores/campaignWizard'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const selectedDate = ref<CalendarDate | undefined>(undefined)
const selectedTime = ref<string>('')

const timeSlots = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const min = i % 2 === 0 ? '00' : '30'
  return `${String(hour).padStart(2, '0')}:${min}`
})

const todayDate = today(getLocalTimeZone())

function isDateDisabled(date: CalendarDate): boolean {
  return date.toDate(getLocalTimeZone()).getDay() === 0
}

function formatDate(date: CalendarDate): string {
  return date.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function setMode(mode: 'now' | 'schedule') {
  wizard.scheduleMode = mode
  if (mode === 'now') {
    wizard.campaign.scheduled_at = null
  }
}

watch([selectedDate, selectedTime], ([date, time]) => {
  if (date && time) {
    const [hours, minutes] = time.split(':').map(Number)
    const jsDate = date.toDate(getLocalTimeZone())
    jsDate.setHours(hours, minutes, 0, 0)
    wizard.campaign.scheduled_at = jsDate.toISOString()
  }
})

const scheduleSummary = computed(() => {
  if (!selectedDate.value || !selectedTime.value) return null
  return {
    date: formatDate(selectedDate.value),
    time: selectedTime.value,
  }
})
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">{{ t('wizard.schedule.title') }}</h2>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card
        class="cursor-pointer transition-all"
        :class="wizard.scheduleMode === 'now'
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-primary/50'"
        @click="setMode('now')"
      >
        <CardHeader>
          <div class="flex items-center gap-3">
            <Zap class="size-6 text-primary" />
            <CardTitle>{{ t('wizard.schedule.sendNow') }}</CardTitle>
          </div>
        </CardHeader>
      </Card>

      <Card
        class="cursor-pointer transition-all"
        :class="wizard.scheduleMode === 'schedule'
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-primary/50'"
        @click="setMode('schedule')"
      >
        <CardHeader>
          <div class="flex items-center gap-3">
            <CalendarClock class="size-6 text-primary" />
            <CardTitle>{{ t('wizard.schedule.scheduleLater') }}</CardTitle>
          </div>
        </CardHeader>
      </Card>
    </div>

    <div v-if="wizard.scheduleMode === 'schedule'" data-schedule-form class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('wizard.schedule.date') }}</label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="w-full justify-start text-left font-normal">
                <CalendarIcon class="mr-2 size-4" />
                <span v-if="selectedDate">{{ formatDate(selectedDate) }}</span>
                <span v-else class="text-muted-foreground">{{ t('wizard.schedule.date') }}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar
                v-model="selectedDate"
                :min-value="todayDate"
                :is-date-disabled="isDateDisabled"
                locale="fr-FR"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('wizard.schedule.time') }}</label>
          <Select v-model="selectedTime">
            <SelectTrigger>
              <div class="flex items-center gap-2">
                <Clock class="size-4" />
                <SelectValue :placeholder="t('wizard.schedule.time')" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="slot in timeSlots" :key="slot" :value="slot">
                {{ slot }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Alert>
        <Info class="size-4" />
        <AlertDescription>{{ t('wizard.schedule.windowInfo') }}</AlertDescription>
      </Alert>

      <Card v-if="scheduleSummary">
        <CardContent class="flex items-center gap-3 pt-4">
          <CalendarIcon class="size-5 text-primary" />
          <span>{{ t('wizard.schedule.summary', scheduleSummary) }}</span>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
