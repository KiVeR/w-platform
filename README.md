# Kreo

Éditeur visuel de contenu en Vue 3 avec interface drag-and-drop. Créez des landing pages, des campagnes RCS et du contenu marketing.

## Table des matières

- [Installation](#installation)
- [Commandes](#commandes)
- [Architecture](#architecture)
- [Système de widgets](#système-de-widgets)
- [API REST](#api-rest)
- [Structures de données](#structures-de-données)
- [Intégration externe](#intégration-externe)
- [Conventions](#conventions)

---

## Installation

```bash
# Cloner le projet
git clone <repository-url>
cd kreo

# Installer les dépendances
yarn install

# Lancer le serveur de développement
yarn dev
```

## Commandes

```bash
yarn dev          # Serveur de développement (port 5174)
yarn build        # Compilation TypeScript + build Vite
yarn lint         # ESLint
yarn lint:fix     # ESLint avec auto-fix
```

---

## Architecture

### Stack technologique

- **Frontend** : Vue 3, Nuxt 4, Pinia, TypeScript, Tailwind CSS v4
- **Backend** : Nitro (serveur Nuxt), Prisma ORM
- **Validation** : Zod schemas
- **Auth** : JWT avec refresh token rotation

### Stores Pinia (`app/stores/`)

| Store | Responsabilité |
|-------|----------------|
| `editor` | Document de design, état de sauvegarde, styles globaux |
| `widgets` | CRUD widgets, arbre de widgets, drag-drop |
| `selection` | Widget sélectionné, navigation clavier |
| `ui` | Mode éditeur (designer/preview/expert), visibilité des sidebars |
| `history` | Undo/redo (max 50 actions) |
| `versionHistory` | Versions depuis le backend |

### Organisation des composants

```
app/components/
├── canvas/     # Rendu du canvas (MobileFrame, WidgetRenderer, CanvasDropzone)
├── layout/     # Structure de l'éditeur (EditorLayout, Toolbar, Sidebars)
├── options/    # Panneaux de propriétés (ContentOptions, StyleOptions, GlobalOptions)
├── modes/      # Modes d'édition (DesignerMode, PreviewMode, ExpertMode)
└── widgets/    # Système de widgets (registry/, WidgetPalette, WidgetItem)
```

---

## Système de widgets

### Catégories de widgets (24 types)

| Catégorie | Widgets |
|-----------|---------|
| **Base** | `title`, `text`, `image`, `button`, `separator`, `spacer`, `click-to-call`, `link-image` |
| **Structure** | `row`, `column` |
| **Formulaires** | `form`, `form-field` |
| **Média** | `video`, `map`, `social`, `icon`, `gallery`, `slider`, `effect` |
| **Wellpack** | `barcode`, `store-locator`, `drive`, `scratch`, `flipcard` |

### Ajouter un nouveau widget

**Étape 1 : Définir le type (Single Source of Truth)**
- Ajouter le type dans `WIDGET_TYPES` dans `shared/widgets/definitions.ts`

**Étape 2 : Configuration dans `app/config/widgets.ts`**
```typescript
{
  type: 'my-widget',
  label: 'Mon Widget',              // Label français pour l'UI
  icon: '🔧',
  category: 'base',                 // base | structure | form | media | wellpack
  description: 'English description for LLM...',
  usageHints: ['Hint 1', 'Hint 2'],
  requiredContent: ['prop1'],
  defaultContent: { prop1: 'value' },
  defaultStyles: { margin: '8px' },
  // Pour les conteneurs uniquement :
  canHaveChildren: true,
  allowedChildren: ['type1']        // ou disallowedChildren: ['type2']
}
```

**Étape 3 : Créer le schéma Zod dans `shared/schemas/widgets/`**

**Étape 4 : Créer le composant renderer dans `app/components/widgets/registry/`**

**Étape 5 : Créer le panneau d'options (si nécessaire) dans `app/components/options/content/`**

**Étape 6 : Écrire les tests dans `tests/unit/`**

---

## API REST

**Base URL** : `/api/v1`
**Authentification** : Bearer token JWT

### Authentification

```
POST /auth/login          → Connexion (email/password)
POST /auth/register       → Inscription
POST /auth/refresh        → Rafraîchir le token
GET  /auth/me             → Profil utilisateur
POST /auth/logout         → Déconnexion
```

### Landing Pages

```
GET    /landing-pages                    → Liste paginée
POST   /landing-pages                    → Créer une page
GET    /landing-pages/:id                → Détails d'une page
PUT    /landing-pages/:id                → Mettre à jour métadonnées
DELETE /landing-pages/:id                → Supprimer une page
```

**Paramètres de liste** : `page`, `limit`, `status`, `search`, `sortBy`, `sortOrder`

### Design

```
GET  /landing-pages/:id/design           → Charger le design
POST /landing-pages/:id/design           → Sauvegarder le design
POST /landing-pages/:id/assets           → Upload d'assets (JPEG, PNG, GIF, WebP, SVG ≤5MB)
```

### Versioning

```
GET  /landing-pages/:id/versions         → Liste des versions (max 50)
GET  /landing-pages/:id/versions/:vid    → Récupérer une version
POST /landing-pages/:id/versions         → Restaurer une version
```

---

## Structures de données

### Document de Design

```typescript
interface DesignDocument {
  version: '1.0'
  globalStyles: {
    palette: string // Ex: "turquoise"
    backgroundColor: string // Ex: "#ffffff"
    textColor: string // Ex: "#1e293b"
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
    baseFontSize?: string
    contentPadding?: string
    widgetGap?: string
    borderRadius?: string
    pageTitle?: string // SEO
    metaDescription?: string // SEO
  }
  widgets: Widget[]
}
```

### Structure d'un Widget

```typescript
interface Widget {
  id: string // UUID unique
  type: WidgetType // Ex: "title", "button", "form"
  order: number // Position dans le parent
  content: WidgetContent // Contenu spécifique au type
  styles: WidgetStyles // CSS inline
  children?: Widget[] // Pour conteneurs (row, column, form)
}
```

### Exemples de contenu par widget

**Titre/Texte :**
```json
{ "text": "Bienvenue" }
```

**Bouton :**
```json
{
  "text": "S'inscrire",
  "action": "link",
  "href": "/subscribe"
}
```

**Champ de formulaire :**
```json
{
  "fieldType": "tel",
  "label": "Téléphone",
  "placeholder": "+33...",
  "required": true,
  "name": "phone"
}
```

**Barcode :**
```json
{
  "barcodeCode": "PROMO2024",
  "barcodeType": "qrcode",
  "barcodeColor": "#000000"
}
```

---

## Intégration externe

### Flux d'intégration API

```
1. POST /api/v1/auth/login           → Obtenir JWT
2. POST /api/v1/landing-pages        → Créer une page
3. POST /api/v1/landing-pages/:id/design  → Sauvegarder le design
4. POST /api/v1/landing-pages/:id/assets  → Upload d'images
5. PUT  /api/v1/landing-pages/:id    → Publier (status: "PUBLISHED")
```

### Exemple : Landing page pour campagne SMS

```json
{
  "version": "1.0",
  "globalStyles": {
    "backgroundColor": "#ffffff",
    "primaryColor": "#14b8a6"
  },
  "widgets": [
    {
      "id": "header",
      "type": "title",
      "order": 0,
      "content": { "text": "Offre exclusive -20%" },
      "styles": { "textAlign": "center", "fontSize": "28px" }
    },
    {
      "id": "form-collect",
      "type": "form",
      "order": 1,
      "content": { "successMessage": "Code promo envoyé par SMS !" },
      "children": [
        {
          "id": "field-phone",
          "type": "form-field",
          "order": 0,
          "content": {
            "fieldType": "tel",
            "label": "Votre numéro",
            "required": true,
            "name": "phone"
          }
        }
      ]
    },
    {
      "id": "promo-code",
      "type": "barcode",
      "order": 2,
      "content": { "barcodeCode": "SMSOFF20", "barcodeType": "qrcode" }
    }
  ]
}
```

### Sécurité et permissions

| Niveau | Description |
|--------|-------------|
| `VIEW` | Lecture seule |
| `EDIT` | Modification du design |
| `MANAGE` | Suppression et gestion complète |

**Rôles** : `ADMIN`, `EDITOR`, `VIEWER`

---

## Conventions

- **ESLint** : @antfu/eslint-config (single quotes, 2 spaces, no semicolons)
- **Vue** : `<script setup>` avec Composition API
- **Pinia** : Stores en style composition
- **Alias** : `@/` pour `app/`
- **UI** : Labels et textes en français
- **Code** : Commits, commentaires et documentation technique en anglais
- **Tests** : Chaque fonctionnalité API doit avoir des tests correspondants

### Format des commits

```
type(scope): description

Exemples :
feat(widgets): add barcode widget
fix(editor): resolve drag-drop issue
refactor(stores): simplify widget tree logic
```

---

## Licence

Propriétaire - Tous droits réservés
