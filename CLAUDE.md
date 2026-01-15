# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Éditeur visuel de landing pages en Vue 3 avec interface drag-and-drop. Permet de créer des pages responsives à partir de widgets préconfigurés.

## Commandes

```bash
yarn dev          # Serveur de dev (port 5174)
yarn build        # Compile TypeScript + build Vite
yarn lint         # ESLint
yarn lint:fix     # ESLint avec auto-fix
```

## Architecture

### Stores Pinia (`src/stores/`)

| Store | Responsabilité |
|-------|----------------|
| `editor` | Document de design, état de sauvegarde, styles globaux |
| `widgets` | CRUD des widgets, arbre de widgets, réordonnancement drag-drop |
| `selection` | Widget sélectionné, navigation clavier |
| `ui` | Mode éditeur (designer/preview/expert), visibilité sidebars, onglet options |
| `history` | Undo/redo (max 50 actions) |

### Système de widgets

Configuration centralisée dans `src/config/widgets.ts` :
- Chaque widget a un `type`, des `defaultContent` et `defaultStyles`
- Widgets containers (`row`, `column`, `form`) : propriété `canHaveChildren: true`
- Contraintes parent-enfant via `allowedChildren` / `disallowedChildren`

Implémentation des renderers dans `src/components/widgets/registry/`.

### Catégories de widgets

- **base** : title, text, image, button, separator, spacer, click-to-call, link-image
- **structure** : row, column
- **form** : form, form-field
- **media** : video, map, social, icon, gallery, slider, effect
- **wellpack** : barcode, store-locator, drive, scratch, flipcard
- **action** : button, click-to-call

### Ajouter un nouveau widget

1. Ajouter la config dans `src/config/widgets.ts`
2. Ajouter le type dans `src/types/widget.ts` (union `WidgetType`)
3. Créer le renderer dans `src/components/widgets/registry/`
4. L'importer dans `WidgetRenderer.vue`

### Organisation des composants

```
components/
├── canvas/     # Rendu canvas (MobileFrame, WidgetRenderer, CanvasDropzone)
├── layout/     # Structure éditeur (EditorLayout, Toolbar, Sidebars)
├── options/    # Panneaux de propriétés (ContentOptions, StyleOptions, GlobalOptions)
├── modes/      # Modes d'édition (DesignerMode, PreviewMode, ExpertMode)
└── widgets/    # Système widgets (registry/, WidgetPalette, WidgetItem)
```

## Conventions

- ESLint @antfu/eslint-config : single quotes, 2 espaces, pas de semicolons
- Vue 3 `<script setup>` avec Composition API
- Stores Pinia en style composition (pas Options API)
- Alias `@/` pour `src/`
- Labels et textes par défaut en français
