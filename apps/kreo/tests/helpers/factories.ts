import type { WidgetType } from '#shared/widgets/definitions'

let idCounter = 0

export function createTestWidget(overrides: Record<string, unknown> = {}): {
  id: string
  type: WidgetType
  order: number
  content: Record<string, unknown>
  styles: Record<string, unknown>
  children?: unknown[]
} {
  idCounter++
  return {
    id: `test-widget-${idCounter}`,
    type: 'title' as WidgetType,
    order: 0,
    content: { text: 'Test' },
    styles: { margin: '8px' },
    ...overrides,
  }
}

export function createContainerWidget(
  type: 'row' | 'column' | 'form' = 'row',
  children: ReturnType<typeof createTestWidget>[] = [],
  overrides: Record<string, unknown> = {},
) {
  return createTestWidget({
    type,
    children,
    ...overrides,
  })
}

export function createTestGlobalStyles(overrides: Record<string, unknown> = {}) {
  return {
    palette: 'turquoise',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    primaryColor: '#14b8a6',
    secondaryColor: '#0d9488',
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFontFamily: 'Inter, system-ui, sans-serif',
    baseFontSize: '16px',
    lineHeight: '1.6',
    contentPadding: '16px',
    widgetGap: '12px',
    borderRadius: '8px',
    pageTitle: '',
    metaDescription: '',
    ...overrides,
  }
}

export function createTestDesignDocument(overrides: Record<string, unknown> = {}) {
  return {
    version: '1.0',
    globalStyles: createTestGlobalStyles(),
    widgets: [],
    ...overrides,
  }
}

export function createVersionSummary(overrides: Record<string, unknown> = {}) {
  idCounter++
  return {
    id: idCounter,
    version: `1.${idCounter}`,
    widgetCount: 3,
    createdAt: '2025-01-15T10:00:00Z',
    isCurrent: false,
    ...overrides,
  }
}

export function createVersionDetail(overrides: Record<string, unknown> = {}) {
  idCounter++
  return {
    id: idCounter,
    version: `1.${idCounter}`,
    design: createTestDesignDocument(),
    widgetCount: 0,
    createdAt: '2025-01-15T10:00:00Z',
    isCurrent: false,
    ...overrides,
  }
}

export function createVersionsResponse(overrides: Record<string, unknown> = {}) {
  return {
    versions: [createVersionSummary({ id: 1, isCurrent: true }), createVersionSummary({ id: 2 })],
    pagination: {
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    },
    rateLimit: {
      remaining: 50,
      limit: 60,
      resetAt: '2025-01-15T11:00:00Z',
    },
    ...overrides,
  }
}

// ── Variable system factories ──────────────────────────────

export function createVariableField(overrides: Record<string, unknown> = {}) {
  return {
    name: 'firstName',
    type: 'recipient' as const,
    description: 'First name',
    example: 'Marie',
    ...overrides,
  }
}

export function createDataSet(overrides: Record<string, unknown> = {}) {
  return {
    key: 'm1',
    merged_preview_data: {
      firstName: 'Marie',
      lastName: 'Dupont',
      nom_magasin: 'Boutique Paris',
    },
    ...overrides,
  }
}

export function createVariableSchema(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'schema-uuid-123',
    globalVariables: [
      createVariableField({ name: 'nom_magasin', type: 'global', description: 'Store name' }),
      createVariableField({ name: 'horaires', type: 'global', description: 'Opening hours' }),
    ],
    recipientVariables: [
      createVariableField({ name: 'firstName', type: 'recipient' }),
      createVariableField({ name: 'lastName', type: 'recipient', description: 'Last name' }),
    ],
    dataSets: [
      createDataSet({ key: 'm1' }),
      createDataSet({
        key: 'm2',
        merged_preview_data: {
          firstName: 'Jean',
          lastName: 'Martin',
          nom_magasin: 'Boutique Lyon',
        },
      }),
    ],
    ...overrides,
  }
}

export function resetFactoryCounter() {
  idCounter = 0
}
