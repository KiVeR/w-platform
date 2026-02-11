<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarIcon, Clock, Zap, CalendarClock, Info, AlertTriangle } from 'lucide-vue-next'
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

const tz = getLocalTimeZone()
const selectedDate = ref<CalendarDate | undefined>(undefined)
const selectedTime = ref<string>('')

const timeSlots = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const min = i % 2 === 0 ? '00' : '30'
  return `${String(hour).padStart(2, '0')}:${min}`
})

const todayDate = today(tz)

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function isDateDisabled(date: CalendarDate): boolean {
  return date.toDate(tz).getDay() === 0
}

function formatDate(date: CalendarDate): string {
  return date.toDate(tz).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function selectMode(mode: 'now' | 'schedule') {
  wizard.scheduleMode = mode
  if (mode === 'now') {
    wizard.campaign.scheduled_at = null
  }
}

const quickPicks = computed(() => {
  const now = today(tz)
  let tomorrow = now.add({ days: 1 })
  if (tomorrow.toDate(tz).getDay() === 0) tomorrow = tomorrow.add({ days: 1 })
  let nextMonday = now.add({ days: 1 })
  while (nextMonday.toDate(tz).getDay() !== 1) nextMonday = nextMonday.add({ days: 1 })
  return [
    { label: t('wizard.schedule.quickPicks.tomorrowMorning'), date: tomorrow, time: '10:00' },
    { label: t('wizard.schedule.quickPicks.nextMonday'), date: nextMonday, time: '10:00' },
  ]
})

function applyQuickPick(pick: { date: CalendarDate, time: string }) {
  selectedDate.value = pick.date
  selectedTime.value = pick.time
  wizard.isDirty = true
}

const isFarFuture = computed(() => {
  if (!selectedDate.value) return false
  const diff = selectedDate.value.toDate(tz).getTime() - today(tz).toDate(tz).getTime()
  return diff > THIRTY_DAYS_MS
})

watch([selectedDate, selectedTime], ([date, time]) => {
  if (date && time) {
    const [hours, minutes] = time.split(':').map(Number)
    const jsDate = date.toDate(tz)
    jsDate.setHours(hours, minutes, 0, 0)
    wizard.campaign.scheduled_at = jsDate.toISOString()
    wizard.isDirty = true
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
        class="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
        :class="wizard.scheduleMode === 'now'
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-primary/50'"
        @click="selectMode('now')"
      >
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Zap class="size-5 text-primary" />
            </div>
            <CardTitle>{{ t('wizard.schedule.sendNow') }}</CardTitle>
          </div>
        </CardHeader>
      </Card>

      <Card
        class="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
        :class="wizard.scheduleMode === 'schedule'
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-primary/50'"
        @click="selectMode('schedule')"
      >
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <CalendarClock class="size-5 text-primary" />
            </div>
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

      <div data-quick-picks class="flex flex-wrap gap-2">
        <Button
          v-for="pick in quickPicks"
          :key="pick.label"
          data-quick-pick
          variant="outline"
          size="sm"
          @click="applyQuickPick(pick)"
        >
          {{ pick.label }}
        </Button>
      </div>

      <Alert>
        <Info class="size-4" />
        <AlertDescription>{{ t('wizard.schedule.windowInfo') }}</AlertDescription>
      </Alert>

      <Alert v-if="isFarFuture" data-far-future-warning variant="destructive">
        <AlertTriangle class="size-4" />
        <AlertDescription>{{ t('wizard.schedule.farFutureWarning') }}</AlertDescription>
      </Alert>

      <Card v-if="scheduleSummary" data-schedule-summary>
        <CardContent class="flex items-center gap-3 pt-4">
          <CalendarIcon class="size-5 text-primary" />
          <span class="font-medium">{{ t('wizard.schedule.summary', scheduleSummary) }}</span>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
