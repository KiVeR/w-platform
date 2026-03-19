export function isAlphaQuery(q: string): boolean {
  return /^[a-zA-ZÀ-ÿ\s-]{1,}$/.test(q)
}

export function isValidCommuneQuery(q: string): boolean {
  return isAlphaQuery(q) || /^\d{2,5}$/.test(q)
}
