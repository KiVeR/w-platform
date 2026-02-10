import { usePartnerStore } from '@/stores/partner'

export default defineNuxtPlugin({
  name: 'partner',
  dependsOn: ['auth'],
  setup() {
    const partner = usePartnerStore()
    partner.init()
  },
})
