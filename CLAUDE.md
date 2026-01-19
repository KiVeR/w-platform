# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kreo - Visual content editor in Vue 3 with drag-and-drop interface. Create landing pages, RCS campaigns, and AI-powered marketing content.

## Commands

```bash
yarn dev          # Dev server (port 5174)
yarn build        # Compile TypeScript + Vite build
yarn lint         # ESLint
yarn lint:fix     # ESLint with auto-fix
```

## Architecture

### Pinia Stores (`src/stores/`)

| Store | Responsibility |
|-------|----------------|
| `editor` | Design document, save state, global styles |
| `widgets` | Widget CRUD, widget tree, drag-drop reordering |
| `selection` | Selected widget, keyboard navigation |
| `ui` | Editor mode (designer/preview/expert), sidebar visibility, options tab |
| `history` | Undo/redo (max 50 actions) |

### Widget System

Centralized configuration in `src/config/widgets.ts`:
- Each widget has a `type`, `defaultContent` and `defaultStyles`
- Container widgets (`row`, `column`, `form`): `canHaveChildren: true` property
- Parent-child constraints via `allowedChildren` / `disallowedChildren`

Renderer implementations in `src/components/widgets/registry/`.

### Widget Categories

- **base**: title, text, image, button, separator, spacer, click-to-call, link-image
- **structure**: row, column
- **form**: form, form-field
- **media**: video, map, social, icon, gallery, slider, effect
- **wellpack**: barcode, store-locator, drive, scratch, flipcard
- **action**: button, click-to-call

### Adding a New Widget

**Step 1: Define the widget type (Single Source of Truth)**
- Add the type to `WIDGET_TYPES` array in `shared/widgets/definitions.ts`
- This automatically updates TypeScript types and Zod schemas

**Step 2: Add widget configuration in `src/config/widgets.ts`**
Required properties:
```
type: 'my-widget'
label: 'Mon Widget'              // French label for UI
icon: '🔧'
category: 'base'                 // base | structure | form | media | wellpack | action
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
- Add content validation schema in the appropriate category file (base, structure, form, media, wellpack)
- Export from `shared/schemas/widgets/index.ts`

**Step 4: Create renderer component**
- Create `src/components/widgets/registry/MyWidgetWidget.vue`
- Import and register in `WidgetRenderer.vue`

**Step 5: Create options panel (if needed)**
- Add `src/components/options/content/MyWidgetOptions.vue`
- Import in `ContentOptions.vue`

**Step 6: Write tests**
- Add tests for the new widget in `tests/unit/`

### Component Organization

```
components/
├── canvas/     # Canvas rendering (MobileFrame, WidgetRenderer, CanvasDropzone)
├── layout/     # Editor structure (EditorLayout, Toolbar, Sidebars)
├── options/    # Property panels (ContentOptions, StyleOptions, GlobalOptions)
├── modes/      # Edit modes (DesignerMode, PreviewMode, ExpertMode)
└── widgets/    # Widget system (registry/, WidgetPalette, WidgetItem)
```

## Agents

- Use `agents-design-experience:ui-ux-designer` agent for UI/UX advice and design decisions

## Imports & Path Aliases

### Available Aliases

| Alias | Target | Usage |
|-------|--------|-------|
| `@/` or `~/` | `src/` | Frontend code |
| `#shared/` | `shared/` | Shared types, schemas, constants |

### Import Rules

**Frontend (`src/`)**
- Use `@/` for imports from `src/`
- Use `#shared/` for imports from `shared/`
- Never use relative paths like `../../shared/` - always use `#shared/`

```typescript
// ✅ Good
import type { ContentType } from '#shared/types/content'
import { STATUS_COLORS } from '#shared/constants/status'
import { useAuthStore } from '@/stores/auth'

// ❌ Bad - never use relative paths for shared/
import type { ContentType } from '../../shared/types/content'
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
- `requireAuth`, `requireCampaignWithAccess` - Permission checks
- `generateAccessToken`, `verifyAccessToken` - JWT utilities
- `enforceRateLimit`, `RATE_LIMITS` - Rate limiting
- `toPrismaContentType`, `toApiContentType` - Type mappers
- And more... (see `server/utils/` for full list)

## Conventions

- ESLint @antfu/eslint-config: single quotes, 2 spaces, no semicolons
- Vue 3 `<script setup>` with Composition API
- Pinia stores in composition style (not Options API)
- `@/` alias for `src/`
- `#shared/` alias for `shared/`
- Default labels and UI text in French
- Commits, code comments and technical documentation in English
- Every API feature must have corresponding tests

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
