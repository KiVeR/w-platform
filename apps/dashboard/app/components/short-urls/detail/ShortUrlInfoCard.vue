<script setup lang="ts">
import { Copy } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ShortUrl } from '@/types/shortUrl'

const props = defineProps<{ shortUrl: ShortUrl; canManage?: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
const { t } = useI18n()

async function copySlug() {
  await navigator.clipboard.writeText(props.shortUrl.slug)
  toast.success(t('shortUrls.detail.copySuccess'))
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('shortUrls.detail.title') }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Short link with copy button -->
      <div class="flex items-center gap-2">
        <span class="font-mono text-sm">{{ shortUrl.slug }}</span>
        <Button variant="ghost" size="sm" data-copy-btn @click="copySlug">
          <Copy class="h-4 w-4" />
        </Button>
      </div>

      <!-- Destination URL -->
      <div>
        <p class="text-xs text-muted-foreground mb-1">{{ t('shortUrls.detail.destination') }}</p>
        <a
          v-if="shortUrl.link"
          :href="shortUrl.link"
          target="_blank"
          class="text-sm text-primary hover:underline break-all"
        >
          {{ shortUrl.link }}
        </a>
        <Badge v-else variant="secondary">{{ t('shortUrls.detail.internalLink') }}</Badge>
      </div>

      <!-- Badges row -->
      <div class="flex flex-wrap gap-2">
        <Badge :variant="shortUrl.is_enabled ? 'default' : 'destructive'">
          {{ shortUrl.is_enabled ? t('shortUrls.detail.enabled') : t('shortUrls.detail.disabled') }}
        </Badge>
        <Badge variant="outline">
          {{ shortUrl.is_draft ? t('shortUrls.detail.draft') : t('shortUrls.detail.published') }}
        </Badge>
        <Badge variant="secondary">
          {{ shortUrl.is_traceable_by_recipient ? t('shortUrls.detail.traceable') : t('shortUrls.detail.notTraceable') }}
        </Badge>
      </div>

      <!-- Toggle enabled button -->
      <Button
        v-if="canManage"
        :variant="shortUrl.is_enabled ? 'destructive' : 'default'"
        size="sm"
        data-toggle-btn
        @click="emit('toggle')"
      >
        {{ shortUrl.is_enabled ? t('shortUrls.detail.actionDisable') : t('shortUrls.detail.actionEnable') }}
      </Button>

      <!-- Import ID -->
      <p v-if="shortUrl.import_id" class="text-sm text-muted-foreground">
        {{ t('shortUrls.detail.importId') }} : {{ shortUrl.import_id }}
      </p>
    </CardContent>
  </Card>
</template>
