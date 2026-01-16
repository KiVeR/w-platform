import { describe, expect, it } from 'vitest'
import { generateFieldName } from '@/utils/form'

describe('generateFieldName', () => {
  it('converts label to snake_case', () => {
    expect(generateFieldName('Votre nom')).toBe('votre_nom')
  })

  it('removes accents', () => {
    expect(generateFieldName('Adresse e-mail')).toBe('adresse_e_mail')
    expect(generateFieldName('Prénom')).toBe('prenom')
    expect(generateFieldName('Téléphone')).toBe('telephone')
  })

  it('handles special characters', () => {
    expect(generateFieldName('Numéro de téléphone')).toBe('numero_de_telephone')
    expect(generateFieldName('Message d\'erreur')).toBe('message_d_erreur')
  })

  it('returns empty string for empty input', () => {
    expect(generateFieldName('')).toBe('')
  })

  it('returns empty string for undefined/null-like input', () => {
    expect(generateFieldName(undefined as unknown as string)).toBe('')
  })

  it('handles numbers in labels', () => {
    expect(generateFieldName('Option 1')).toBe('option_1')
    expect(generateFieldName('Choix n°2')).toBe('choix_n_2')
  })

  it('removes leading and trailing underscores', () => {
    expect(generateFieldName('  Nom  ')).toBe('nom')
    expect(generateFieldName('__test__')).toBe('test')
  })

  it('collapses multiple underscores', () => {
    expect(generateFieldName('Nom   Prénom')).toBe('nom_prenom')
    expect(generateFieldName('A - B - C')).toBe('a_b_c')
  })
})
