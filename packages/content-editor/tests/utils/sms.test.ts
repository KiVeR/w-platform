import { describe, expect, test } from 'vitest'
import {
  countSmsChars,
  getEncoding,
  getSmsCount,
  getSmsStats,
  isForbiddenMessage,
  isGsm7,
  MAX_MESSAGE_1_CHARS,
  MAX_MESSAGE_2_CHARS,
} from '../../utils/sms'

describe('countSmsChars', () => {
  test('compte les caracteres simples', () => {
    expect(countSmsChars('Hello')).toBe(5)
    expect(countSmsChars('Bonjour le monde')).toBe(16)
  })

  test('compte les caracteres etendus en double', () => {
    expect(countSmsChars('Prix: 10€')).toBe(10) // € compte double
    expect(countSmsChars('[test]')).toBe(8) // [ et ] comptent double chacun
    expect(countSmsChars('a\\b^c')).toBe(7) // \\ et ^ comptent double
  })

  test('message vide retourne 0', () => {
    expect(countSmsChars('')).toBe(0)
  })
})

describe('getSmsCount', () => {
  test('retourne 0 pour message vide', () => {
    expect(getSmsCount('')).toBe(0)
  })

  test('retourne 1 pour message <= 149 chars', () => {
    expect(getSmsCount('a'.repeat(149))).toBe(1)
    expect(getSmsCount('Hello')).toBe(1)
  })

  test('retourne 2 pour message > 149 chars', () => {
    expect(getSmsCount('a'.repeat(150))).toBe(2)
    expect(getSmsCount('a'.repeat(295))).toBe(2)
  })
})

describe('isGsm7', () => {
  test('retourne true pour ASCII standard', () => {
    expect(isGsm7('Hello World 123!')).toBe(true)
    expect(isGsm7('Bonjour, comment ca va?')).toBe(true)
  })

  test('retourne true pour message vide', () => {
    expect(isGsm7('')).toBe(true)
  })

  test('retourne true pour caracteres etendus GSM7', () => {
    expect(isGsm7('Prix: 10€')).toBe(true)
    expect(isGsm7('[test]')).toBe(true)
  })

  test('retourne false pour emoji ou caracteres non-GSM', () => {
    expect(isGsm7('Hello 😀')).toBe(false)
    expect(isGsm7('中文')).toBe(false)
  })
})

describe('getEncoding', () => {
  test('retourne gsm7 pour message simple', () => {
    expect(getEncoding('Hello World')).toBe('gsm7')
  })

  test('retourne gsm7ext si extended chars presents', () => {
    expect(getEncoding('Prix: 10€')).toBe('gsm7ext')
    expect(getEncoding('[test]')).toBe('gsm7ext')
  })

  test('retourne ucs2 si caracteres non-GSM', () => {
    expect(getEncoding('Hello 😀')).toBe('ucs2')
  })
})

describe('isForbiddenMessage', () => {
  test('retourne true si contient rsms.co', () => {
    expect(isForbiddenMessage('Voir https://rsms.co/abc')).toBe(true)
    expect(isForbiddenMessage('RSMS.CO')).toBe(true)
  })

  test('retourne false sinon', () => {
    expect(isForbiddenMessage('Bonjour le monde')).toBe(false)
  })
})

describe('getSmsStats', () => {
  test('retourne un objet complet avec remaining correct', () => {
    const stats = getSmsStats('Hello World')
    expect(stats.charCount).toBe(11)
    expect(stats.smsCount).toBe(1)
    expect(stats.encoding).toBe('gsm7')
    expect(stats.remaining).toBe(138) // 149 - 11
    expect(stats.maxChars).toBe(149)
  })

  test('message vide retourne charCount 0, smsCount 0, remaining 149', () => {
    const stats = getSmsStats('')
    expect(stats.charCount).toBe(0)
    expect(stats.smsCount).toBe(0)
    expect(stats.remaining).toBe(149)
    expect(stats.maxChars).toBe(149)
  })

  test('message long passe en 2 SMS avec maxChars 295', () => {
    const stats = getSmsStats('a'.repeat(200))
    expect(stats.smsCount).toBe(2)
    expect(stats.maxChars).toBe(MAX_MESSAGE_2_CHARS)
    expect(stats.remaining).toBe(95) // 295 - 200
  })

  test('message exactement a la limite 1 SMS', () => {
    const stats = getSmsStats('a'.repeat(MAX_MESSAGE_1_CHARS))
    expect(stats.smsCount).toBe(1)
    expect(stats.remaining).toBe(0)
  })
})
