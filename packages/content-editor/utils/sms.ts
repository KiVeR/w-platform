import type { SmsStats } from '../types/sms'

export const MAX_MESSAGE_1_CHARS = 149
export const MAX_MESSAGE_2_CHARS = 295
export const MAX_SENDER_CHARS = 11

const GSM7_BASIC = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZ ÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyz äöñüà'
const GSM7_EXTENDED_CHARS = '\\^€{}[]~|'

export function countSmsChars(message: string): number {
  let count = 0
  for (const char of message) {
    count += GSM7_EXTENDED_CHARS.includes(char) ? 2 : 1
  }
  return count
}

export function getSmsCount(message: string): number {
  const chars = countSmsChars(message)
  if (chars === 0) return 0
  if (chars <= MAX_MESSAGE_1_CHARS) return 1
  return 2
}

export function isGsm7(message: string): boolean {
  for (const char of message) {
    if (!GSM7_BASIC.includes(char) && !GSM7_EXTENDED_CHARS.includes(char)) {
      return false
    }
  }
  return true
}

export function getEncoding(message: string): 'gsm7' | 'gsm7ext' | 'ucs2' {
  if (!isGsm7(message)) return 'ucs2'
  for (const char of message) {
    if (GSM7_EXTENDED_CHARS.includes(char)) return 'gsm7ext'
  }
  return 'gsm7'
}

export function isForbiddenMessage(message: string): boolean {
  return message.toLowerCase().includes('rsms.co')
}

export function getSmsStats(message: string): SmsStats {
  const charCount = countSmsChars(message)
  const smsCount = getSmsCount(message)
  const maxChars = smsCount <= 1 ? MAX_MESSAGE_1_CHARS : MAX_MESSAGE_2_CHARS
  const remaining = maxChars - charCount

  return {
    charCount,
    smsCount,
    encoding: getEncoding(message),
    remaining,
    maxChars,
  }
}
