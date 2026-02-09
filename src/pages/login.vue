<script setup lang="ts">
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

useHead({ title: 'Connexion' })

definePageMeta({
  title: 'Connexion',
})

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitted = ref(false)

const emailError = computed(() => {
  if (!submitted.value)
    return ''
  if (!email.value)
    return 'Email requis'
  if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email.value))
    return 'Email invalide'
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value)
    return ''
  if (!password.value)
    return 'Mot de passe requis'
  return ''
})

const isValid = computed(() => {
  return email.value && password.value && !emailError.value && !passwordError.value
})

async function handleSubmit() {
  submitted.value = true

  if (!isValid.value)
    return

  const success = await authStore.login(email.value, password.value)

  if (success) {
    router.push('/dashboard')
  }
}

function togglePassword() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="login-page">
    <div class="login-background" />

    <div class="login-container">
      <div class="login-header">
        <div class="logo-wrapper">
          <KreoLogoFull :size="56" />
        </div>
        <p class="login-subtitle">
          Connectez-vous pour accéder à l'éditeur
        </p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            :class="{ 'form-input--error': emailError }"
            placeholder="votre@email.com"
            autocomplete="email"
          >
          <span v-if="emailError" class="form-error">{{ emailError }}</span>
        </div>

        <div class="form-field">
          <label for="password" class="form-label">Mot de passe</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ 'form-input--error': passwordError }"
              placeholder="••••••••"
              autocomplete="current-password"
            >
            <button
              type="button"
              class="password-toggle"
              @click="togglePassword"
            >
              <Eye v-if="!showPassword" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
          <span v-if="passwordError" class="form-error">{{ passwordError }}</span>
        </div>

        <div v-if="authStore.error" class="form-alert">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          class="submit-button"
          :disabled="authStore.isLoading"
        >
          <Loader2 v-if="authStore.isLoading" :size="18" class="animate-spin" />
          <span v-else>Se connecter</span>
        </button>
      </form>

      <p class="login-footer">
        Pas encore de compte ?
        <NuxtLink to="/register" class="login-link">
          Créer un compte
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%);
  padding: var(--space-4);
  position: relative;
}

.login-background {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0);
  background-size: 32px 32px;
  opacity: 0.5;
}

.login-container {
  position: relative;
  width: 100%;
  max-width: 420px;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 48px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-3);
  animation: logoAppear 0.6s ease-out 0.1s both;
}

@keyframes logoAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.login-subtitle {
  font-size: var(--text-sm);
  color: #64748b;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  animation: fieldAppear 0.4s ease-out both;
}

.form-field:nth-child(1) { animation-delay: 0.2s; }
.form-field:nth-child(2) { animation-delay: 0.3s; }

@keyframes fieldAppear {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background-color: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input--error {
  border-color: #ef4444;
}

.form-input--error:focus {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.form-error {
  font-size: 13px;
  color: #ef4444;
}

.password-wrapper {
  position: relative;
}

.password-wrapper .form-input {
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.password-toggle:hover {
  color: #64748b;
  background: #f1f5f9;
}

.form-alert {
  padding: 12px 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 14px;
}

.submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: buttonAppear 0.4s ease-out 0.4s both;
}

@keyframes buttonAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-footer {
  margin-top: var(--space-6);
  text-align: center;
  font-size: var(--text-sm);
  color: #64748b;
}

.login-link {
  color: #14b8a6;
  text-decoration: none;
  font-weight: 600;
}

.login-link:hover {
  text-decoration: underline;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
