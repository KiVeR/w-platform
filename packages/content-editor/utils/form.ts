/**
 * Generates a valid HTML field name from a label
 * Converts to lowercase, removes accents, replaces special chars with underscores
 *
 * @example
 * generateFieldName('Votre nom') // 'votre_nom'
 * generateFieldName('Adresse e-mail') // 'adresse_e_mail'
 * generateFieldName('Prénom') // 'prenom'
 */
export function generateFieldName(label: string | undefined | null): string {
  if (!label)
    return ''
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
}
