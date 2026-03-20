import { computed, type Ref } from 'vue'
import { getSmsStats, isForbiddenMessage } from '../utils/sms'

export function useSmsEditor(message: Ref<string>) {
  const smsStats = computed(() => getSmsStats(message.value))
  const hasForbidden = computed(() => isForbiddenMessage(message.value))
  const isMultiSms = computed(() => smsStats.value.smsCount > 1)

  function insertVariable(token: string) {
    message.value += token
  }

  return { smsStats, hasForbidden, isMultiSms, insertVariable }
}
