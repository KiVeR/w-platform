# Migration des composants éditeur vers le Nuxt Layer

## Contexte

Tu travailles sur le projet Kreo (éditeur visuel Vue 3 / Nuxt), branche `feat/editor-layer`.

L'objectif est d'extraire le cœur éditeur dans un Nuxt Layer réutilisable (`layers/editor/`) pour qu'il soit consommé par 3 apps : Kreo (actuel), platform-dashboard et platform-backoffice.

### Travail déjà fait

Le layer `layers/editor/` contient déjà toute la logique métier :
- **9 stores** Pinia : editor, widgets, selection, ui, history, content, presets, versionHistory, aiChat
- **17 composables** : useEditorConfig, useEditorApi, useAutoSave, useVersionHistory, useAIChat, useGoogleFonts, usePalettes, useIconSearch, useFieldValidation, useButtonWidget, useContainerBorders, useWidgetAlignment, useEditorAsyncState, useEditorKeyboard, useGlobalStyles, useRecovery, useToast
- **Services** : contentApi, contentVersionApi, persistence (localStorage, userPalettes)
- **Config** : widgets.ts (1140 lignes), presets.ts (876 lignes), fonts.ts, palettes.ts
- **Types** : widget.ts, preset.ts
- **Utils** : color.ts, form.ts, formatters.ts, lucide-icons.ts, widgetConfig.ts
- **CSS** : tokens.css, animations.css
- **Constants** : editor.ts

Tout est auto-importé via le `nuxt.config.ts` du layer (composables, stores, constants, services, config, utils). **Zéro `@/` import dans le layer** — tout utilise des imports relatifs.

**11 fichiers re-export bridge** existent dans `app/` (types, config, utils) — ils re-exportent depuis le layer pour que les composants non encore migrés continuent de fonctionner.

### Ce qui reste : les composants

`app/components/` contient 127 composants Vue. **~105 sont éditeur-pur** et doivent être déplacés dans `layers/editor/components/`. Les ~22 restants sont app-specific et restent dans `app/`.

## Ce que tu dois faire

Déplacer les composants éditeur de `app/components/` vers `layers/editor/components/`, en gardant le même arbre de dossiers. Après chaque batch, les re-exports deviennent inutiles pour les composants dans le layer car Nuxt les auto-importe (config `components` dans le layer nuxt.config avec `pathPrefix: false`).

### Structure cible

```
layers/editor/components/
├── ai/                  # 4 composants
│   ├── AIChatInput.vue
│   ├── AIChatMessage.vue
│   ├── AIChatPanel.vue
│   └── AIDesignPreview.vue
├── canvas/              # 6 composants
│   ├── CanvasDropzone.vue
│   ├── MobileFrame.vue
│   ├── PreviewContent.vue
│   ├── PreviewRenderer.vue
│   ├── WidgetRenderer.vue
│   └── WidgetRendererInner.vue
├── history/             # 5 composants
│   ├── HistoryBanner.vue
│   ├── RestoreConfirmModal.vue
│   ├── VersionHistorySidebar.vue
│   ├── VersionItem.vue
│   └── VersionList.vue
├── icons/               # 2 composants
│   ├── KreoLogo.vue
│   └── KreoLogoFull.vue
├── modes/               # 4 composants
│   ├── DesignerMode.vue
│   ├── ExpertMode.vue
│   ├── HistoryMode.vue
│   └── PreviewMode.vue
├── options/             # ~44 composants (garder la même structure interne)
│   ├── ContentOptions.vue
│   ├── GlobalOptions.vue
│   ├── OptionsPanel.vue
│   ├── StyleOptions.vue
│   ├── content/         # 27 fichiers (TitleOptions, TextOptions, ImageOptions, etc.)
│   ├── inputs/          # ColorPicker.vue, ColorPickerWithTheme.vue
│   ├── sections/        # StyleOptionsAlignment, StyleOptionsTypography, StyleOptionsContainerAdvanced
│   └── shared/          # OptionCheckbox, OptionGroup, OptionInput, OptionSelect, OptionSlider, etc.
├── shared/              # 2 composants
│   ├── HelpTooltip.vue
│   └── ValidationError.vue
├── templates/           # 4 composants
│   ├── ApplyTemplateModal.vue
│   ├── SectionItem.vue
│   ├── TemplateCard.vue
│   └── TemplatePalette.vue
├── ui/                  # 8 composants
│   ├── ConfirmPaletteChangeModal.vue
│   ├── CreateLandingPageModal.vue
│   ├── IconText.vue
│   ├── RecoveryModal.vue
│   ├── SavePaletteModal.vue
│   ├── SaveStatus.vue
│   ├── ToastContainer.vue
│   └── ToastNotification.vue
└── widgets/             # 35 composants
    ├── GlobalColorIndicator.vue
    ├── SectionPalette.vue
    ├── WidgetItem.vue
    ├── WidgetPalette.vue
    └── registry/        # 31 widget renderers
        ├── BadgeWidget.vue
        ├── BarcodeWidget.vue
        ├── ButtonWidget.vue
        ├── ClickToCallWidget.vue
        ├── ColumnWidget.vue
        ├── CountdownWidget.vue
        ├── DriveWidget.vue
        ├── EffectWidget.vue
        ├── FlipcardWidget.vue
        ├── FormFieldWidget.vue
        ├── FormWidget.vue
        ├── GalleryWidget.vue
        ├── IconWidget.vue
        ├── ImageWidget.vue
        ├── LinkImageWidget.vue
        ├── MapWidget.vue
        ├── RowWidget.vue
        ├── ScratchWidget.vue
        ├── SeparatorWidget.vue
        ├── SliderWidget.vue
        ├── SocialWidget.vue
        ├── SpacerWidget.vue
        ├── StoreLocatorWidget.vue
        ├── TestimonialWidget.vue
        ├── TextWidget.vue
        ├── TitleWidget.vue
        └── VideoWidget.vue

### Composants qui restent dans `app/components/` (APP-SPECIFIC)

```
app/components/
├── contents/            # 4 fichiers — NuxtLink, content list, app-level
│   ├── ContentCard.vue
│   ├── ContentFilterBar.vue
│   ├── QuickAccessSection.vue
│   └── SplitButton.vue
├── dashboard/           # 2 fichiers — dashboard UI
│   ├── ContentTypeCard.vue
│   └── EmptyDashboard.vue
├── layout/              # 3 fichiers — routing/navigation, app-level
│   ├── BreadcrumbNav.vue     # NuxtLink vers /dashboard
│   ├── EditorToolbar.vue     # useRouter, BreadcrumbNav, CreateLandingPageModal, SaveStatus
│   └── LeftSidebar.vue       # NuxtLink vers /dashboard (logo), importe palettes du layer
└── placeholders/        # 3 fichiers — feature coming soon
    ├── FeaturePlaceholder.vue
    ├── RcsPlaceholder.vue
    └── SmsPlaceholder.vue
```

**Note sur les composants layout restants dans app/** :
- `EditorToolbar.vue` importe `BreadcrumbNav`, `CreateLandingPageModal`, `SaveStatus`. Quand SaveStatus et CreateLandingPageModal seront dans le layer, ses imports changeront vers des auto-imports Nuxt. Les imports de BreadcrumbNav resteront en `@/components/layout/BreadcrumbNav.vue`.
- `LeftSidebar.vue` importe `KreoLogo`, `TemplatePalette`, `SectionPalette`, `WidgetPalette`. Quand ces composants seront dans le layer, ils seront auto-importés — les imports explicites devront être supprimés.

## Ordre de migration par batch (commits)

**Important** : procéder par batch fonctionnel pour que l'app reste opérationnelle à chaque commit.

### Batch 1 : widgets/registry/ (31 fichiers) + widgets/ root (4 fichiers) = 35 fichiers
Les widgets sont le cœur de l'éditeur. Ils sont tous autonomes (types + composables auto-importés).

**Travail pour chaque fichier :**
1. `mv app/components/widgets/... layers/editor/components/widgets/...`
2. Supprimer les imports `from '@/types/widget'` → les types Widget/WidgetType sont utilisés comme props, donc ils seront auto-importés ou les `import type` peuvent rester (les re-exports dans app/types/ fonctionnent toujours)
3. Supprimer les imports `from '@/config/widgets'` → auto-importé par le layer
4. Supprimer les imports `from '@/utils/...'` → auto-importé par le layer
5. Remplacer les imports `from '@/components/...'` par des imports relatifs ou laisser Nuxt auto-importer

**Attention** : les imports entre composants (`from '@/components/widgets/registry/...'`, `from '@/components/canvas/...'`, `from '@/components/ui/IconText.vue'`) doivent être gérés. Deux stratégies :
- **Option A (recommandée)** : Supprimer les imports explicites et laisser Nuxt auto-importer les composants. Le layer a `pathPrefix: false` donc `WidgetRenderer`, `IconText`, etc. sont disponibles sans import.
- **Option B** : Convertir en imports relatifs.

### Batch 2 : options/ (44 fichiers)
Les panneaux d'options. Ils importent `@/types/widget` et des composants internes (relatifs `./content/...`, `./shared/...`).

**Travail** : déplacer tout le dossier. Les imports relatifs internes fonctionnent tel quel. Supprimer les `import type { ... } from '@/types/widget'` si les types sont déjà auto-importables, ou les garder avec le re-export bridge.

### Batch 3 : canvas/ (6 fichiers)
Les renderers. `WidgetRenderer.vue`, `WidgetRendererInner.vue` et `PreviewRenderer.vue` importent chacun ~30 widgets via `from '@/components/widgets/registry/...'`.

**Travail** : une fois dans le layer, ces imports deviennent inutiles car Nuxt auto-importe tous les composants du layer. **Supprimer tous les imports explicites de widgets** dans ces 3 fichiers.

### Batch 4 : ai/ (4), templates/ (4), history/ (5), modes/ (4) = 17 fichiers
Composants de support éditeur. Quelques imports cross-composants à adapter.

### Batch 5 : shared/ (2), ui/ (8), icons/ (2) = 12 fichiers
Composants utilitaires de l'éditeur.

### Batch 6 : layout/ — CenterCanvas, RightSidebar, EditableTitle (3 fichiers)
Ces 3 fichiers layout sont éditeur-pur. Les déplacer dans `layers/editor/components/layout/`.

### Batch 7 : Cleanup
- Mettre à jour les composants restants dans `app/` (EditorToolbar, LeftSidebar, BreadcrumbNav) pour supprimer les imports explicites de composants maintenant auto-importés depuis le layer
- Supprimer les re-exports bridge dans `app/types/`, `app/config/`, `app/utils/` s'ils ne sont plus utilisés par aucun composant dans app/
- Vérifier que `grep -r "from '@/components/" layers/editor/` retourne zéro

## Règles critiques

### Imports dans le layer
- **Zéro `@/` import dans les fichiers du layer.** `@/` résout vers le `app/` de l'app consommatrice, pas vers le layer.
- Pour les composants du layer, utiliser l'auto-import Nuxt (ne pas importer les composants frères explicitement) OU des imports relatifs.
- Pour les types, garder les `import type { Widget } from '../types/widget'` en imports relatifs depuis le layer, OU les supprimer si le contexte permet l'inférence de type.

### Auto-imports Nuxt pour les composants
Le layer `nuxt.config.ts` a :
```ts
components: [
  {
    path: join(currentDir, './components'),
    pathPrefix: false,
  },
],
```
Cela signifie que **tous les composants dans `layers/editor/components/` sont auto-importés** par nom, sans préfixe de chemin. `BadgeWidget`, `WidgetRenderer`, `IconText`, `OptionsPanel` etc. sont tous disponibles dans le template sans import.

**Mais** : les imports dynamiques (`defineAsyncComponent(() => import('./content/TitleOptions.vue'))`) doivent rester — ils sont nécessaires pour le code-splitting.

### Types et les composants
Les composants Vue qui utilisent `import type { Widget } from '@/types/widget'` dans leur `<script setup>` peuvent :
1. Garder l'import tel quel — les re-exports dans `app/types/widget.ts` continuent de fonctionner même dans le layer (car `@/` résout vers `app/` de l'app consommatrice qui a les re-exports)
2. OU remplacer par un import relatif : `import type { Widget } from '../../types/widget'` (depuis `layers/editor/components/widgets/registry/`)

**Attention** : la profondeur relative dépend du dossier du composant. La stratégie la plus sûre est de **garder les `@/types/widget` pour l'instant** (les re-exports bridge assurent la compatibilité) et de les nettoyer dans un batch ultérieur.

### ESLint
- Config `@antfu/eslint-config` : single quotes, 2 spaces, no semicolons
- `antfu/if-newline` : saut de ligne obligatoire après `if`
- `perfectionist/sort-imports` : imports triés alphabétiquement
- Lancer `yarn lint:fix` après chaque batch

### Commits
- Format conventionnel : `refactor(editor): move [category] components to editor layer`
- Un commit par batch fonctionnel
- `yarn build` et `yarn test` doivent passer à chaque commit

### Vérifications finales
```bash
# Aucun @/components/ dans le layer
grep -r "from '@/components/" layers/editor/
# → zéro résultat

# Aucun @/ tout court dans le layer
grep -r "from '@/" layers/editor/
# → zéro résultat

# Build OK
yarn build

# Tests OK
yarn test

# Lint OK
yarn lint
```

## Dépendances externes des composants
Les composants utilisent ces packages externes (tous déjà dans les dépendances du projet) :
- `vue` (core)
- `lucide-vue-next` (icônes — utilisé par ~60 composants)
- `vuedraggable` (drag-drop — CanvasDropzone, RowWidget)
- `@vueuse/core` (hooks — quelques composants)
- `uuid` (génération d'IDs — via stores auto-importés)

## Cross-références entre composants (à résoudre)

Les imports `from '@/components/...'` les plus fréquents, tous entre composants éditeur :

| Composant source | Importe | Fréquence |
|-----------------|---------|-----------|
| WidgetRenderer.vue | 31 widgets du registry | 31 imports |
| WidgetRendererInner.vue | 26 widgets du registry | 26 imports |
| PreviewRenderer.vue | 31 widgets du registry | 31 imports |
| ColumnWidget.vue | PreviewRenderer, WidgetRendererInner | 2 imports |
| FormWidget.vue | PreviewRenderer, WidgetRendererInner | 2 imports |
| RowWidget.vue | ColumnWidget | 1 import |
| ButtonWidget.vue | IconText | 1 import |
| ClickToCallWidget.vue | IconText | 1 import |
| WidgetPalette.vue | AIChatPanel | 1 import |
| DesignerMode.vue | CanvasDropzone, MobileFrame | 2 imports |
| PreviewMode.vue | MobileFrame, PreviewContent | 2 imports |
| HistoryMode.vue | MobileFrame, PreviewContent, HistoryBanner | 3 imports |

**Action** : une fois tous ces composants dans le layer, **supprimer ces imports** et laisser Nuxt auto-importer. Le seul cas où garder un import explicite est justifié, c'est pour `defineAsyncComponent` (code-splitting dans ContentOptions.vue).
