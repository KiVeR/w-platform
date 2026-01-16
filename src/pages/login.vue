<script setup lang="ts">
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

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
    <div class="login-container">
      <div class="login-header">
        <h1 class="login-title">
          Landing Page Editor
        </h1>
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
  background-color: var(--color-background);
  padding: var(--space-4);
}

.login-container {
  width: 100%;
  max-width: 400px;
  background-color: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.login-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.login-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
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
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.form-input--error {
  border-color: var(--color-error);
}

.form-input--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-error {
  font-size: var(--text-xs);
  color: var(--color-error);
}

.password-wrapper {
  position: relative;
}

.password-wrapper .form-input {
  padding-right: 44px;
}

.password-toggle {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.password-toggle:hover {
  color: var(--color-text);
}

.form-alert {
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-error-50);
  border: 1px solid var(--color-error-200);
  border-radius: var(--radius-md);
  color: var(--color-error-700);
  font-size: var(--text-sm);
}

.submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.submit-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-footer {
  margin-top: var(--space-6);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.login-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-medium);
}

.login-link:hover {
  text-decoration: underline;
}
</style>
