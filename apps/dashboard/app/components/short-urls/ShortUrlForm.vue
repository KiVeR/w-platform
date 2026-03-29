<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Eye } from 'lucide-vue-next'
import { useShortUrlForm } from '@/composables/useShortUrlForm'
import type { ShortUrl } from '@/types/shortUrl'

const props = defineProps<{ shortUrl?: ShortUrl }>()
const emit = defineEmits<{ saved: [id: number]; cancel: [] }>()
const { t } = useI18n()

const shortUrlRef = ref<ShortUrl | null>(props.shortUrl ?? null)
const { form, isSaving, saveError, fakePreview, isEditMode, populateFromExisting, generatePreview, submit } = useShortUrlForm(shortUrlRef)

// Populate when shortUrl prop changes (edit mode)
watch(() => props.shortUrl, (val) => {
  if (val) { shortUrlRef.value = val; populateFromExisting() }
}, { immediate: true })

async function handleSubmit() {
  const id = await submit()
  if (id) emit('saved', id)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ isEditMode ? t('shortUrls.form.editTitle') : t('shortUrls.form.createTitle') }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Section: Identifiant -->
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>{{ t('shortUrls.form.slugLabel') }}</Label>
          <Input v-model="form.slug" :placeholder="t('shortUrls.form.slugPlaceholder')" />
          <p class="text-sm text-muted-foreground">{{ t('shortUrls.form.slugHint') }}</p>
        </div>
        <!-- Preview (creation only) -->
        <div v-if="!isEditMode" class="flex items-center gap-2">
          <div class="space-y-2 flex-1">
            <Label>{{ t('shortUrls.form.prefixLabel') }}</Label>
            <Input v-model="form.prefix" :placeholder="t('shortUrls.form.prefixPlaceholder')" />
          </div>
          <div class="space-y-2 w-24">
            <Label>{{ t('shortUrls.form.lengthLabel') }}</Label>
            <Input v-model.number="form.length" type="number" min="3" max="12" />
          </div>
          <Button variant="outline" class="mt-auto" @click="generatePreview" data-preview-btn>
            <Eye class="mr-2 size-4" />{{ t('shortUrls.form.preview') }}
          </Button>
        </div>
        <p v-if="fakePreview" class="text-sm font-mono bg-muted p-2 rounded" data-preview-text>{{ fakePreview }}</p>
      </div>

      <!-- Section: Destination -->
      <div class="space-y-2">
        <Label>{{ t('shortUrls.form.linkLabel') }}</Label>
        <Input v-model="form.link" type="url" :placeholder="t('shortUrls.form.linkPlaceholder')" />
      </div>

      <!-- Section: Options -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <Label>{{ t('shortUrls.form.traceableLabel') }}</Label>
            <p class="text-sm text-muted-foreground">{{ t('shortUrls.form.traceableHint') }}</p>
          </div>
          <Switch v-model:checked="form.is_traceable_by_recipient" />
        </div>
        <div class="flex items-center justify-between">
          <Label>{{ t('shortUrls.form.draftLabel') }}</Label>
          <Switch v-model:checked="form.is_draft" />
        </div>
        <div v-if="isEditMode" class="flex items-center justify-between">
          <Label>{{ t('shortUrls.form.enabledLabel') }}</Label>
          <Switch v-model:checked="form.is_enabled" />
        </div>
      </div>

      <!-- Error -->
      <p v-if="saveError" class="text-sm text-destructive" data-save-error>{{ saveError }}</p>
    </CardContent>
    <CardFooter class="flex justify-end gap-3">
      <Button variant="ghost" @click="emit('cancel')" data-cancel-btn>{{ t('common.cancel') }}</Button>
      <Button @click="handleSubmit" :disabled="isSaving" data-save-btn>{{ t('common.confirm') }}</Button>
    </CardFooter>
  </Card>
</template>
