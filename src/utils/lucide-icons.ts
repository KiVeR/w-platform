import type { Component } from 'vue'
import * as icons from 'lucide-vue-next'

/**
 * Get a Lucide icon component by its PascalCase name
 * @param name - PascalCase icon name (e.g., 'Star', 'Phone', 'MapPin')
 * @returns The icon component or null if not found
 */
export function getLucideIcon(name: string): Component | null {
  if (!name)
    return null

  // Direct lookup by PascalCase name
  const icon = (icons as unknown as Record<string, Component>)[name]
  if (icon)
    return icon

  // Try converting common formats to PascalCase
  const pascalName = toPascalCase(name)
  return (icons as unknown as Record<string, Component>)[pascalName] || null
}

/**
 * Check if a string is a valid Lucide icon name
 * @param name - The string to check
 * @returns true if it's a valid Lucide icon name
 */
export function isLucideIconName(name: string): boolean {
  if (!name)
    return false

  // Check direct match
  if (name in icons)
    return true

  // Check PascalCase conversion
  const pascalName = toPascalCase(name)
  return pascalName in icons
}

/**
 * Check if a string contains emoji characters
 * @param str - The string to check
 * @returns true if the string contains emojis
 */
export function isEmoji(str: string): boolean {
  if (!str)
    return false

  // Use Unicode emoji property for reliable detection
  // This regex matches emoji presentation characters
  const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u
  return emojiRegex.test(str)
}

/**
 * Convert a string to PascalCase
 * @param str - Input string (kebab-case, camelCase, or space-separated)
 * @returns PascalCase string
 */
function toPascalCase(str: string): string {
  return str
    // Handle kebab-case
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    // Handle snake_case
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase())
    // Handle spaces
    .replace(/\s+([a-z])/g, (_, char) => char.toUpperCase())
    // Capitalize first letter
    .replace(/^[a-z]/, char => char.toUpperCase())
}

/**
 * Get all available Lucide icon names
 * @returns Array of all icon names (PascalCase)
 */
export function getAllIconNames(): string[] {
  return Object.keys(icons).filter(key =>
    // Filter out non-component exports (like createIcons, etc.)
    key !== 'default'
    && key !== 'createIcons'
    && key !== 'icons'
    && typeof (icons as unknown as Record<string, unknown>)[key] === 'object',
  )
}

/**
 * Search icons by name (fuzzy search)
 * @param query - Search query
 * @param limit - Maximum results to return
 * @returns Array of matching icon names
 */
export function searchIcons(query: string, limit = 50): string[] {
  if (!query || query.length < 1)
    return []

  const normalizedQuery = query.toLowerCase().trim()
  const allIcons = getAllIconNames()

  // Score and sort results
  const scored = allIcons
    .map((name) => {
      const lowerName = name.toLowerCase()
      let score = 0

      // Exact match
      if (lowerName === normalizedQuery)
        score = 100
      // Starts with query
      else if (lowerName.startsWith(normalizedQuery))
        score = 80
      // Contains query
      else if (lowerName.includes(normalizedQuery))
        score = 60
      // Fuzzy match (characters in order)
      else if (fuzzyMatch(normalizedQuery, lowerName))
        score = 40

      return { name, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.name)

  return scored
}

/**
 * Simple fuzzy matching - checks if all characters appear in order
 */
function fuzzyMatch(query: string, target: string): boolean {
  let queryIndex = 0
  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (target[i] === query[queryIndex]) {
      queryIndex++
    }
  }
  return queryIndex === query.length
}
