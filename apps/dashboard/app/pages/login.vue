<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { loadScript, initializeGoogleAuth, renderGoogleButton } from '@/services/googleAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import AppLogo from '@/components/layout/AppLogo.vue'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const auth = useAuthStore()

const showPassword = ref(false)
const googleButtonRef = ref<HTMLElement | null>(null)
const showGoogleButton = ref(false)

const schema = toTypedSchema(
  z.object({
    email: z
      .string({ required_error: t('login.validation.emailRequired') })
      .min(1, t('login.validation.emailRequired'))
      .email(t('login.validation.emailInvalid')),
    password: z
      .string({ required_error: t('login.validation.passwordRequired') })
      .min(1, t('login.validation.passwordRequired'))
      .min(6, t('login.validation.passwordMin')),
  }),
)

const { handleSubmit } = useForm({ validationSchema: schema })

const onSubmit = handleSubmit(async (values) => {
  await auth.login(values.email, values.password)
  if (!auth.error) await navigateTo('/')
})

onMounted(async () => {
  const clientId = useRuntimeConfig().public.googleClientId as string
  if (!clientId || !googleButtonRef.value) return

  try {
    await loadScript()
    initializeGoogleAuth(clientId, async (response) => {
      await auth.loginWithGoogle(response.credential)
      if (!auth.error) await navigateTo('/')
    })
    renderGoogleButton(googleButtonRef.value, { width: 368 })
    showGoogleButton.value = true
  } catch {
    // GIS SDK load failure — silent, email/password still available
  }
})
</script>

<template>
  <Card class="mx-auto w-full max-w-100">
    <CardHeader class="items-center text-center">
      <AppLogo class="mb-4" />
      <CardTitle class="text-xl">{{ t('login.title') }}</CardTitle>
      <CardDescription>{{ t('login.subtitle') }}</CardDescription>
    </CardHeader>
    <CardContent>
      <Alert v-if="auth.error" variant="destructive" class="mb-4">
        <AlertDescription>{{ auth.error }}</AlertDescription>
      </Alert>

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>{{ t('login.email') }}</FormLabel>
            <FormControl>
              <Input
                type="email"
                :placeholder="t('login.emailPlaceholder')"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>{{ t('login.password') }}</FormLabel>
            <FormControl>
              <div class="relative">
                <Input
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('login.passwordPlaceholder')"
                  class="pr-10"
                  v-bind="componentField"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  :aria-label="showPassword ? t('login.hidePassword') : t('login.showPassword')"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="size-4" />
                  <Eye v-else class="size-4" />
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <Button type="submit" class="w-full" :disabled="auth.isLoading">
          <Loader2 v-if="auth.isLoading" class="mr-2 size-4 animate-spin" />
          {{ auth.isLoading ? t('login.submitting') : t('login.submit') }}
        </Button>
      </form>

      <template v-if="showGoogleButton">
        <div class="relative my-6">
          <Separator />
          <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            {{ t('login.or') }}
          </span>
        </div>
      </template>

      <div ref="googleButtonRef" class="flex justify-center" />
    </CardContent>
  </Card>
</template>
