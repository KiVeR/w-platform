# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Visual landing page editor in Vue 3 with drag-and-drop interface. Allows creating responsive pages from preconfigured widgets.

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

1. Add config in `src/config/widgets.ts`
2. Add type in `src/types/widget.ts` (`WidgetType` union)
3. Create renderer in `src/components/widgets/registry/`
4. Import it in `WidgetRenderer.vue`

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

## Conventions

- ESLint @antfu/eslint-config: single quotes, 2 spaces, no semicolons
- Vue 3 `<script setup>` with Composition API
- Pinia stores in composition style (not Options API)
- `@/` alias for `src/`
- Default labels and UI text in French
- Commits, code comments and technical documentation in English
- Every API feature must have corresponding tests

## Git Commits

- Always create detailed and incremental commits for better readability
- Each commit should represent a single logical change
- Use conventional commit format: `type(scope): description`
- Split large changes into multiple focused commits
- Commit message should explain the "why", not just the "what"
