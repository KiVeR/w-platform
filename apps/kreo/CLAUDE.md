# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kreo - Visual content editor in Vue 3 with drag-and-drop interface. Create landing pages, RCS campaigns, and AI-powered marketing content.

## Commands

```bash
pnpm dev          # Dev server (port 5174)
pnpm build        # Compile TypeScript + Vite build
pnpm lint         # ESLint
pnpm lint:fix     # ESLint with auto-fix
pnpm test         # Vitest unit tests
pnpm test:coverage # Vitest with coverage
pnpm test:e2e     # Playwright E2E tests
pnpm db:generate  # Prisma generate
pnpm db:push      # Prisma db push
pnpm db:migrate   # Prisma migrate dev
pnpm db:studio    # Prisma Studio
pnpm user         # User management CLI
pnpm user:seed    # Seed users
```

## Architecture

### Pinia Stores (`app/stores/`)

| Store | Responsibility |
|-------|----------------|
| `editor` | Design document, save state, global styles |
| `widgets` | Widget CRUD, widget tree, drag-drop reordering |
| `selection` | Selected widget, keyboard navigation |
| `ui` | Editor mode (designer/preview/expert/history), sidebar visibility, options tab |
| `history` | Undo/redo (max 50 actions) |
| `auth` | Authentication, user session, tokens, login/logout |
| `content` | Single content metadata (id, type, title, status) |
| `contents` | Content list, dashboard, pagination, filtering |
| `presets` | Template and section presets |
| `versionHistory` | Version history, restore, diff |
| `aiChat` | AI chat interface, design generation |

### Widget System

Centralized configuration in `app/config/widgets.ts`:
- Each widget has a `type`, `defaultContent` and `defaultStyles`
- Container widgets (`row`, `column`, `form`): `canHaveChildren: true` property
- Parent-child constraints via `allowedChildren` / `disallowedChildren`

Renderer implementations in `app/components/widgets/registry/`.

### Widget Categories

- **content**: title, text, image, separator, spacer, icon
- **actions**: button, click-to-call, link-image
- **layout**: row, column, form, form-field
- **media**: video, map, social, gallery, slider
- **interactive**: barcode, store-locator, drive, scratch, flipcard, effect

### Adding a New Widget

**Step 1: Define the widget type (Single Source of Truth)**
- Add the type to `WIDGET_TYPES` array in `shared/widgets/definitions.ts`
- This automatically updates TypeScript types and Zod schemas

**Step 2: Add widget configuration in `app/config/widgets.ts`**
Required properties:
```
type: 'my-widget'
label: 'Mon Widget'              // French label for UI
icon: '🔧'
category: 'content'              // content | actions | layout | media | interactive
description: 'English description for LLM...'
usageHints: ['Hint 1', 'Hint 2'] // Tips for LLM and users
requiredContent: ['prop1']       // Required content properties
examples: [{ description, widget }]  // JSON examples for LLM
defaultContent: { prop1: 'value' }
defaultStyles: { margin: '8px' }
// For containers only:
canHaveChildren: true
allowedChildren: ['type1'] OR disallowedChildren: ['type2']
```

**Step 3: Create Zod schema in `shared/schemas/widgets/`**
- Add content validation schema in the appropriate category file (content, actions, layout, media, interactive)
- Export from `shared/schemas/widgets/index.ts`

**Step 4: Create renderer component**
- Create `app/components/widgets/registry/MyWidgetWidget.vue`
- Import and register in `WidgetRenderer.vue`, `WidgetRendererInner.vue`, and `PreviewRenderer.vue`
- Add icon mapping in `WidgetItem.vue`

**Widget Placeholder Pattern (required for empty states):**
```vue
<script setup>
import { Wrench } from 'lucide-vue-next' // Use appropriate Lucide icon
</script>

<template>
  <div class="my-widget" :style="{ margin: widget.styles.margin }">
    <div v-if="!hasContent" class="my-widget-placeholder">
      <Wrench :size="32" class="placeholder-icon" />
      <span class="placeholder-text">Label du widget</span>
    </div>
    <div v-else class="my-widget-content">
      <!-- Actual content here -->
    </div>
  </div>
</template>

<style scoped>
/* IMPORTANT: Widget wrapper should NOT have width: 100% to allow placeholder centering */
.my-widget {
  /* No width: 100% here! Let flexbox parent control width */
}

.my-widget-placeholder {
  width: 100%;
  min-height: 120px;
  background-color: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.placeholder-icon {
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 14px;
}

/* Content takes full width when present */
.my-widget-content {
  width: 100%;
}
</style>
```
Key requirements:
- **NO EMOJIS** - Always use Lucide icons (`lucide-vue-next`)
- **NO `width: 100%` on widget wrapper** - This prevents placeholder centering in flexbox context
- Icon size: 32px (standard) or 24px (compact widgets)
- Placeholder: `width: 100%` + `display: flex` + `align-items: center` + `justify-content: center`
- Content wrapper: `width: 100%` to take full width when content is present
- `min-height` for consistent sizing (80-140px depending on widget)
- Dashed border + light gray background for visual boundary
- `margin-bottom: 8px` on icon (not `gap` on container)

**Step 5: Create options panel (if needed)**
- Add `app/components/options/content/MyWidgetOptions.vue`
- Import in `ContentOptions.vue`

**Step 6: Write tests**
- Add tests for the new widget in `tests/unit/`

### Component Organization

```
components/
├── ai/           # AI chat UI (AIChatPanel, AIChatMessage)
├── canvas/       # Canvas rendering (MobileFrame, WidgetRenderer, CanvasDropzone)
├── contents/     # Content management (ContentList, ContentCard)
├── dashboard/    # Dashboard components
├── history/      # Version history UI
├── icons/        # Icon components
├── layout/       # Editor structure (EditorLayout, Toolbar, Sidebars)
├── modes/        # Edit modes (DesignerMode, PreviewMode, ExpertMode)
├── options/      # Property panels (ContentOptions, StyleOptions, GlobalOptions)
├── placeholders/ # Empty state placeholders
├── shared/       # Shared components
├── templates/    # Template browser UI
├── ui/           # Reusable UI components
└── widgets/      # Widget system (registry/, WidgetPalette, WidgetItem)
```

### Shared Code (`shared/`)

```
shared/
├── constants/   # Shared constants (status, roles, permissions, content)
├── schemas/     # Zod validation schemas (auth, content, design, ai, widgets, version, palette)
├── types/       # Shared TypeScript types (api, content, user, ai)
├── utils/       # Shared utilities
└── widgets/     # Widget definitions (SINGLE SOURCE OF TRUTH for types and categories)
```

### Key Composables (`app/composables/`)

| Composable | Usage |
|------------|-------|
| `useApi` | Authenticated API calls with auto-refresh |
| `useAIChat` | AI chat and design generation |
| `useVersionHistory` | Version history management |
| `useAutoSave` | Auto-save functionality |
| `useEditorKeyboard` | Keyboard shortcuts |
| `useGlobalStyles` | Global styles management |
| `useToast` | Toast notifications |
| `useRecovery` | Design recovery |

## Agents

- Use `agents-design-experience:ui-ux-designer` agent for UI/UX advice and design decisions

## Imports & Path Aliases

### Available Aliases

| Alias | Target | Usage |
|-------|--------|-------|
| `@/` or `~/` | `app/` | Frontend code |
| `#shared/` | `shared/` | Shared types, schemas, constants |

### Import Rules

**Frontend (`app/`)**
- Use `@/` for imports from `app/`
- Use `#shared/` for imports from `shared/`
- Never use relative paths like `../../shared/` - always use `#shared/`

```typescript
// ✅ Good
import type { ContentType } from '#shared/types/content'
// ❌ Bad - never use relative paths for shared/
import type { ContentType } from '../../shared/types/content'
import { STATUS_COLORS } from '#shared/constants/status'

import { useAuthStore } from '@/stores/auth'
```

**Server (`server/api/`, `server/utils/`)**
- All exports from `server/utils/*.ts` are **auto-imported by Nitro** - no import needed!
- Use `#shared/` for imports from `shared/`

```typescript
// ✅ Good - server/api/v1/auth/login.post.ts
import type { LoginResponse } from '#shared/types/api'
import { loginSchema } from '#shared/schemas/auth.schema'

// No import needed for prisma, createAuditLog, verifyPassword, etc.
// They are auto-imported from server/utils/

export default defineEventHandler(async (event) => {
  const user = await prisma.user.findUnique({ ... })  // ✅ Auto-imported
  await createAuditLog(event, { ... })                // ✅ Auto-imported
})

// ❌ Bad - redundant imports
import prisma from '../../../utils/prisma'
import { createAuditLog } from '../../../utils/audit'
```

### Nitro Auto-Imports (Server)

All exports from `server/utils/` are globally available in server code:
- `prisma` - Prisma client
- `createAuditLog`, `logAudit` - Audit logging
- `requireAuth`, `requireContentAccess` - Permission checks
- `generateAccessToken`, `verifyAccessToken` - JWT utilities
- `enforceRateLimit`, `RATE_LIMITS` - Rate limiting
- `toPrismaContentType`, `toApiContentType` - Type mappers
- And more... (see `server/utils/` for full list)

## Conventions

- ESLint @antfu/eslint-config: single quotes, 2 spaces, no semicolons
- Vue 3 `<script setup>` with Composition API
- Pinia stores in composition style (not Options API)
- `@/` alias for `app/`
- `#shared/` alias for `shared/`
- Default labels and UI text in French
- Commits, code comments and technical documentation in English
- Every API feature must have corresponding tests

## API Calls (Frontend)

**Always use `useApi()` for authenticated API calls.** Never use `$fetch` directly with Authorization headers.

```typescript
// ✅ Correct - automatic 401 handling, token refresh, redirect to /login
const api = useApi()
const data = await api.get<MyType>('/api/v1/resource')
const created = await api.post<MyType>('/api/v1/resource', { name: 'value' })
await api.delete('/api/v1/resource/123')

// ❌ Wrong - no 401 handling, user gets stuck on error
const data = await $fetch<MyType>('/api/v1/resource', {
  headers: { Authorization: `Bearer ${authStore.accessToken}` }
})
```

### Why useApi()?

The `useApi()` composable (`app/composables/useApi.ts`) provides:
- **Automatic Authorization header** from auth store
- **401 error handling**: attempts token refresh via HttpOnly cookie
- **Automatic retry** after successful refresh
- **Redirect to `/login`** if refresh fails
- **Cleanup** of localStorage (accessToken, user) on auth failure

### Available methods

```typescript
const api = useApi()

api.get<T>(url, options?)      // GET request
api.post<T>(url, body, options?)  // POST request
api.put<T>(url, body, options?)   // PUT request
api.delete<T>(url, options?)   // DELETE request
```

### When to use $fetch directly

Only for **public endpoints** that don't require authentication:
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- Public health checks

## Git Commits

- Always create detailed and incremental commits for better readability
- Each commit should represent a single logical change
- Use conventional commit format: `type(scope): description`
- Split large changes into multiple focused commits
- Commit message should explain the "why", not just the "what"

## REST API Design

Follow best practices for RESTful web API design:

1. **Accept and respond with JSON** - Use `application/json` content type
2. **Use nouns in endpoint paths** - `GET /articles` not `GET /getArticles`
3. **Use plural nouns for collections** - `/users`, `/articles`, `/comments`
4. **Nest resources for hierarchy** - `GET /articles/:id/comments` (limit to 2-3 levels)
5. **Use standard HTTP status codes**:
   - `200` OK, `201` Created, `204` No Content
   - `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found
   - `500` Internal Server Error
6. **Support filtering, sorting, pagination** - Use query parameters
7. **Maintain security** - SSL/TLS, least privilege, role-based access
8. **Cache data** - Use `Cache-Control` headers appropriately
9. **Version your APIs** - Use path versioning: `/v1/`, `/v2/`
