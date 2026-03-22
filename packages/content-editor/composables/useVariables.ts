export const VARIABLE_PATTERN = /\$\{([^}]+)\}/g

interface TextInputElement {
  value: string
  selectionStart: number | null
  selectionEnd: number | null
  focus: () => void
  setSelectionRange: (start: number, end: number) => void
  dispatchEvent: (event: Event) => boolean
}

export function useVariables() {
  function extractVariables(text: string): string[] {
    if (!text)
      return []
    const names = new Set<string>()
    for (const match of text.matchAll(VARIABLE_PATTERN)) {
      const variableName = match[1]
      if (variableName)
        names.add(variableName)
    }
    return [...names]
  }

  function hasVariables(text: string): boolean {
    if (!text)
      return false
    VARIABLE_PATTERN.lastIndex = 0
    return VARIABLE_PATTERN.test(text)
  }

  function resolveVariables(text: string, data?: Record<string, string>): string {
    if (!text)
      return ''
    if (!data)
      return text
    return text.replace(VARIABLE_PATTERN, (full, name) => {
      if (name in data)
        return String(data[name])
      return full
    })
  }

  function findUndefinedVariables(text: string, knownNames: string[]): string[] {
    const found = extractVariables(text)
    const known = new Set(knownNames)
    return found.filter(name => !known.has(name))
  }

  function insertAtCursor(
    element: TextInputElement,
    varName: string,
  ): string {
    const start = element.selectionStart ?? element.value.length
    const end = element.selectionEnd ?? start
    const variable = `\${${varName}}`
    const newValue = element.value.slice(0, start) + variable + element.value.slice(end)

    element.value = newValue
    element.focus()
    const cursorPos = start + variable.length
    element.setSelectionRange(cursorPos, cursorPos)
    element.dispatchEvent(new Event('input', { bubbles: true }))

    return newValue
  }

  return {
    extractVariables,
    hasVariables,
    resolveVariables,
    findUndefinedVariables,
    insertAtCursor,
  }
}
