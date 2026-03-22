export interface SmsVariable {
  key: string
  token: string // '${prenom}'
  label: string // traduit par l'app consommatrice
}

export interface SmsLabels {
  name: string
  namePlaceholder: string
  sender: string
  senderPlaceholder: string
  senderHelp: string
  messageLabel: string
  messagePlaceholder: string
  insertVariable: string
  stopTitle: string
  stopDescription: string
  multiSmsWarning: string
  forbiddenDomain: string
  charCount: string
  smsCount: string
  encoding: string
  previewPlaceholder: string
}

export interface SmsStats {
  charCount: number
  smsCount: number
  encoding: 'gsm7' | 'gsm7ext' | 'ucs2'
  remaining: number
  maxChars: number
}
