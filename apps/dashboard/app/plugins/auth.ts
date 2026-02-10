import { useAuthStore } from '@/stores/auth'

export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['api'],
  async setup() {
    const auth = useAuthStore()
    await auth.init()
  },
})
