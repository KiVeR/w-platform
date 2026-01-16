# Plan : Ajout API, Authentification et Base de Données

> **⚠️ Plan évolutif** : Ce plan sera mis à jour au fur et à mesure de l'avancement de chaque étape pour refléter les décisions prises, les ajustements nécessaires et les apprentissages en cours de route.

---

## État d'Avancement

> **Dernière mise à jour** : 16 janvier 2026

### Vue d'ensemble

| Phase | Nom | Progression | Status |
|-------|-----|-------------|--------|
| 1 | Infrastructure de base | 100% | ✅ Complétée |
| 2 | API Core | 100% | ✅ Complétée |
| 3 | Dashboard Landing Pages | 100% | ✅ Complétée |
| 4 | Sécurité | 0% | ⏸️ Reportée |
| 5 | Tests & Qualité | 5% | ❌ Non commencée |
| 6 | Déploiement | 0% | ❌ Non commencée |

### Détail Phase 1 ✅

| Élément | Status | Fichiers |
|---------|--------|----------|
| Migration Vue → Nuxt 3 | ✅ | `nuxt.config.ts` |
| Prisma + PostgreSQL | ✅ | `prisma/schema.prisma` |
| Structure tests | ✅ | `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts` |
| Dossier `shared/` | ✅ | `shared/types/`, `shared/schemas/`, `shared/constants/` |
| Auth JWT (5 endpoints) | ✅ | `server/api/v1/auth/` (login, register, refresh, logout, me) |
| Store auth + middleware | ✅ | `src/stores/auth.ts`, `src/middleware/auth.global.ts` |
| Server utils | ✅ | `server/utils/` (jwt, password, prisma, audit) |

### Détail Phase 2 ✅

| Élément | Status | Fichiers |
|---------|--------|----------|
| Helper permissions | ✅ | `server/utils/permissions.ts` |
| CRUD Landing Pages | ✅ | `server/api/v1/landing-pages/index.get.ts`, `index.post.ts` |
| Landing Page [id] | ✅ | `[id]/index.get.ts`, `[id]/index.put.ts`, `[id]/index.delete.ts` |
| Endpoints design GET/POST | ✅ | `[id]/design.get.ts`, `[id]/design.post.ts` |
| Schema validation design | ✅ | `shared/schemas/design.schema.ts` |
| Composables persistence | ✅ | `usePersistence.ts`, `useAutoSave.ts` adaptés |
| Upload assets | ✅ | `[id]/assets.post.ts` (local dev, Azure TODO) |

### Prochaines étapes prioritaires

1. **Phase 5** : Tests API (valider le code existant)
2. Upload Azure Blob Storage (production)
3. Déploiement Azure (Phase 6)

---

## Recommandation Architecture

**Nuxt 3 Monorepo** (migration du frontend Vue existant)

### Justification
| Critère | Nuxt 3 | Laravel |
|---------|--------|---------|
| Cohérence stack | TypeScript unifié | PHP séparé |
| Types partagés | Natif | Génération manuelle |
| ORM | Prisma (excellent) | Eloquent |
| Déploiement Azure | App Service Node.js | App Service PHP |
| Rôles/Permissions | Custom middleware | Spatie (mature) |

**Choix Nuxt** car : TypeScript partout, types partagés front/back, un seul runtime Node.js sur Azure.

---

## Code Partagé Front/Back

### Principe
Maximiser la réutilisation du code entre le frontend et le backend grâce au monorepo Nuxt.

### Structure du code partagé
```
shared/
├── types/
│   ├── widget.ts              # DesignDocument, Widget, GlobalStyles
│   ├── user.ts                # User, Role, Permission
│   ├── api.ts                 # Request/Response types
│   └── index.ts               # Barrel export
├── schemas/
│   ├── auth.schema.ts         # Zod: login, register validation
│   ├── landing-page.schema.ts # Zod: création/modification page
│   ├── design.schema.ts       # Zod: validation DesignDocument
│   └── user.schema.ts         # Zod: CRUD utilisateurs
├── constants/
│   ├── roles.ts               # ADMIN, EDITOR, VIEWER
│   ├── permissions.ts         # VIEW, EDIT, MANAGE
│   ├── widget-types.ts        # Liste des types de widgets
│   └── status.ts              # DRAFT, PUBLISHED, ARCHIVED
└── utils/
    ├── slugify.ts             # Génération de slugs
    ├── date.ts                # Formatage dates
    └── validation.ts          # Helpers de validation
```

### Avantages
| Élément partagé | Bénéfice |
|-----------------|----------|
| **Types TypeScript** | Une seule source de vérité, pas de désynchronisation |
| **Schemas Zod** | Même validation côté client (UX) et serveur (sécurité) |
| **Constantes** | Rôles, permissions, statuts cohérents partout |
| **Utils** | Pas de duplication de code utilitaire |

### Exemple : Validation partagée avec Zod
```typescript
// shared/schemas/auth.schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
})

// Utilisé côté frontend (formulaire)
const { errors } = loginSchema.safeParse(formData)

// Utilisé côté backend (API)
const validated = loginSchema.parse(await readBody(event))
```

---

## Base de Données : PostgreSQL

**Choix définitif : Azure Database for PostgreSQL Flexible Server**

### Justification
- **Dashboard admin prévu** avec filtres avancés par type de widget, couleur, etc.
- **Stats avancées** sur l'utilisation des widgets
- **JSONB + Index GIN** : requêtes performantes sur le JSON des DesignDocuments
- `jsonb_array_elements()` pour parcourir les widgets
- Index sur propriétés JSON internes (palette, types de widgets)
- Requêtes récursives (CTE) pour widgets imbriqués (row/column)

### Configuration Azure
- **Dev** : Burstable B1ms (~15€/mois)
- **Prod** : General Purpose D2ds_v4 (~85€/mois)

---

## Structure du Projet

```
landing-page-editor/
├── nuxt.config.ts
├── prisma/
│   ├── schema.prisma              # Schéma BDD ✅
│   └── migrations/
├── server/
│   ├── api/v1/
│   │   ├── auth/                  # ✅ Implémenté
│   │   │   ├── login.post.ts      # ✅
│   │   │   ├── register.post.ts   # ✅
│   │   │   ├── refresh.post.ts    # ✅
│   │   │   ├── logout.post.ts     # ✅
│   │   │   └── me.get.ts          # ✅
│   │   ├── landing-pages/         # ❌ À implémenter
│   │   │   ├── index.get.ts       # Liste pages
│   │   │   ├── index.post.ts      # Créer page
│   │   │   └── [id]/
│   │   │       ├── index.get.ts   # Lire page
│   │   │       ├── index.put.ts   # Modifier page
│   │   │       ├── index.delete.ts# Supprimer page
│   │   │       ├── design.get.ts  # Charger design
│   │   │       ├── design.post.ts # Sauvegarder
│   │   │       └── assets.post.ts # Upload
│   │   ├── users/                 # CRUD users (admin)
│   │   └── audit/logs.get.ts      # Logs audit
│   ├── middleware/
│   │   ├── auth.ts                # Vérification JWT
│   │   ├── permissions.ts         # Contrôle rôles
│   │   └── audit.ts               # Logging actions
│   └── utils/                     # ✅ Implémenté
│       ├── prisma.ts              # ✅
│       ├── jwt.ts                 # ✅
│       ├── password.ts            # ✅
│       └── audit.ts               # ✅
├── shared/                        # ✅ Implémenté
│   ├── types/                     # ✅
│   ├── schemas/                   # ✅
│   └── constants/                 # ✅
├── src/
│   ├── stores/                    # ✅ Pinia stores
│   ├── composables/               # ✅ Composables adaptés
│   ├── components/                # Composants Vue (migrés)
│   ├── middleware/
│   │   └── auth.global.ts         # ✅ Protection routes
│   └── pages/
│       ├── index.vue              # ✅
│       ├── login.vue              # ✅
│       ├── dashboard.vue          # ✅
│       └── editor/[id].vue        # ✅
└── tests/
    └── setup.ts                   # ✅ Config de base
```

---

## Theming : Light / Dark Mode

### Fonctionnalités requises
- ✅ Mode clair (light)
- ✅ Mode sombre (dark)
- ✅ Choix manuel par l'utilisateur
- ✅ Synchronisation avec les préférences système (auto)
- ✅ Persistance du choix utilisateur (localStorage)

### Implémentation

#### 1. Configuration Tailwind 4
```css
/* tailwind.css */
@theme {
  /* Couleurs light (défaut) */
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
}

/* Couleurs dark */
.dark {
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-border: #334155;
  --color-primary: #60a5fa;
  --color-primary-hover: #3b82f6;
}
```

#### 2. Composable useColorMode
```typescript
// composables/useColorMode.ts
type ColorMode = 'light' | 'dark' | 'system'

export function useColorMode() {
  const mode = ref<ColorMode>(localStorage.getItem('color-mode') as ColorMode || 'system')
  const resolvedMode = ref<'light' | 'dark'>('light')

  function applyMode() {
    const isDark = mode.value === 'dark'
      || (mode.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    document.documentElement.classList.toggle('dark', isDark)
    resolvedMode.value = isDark ? 'dark' : 'light'
  }

  function setMode(newMode: ColorMode) {
    mode.value = newMode
    localStorage.setItem('color-mode', newMode)
    applyMode()
  }

  // Écouter les changements système
  onMounted(() => {
    applyMode()
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', applyMode)
  })

  return { mode, resolvedMode, setMode }
}
```

#### 3. Sélecteur de thème (UI)
```vue
<!-- components/ui/ColorModeToggle.vue -->
<template>
  <div class="flex items-center gap-2">
    <button
      v-for="option in options"
      :key="option.value"
      :class="{ 'bg-primary': mode === option.value }"
      @click="setMode(option.value)"
    >
      <component :is="option.icon" />
    </button>
  </div>
</template>
```

Options affichées :
- ☀️ Light (forcé clair)
- 🌙 Dark (forcé sombre)
- 💻 System (suit le système)

### Intégration
- Sélecteur dans la **toolbar** de l'éditeur
- Sélecteur dans la page **settings** utilisateur
- Préférence stockée en **localStorage** (immédiat) + **BDD** (persistant cross-device)

---

## UX/UI des Nouvelles Pages Frontend

### Agent utilisé
**`agents-design-experience:ui-ux-designer`** pour concevoir et développer l'interface des pages non existantes.

### Pages prioritaires (Phase 3) ✅
| Page | Description | Status |
|------|-------------|--------|
| `pages/login.vue` | Connexion utilisateur | ✅ Complète |
| `pages/dashboard.vue` | Liste des landing pages, création, suppression | ✅ Complète |
| `pages/editor/new.vue` | Création nouvelle LP | ✅ Complète |
| `pages/editor/[id].vue` | Édition LP existante | ✅ Complète |

### Pages reportées
| Page | Description |
|------|-------------|
| `pages/register.vue` | Inscription (pas prioritaire) |
| `pages/admin/users.vue` | Gestion utilisateurs (admin) |
| `pages/admin/audit.vue` | Consultation audit logs |
| `pages/settings.vue` | Paramètres compte |

### Directives de design
- **S'inspirer du design existant** de l'éditeur (couleurs, typographie, espacements)
- Réutiliser les composants UI existants (`src/components/ui/`)
- Cohérence avec Tailwind CSS et la palette de couleurs du projet
- Respecter les patterns Vue 3 + Composition API établis
- Mobile-first pour le dashboard

---

## Schéma Base de Données (PostgreSQL/Prisma)

### Tables principales

```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  password      String    // bcrypt
  firstName     String?
  lastName      String?
  role          Role      @default(VIEWER)  // ADMIN, EDITOR, VIEWER
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model LandingPage {
  id            Int         @id @default(autoincrement())
  title         String
  slug          String      @unique
  status        PageStatus  @default(DRAFT)  // DRAFT, PUBLISHED, ARCHIVED
  ownerId       Int
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  publishedAt   DateTime?
}

model DesignVersion {
  id            Int      @id @default(autoincrement())
  landingPageId Int
  version       String   // "1.0", "1.1"
  design        Json     // DesignDocument complet
  widgetCount   Int
  createdAt     DateTime @default(now())
}

model Asset {
  id            Int      @id @default(autoincrement())
  landingPageId Int
  filename      String
  mimeType      String
  size          Int
  url           String
  storageKey    String   // Chemin Azure Blob
  uploadedAt    DateTime @default(now())
}

model UserPermission {
  id            Int        @id @default(autoincrement())
  userId        Int
  landingPageId Int
  permission    Permission @default(VIEW)  // VIEW, EDIT, MANAGE
}

model AuditLog {
  id            Int         @id @default(autoincrement())
  userId        Int?
  action        AuditAction // LOGIN, PAGE_CREATED, DESIGN_SAVED, etc.
  entityType    EntityType  // USER, LANDING_PAGE, ASSET
  entityId      Int?
  details       Json?
  ipAddress     String?
  createdAt     DateTime    @default(now())
}
```

---

## Authentification JWT

### Flow
1. **Login** : `POST /api/v1/auth/login` → `{ accessToken, refreshToken, user }`
2. **Requêtes** : Header `Authorization: Bearer <accessToken>`
3. **Refresh** : `POST /api/v1/auth/refresh` (rotation des tokens)
4. **Logout** : Révocation du refresh token en BDD

### Configuration
- Access token : 15 minutes
- Refresh token : 7 jours (stocké en BDD, révocable)
- Secrets dans Azure Key Vault

---

## Système de Permissions

### Rôles globaux
| Rôle | Droits |
|------|--------|
| ADMIN | Accès total, gestion users, audit logs |
| EDITOR | Créer/modifier ses pages |
| VIEWER | Lecture seule |

### Permissions par page
| Permission | Droits |
|------------|--------|
| VIEW | Lecture design |
| EDIT | Modification, upload assets |
| MANAGE | Gérer permissions autres users |

---

## Audit Logs

### Actions loggées
- **Auth** : login, logout, échecs, changement mdp
- **Pages** : création, modification, suppression, publication
- **Design** : sauvegarde, création version
- **Assets** : upload, suppression
- **Users** : CRUD
- **Permissions** : attribution, révocation

---

## Tests API : Couverture 100%

### Objectif
**Couverture de tests à 100%** pour tout le code backend (`server/`).

### Stack de tests
- **Vitest** : Test runner (intégré à Nuxt 3)
- **Supertest** : Tests HTTP des endpoints API
- **@prisma/client mock** : Mock de la base de données
- **MSW** (Mock Service Worker) : Mock des services externes (Azure Blob)

### Structure des tests
```
tests/
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.test.ts         # Tests login
│   │   │   ├── register.test.ts      # Tests register
│   │   │   ├── refresh.test.ts       # Tests refresh token
│   │   │   └── logout.test.ts        # Tests logout
│   │   ├── landing-pages/
│   │   │   ├── crud.test.ts          # Tests CRUD pages
│   │   │   ├── design.test.ts        # Tests GET/POST design
│   │   │   └── assets.test.ts        # Tests upload
│   │   ├── users/
│   │   │   └── crud.test.ts          # Tests CRUD users
│   │   └── audit/
│   │       └── logs.test.ts          # Tests consultation logs
│   ├── middleware/
│   │   ├── auth.test.ts              # Tests middleware auth
│   │   ├── permissions.test.ts       # Tests middleware permissions
│   │   └── audit.test.ts             # Tests middleware audit
│   └── utils/
│       ├── jwt.test.ts               # Tests utilitaires JWT
│       ├── password.test.ts          # Tests hashing
│       └── audit.test.ts             # Tests helpers audit
└── setup.ts                          # Configuration globale tests
```

### Types de tests
| Type | Couverture | Description |
|------|------------|-------------|
| **Unitaires** | Utils, helpers | Fonctions isolées (JWT, hashing, etc.) |
| **Intégration** | Middleware | Chaîne auth → permissions → handler |
| **E2E API** | Endpoints | Requêtes HTTP complètes avec BDD test |

### Cas de test obligatoires par endpoint
- ✅ Cas nominal (succès)
- ✅ Authentification manquante (401)
- ✅ Permissions insuffisantes (403)
- ✅ Ressource non trouvée (404)
- ✅ Validation des données (400)
- ✅ Erreur serveur simulée (500)

### CI/CD : Gate de qualité
```yaml
# Dans le pipeline GitHub Actions
- name: Run tests with coverage
  run: yarn test:coverage

- name: Check coverage threshold
  run: |
    # Fail si couverture < 100% sur server/
    yarn nyc check-coverage --lines 100 --functions 100 --branches 100
```

---

## Tests Frontend

### Objectif
Tests complets du frontend pour garantir la qualité de l'interface utilisateur.

### Stack de tests frontend
| Outil | Usage | Cible |
|-------|-------|-------|
| **Vitest** | Test runner rapide | Tous types de tests |
| **Vue Test Utils** | Mount/shallow de composants | Composants Vue |
| **@testing-library/vue** | Tests orientés utilisateur | Interactions UI |
| **Playwright** | Tests E2E navigateur | Parcours complets |
| **MSW** | Mock des appels API | Isolation du frontend |

### Structure des tests frontend
```
tests/
├── unit/
│   ├── composables/
│   │   ├── useAutoSave.test.ts
│   │   ├── usePersistence.test.ts
│   │   └── useRecovery.test.ts
│   ├── stores/
│   │   ├── editor.test.ts
│   │   ├── widgets.test.ts
│   │   ├── auth.test.ts
│   │   └── history.test.ts
│   └── utils/
│       └── widgetConfig.test.ts
├── components/
│   ├── ui/
│   │   ├── Button.test.ts
│   │   ├── Modal.test.ts
│   │   └── Toast.test.ts
│   ├── widgets/
│   │   ├── WidgetRenderer.test.ts
│   │   └── WidgetPalette.test.ts
│   └── layout/
│       ├── EditorToolbar.test.ts
│       └── Sidebar.test.ts
├── pages/
│   ├── login.test.ts
│   ├── dashboard.test.ts
│   └── editor.test.ts
└── e2e/
    ├── auth.spec.ts              # Login → Dashboard
    ├── editor-flow.spec.ts       # Créer page → Éditer → Sauvegarder
    ├── widget-crud.spec.ts       # Ajouter/modifier/supprimer widgets
    └── permissions.spec.ts       # Accès refusé si pas de droits
```

### Types de tests frontend
| Type | Couverture cible | Description |
|------|------------------|-------------|
| **Unitaires** | Stores, composables | Logique métier isolée |
| **Composants** | Composants UI | Rendu, props, events, slots |
| **Intégration** | Pages | Interaction stores + composants |
| **E2E** | Parcours critiques | Scénarios utilisateur complets |

### Cas de test E2E obligatoires
- ✅ Parcours d'authentification (login, logout, session expirée)
- ✅ Création d'une nouvelle landing page
- ✅ Édition du design (ajout widgets, drag-drop, styles)
- ✅ Sauvegarde automatique et manuelle
- ✅ Gestion des erreurs (réseau, serveur)
- ✅ Responsive (mobile, tablet, desktop)

### Configuration Playwright
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
})
```

---

## Déploiement Azure

### Services
| Service | Usage |
|---------|-------|
| Azure App Service | Hébergement Nuxt (Node.js 20) |
| Azure Database for PostgreSQL | Base de données |
| Azure Blob Storage | Assets/images |
| Azure CDN | Distribution assets |
| Azure Key Vault | Secrets (JWT, DB) |

### CI/CD (GitHub Actions)
- **Tests obligatoires** : Couverture 100% requise pour merge
- Build Nuxt
- Migrations Prisma automatiques
- Déploiement App Service

---

## Phases d'Implémentation

### Phase 1 : Infrastructure de base ✅ COMPLÉTÉE

1. ✅ Migrer Vue SPA → Nuxt 3
2. ✅ Configurer Prisma + PostgreSQL
3. ✅ Configurer Vitest + Playwright + structure de tests
4. ✅ Mettre en place le dossier `shared/` (types, schemas Zod, constants)
5. ✅ Implémenter auth JWT (login/register/refresh/logout/me)
6. ✅ Middleware auth + store auth frontend

> **Note** : Tests API auth non encore écrits (reportés à Phase 5)

### Phase 2 : API Core ✅ COMPLÉTÉE

7. ✅ CRUD Landing Pages (tests API à faire en Phase 5)
8. ✅ Endpoints design (GET/POST)
9. ✅ Adapter `usePersistence` et `useAutoSave`
10. ✅ Upload assets (local dev, Azure Blob TODO pour prod)

### Phase 3 : Dashboard Landing Pages ✅ COMPLÉTÉE

> Focus : permettre à l'utilisateur de **lister ses landing pages** et d'en **créer de nouvelles**

11. ✅ Connecter dashboard à l'API (`GET /api/v1/landing-pages`)
12. ✅ Afficher la liste des LPs avec statut, date, actions
13. ✅ Intégrer création de LP (page `/editor/new` + modal titre)
14. ✅ Actions rapides : éditer, supprimer
15. ✅ Retour au dashboard depuis l'éditeur
16. ⏸️ Pages admin (users, audit) - reportées
17. ⏸️ Page register - reportée (login suffit pour l'instant)

### Phase 4 : Sécurité ❌ NON COMMENCÉE

15. ❌ Système de rôles (middleware permissions) + **tests API 100%**
16. ❌ Permissions granulaires par page + **tests API 100%**
17. ❌ Audit logs + interface admin + **tests API 100%**

### Phase 5 : Tests & Qualité ❌ NON COMMENCÉE

18. ❌ Compléter couverture tests frontend (composants, stores)
19. ❌ Tests E2E parcours critiques complets
20. ❌ Tests de performance et charge (optionnel)

### Phase 6 : Déploiement ❌ NON COMMENCÉE

21. ❌ Provisionner Azure (App Service, PostgreSQL, Blob, CDN)
22. ❌ Configurer Key Vault
23. ❌ Pipeline CI/CD GitHub Actions (gates: API 100%, E2E pass)

---

## Fichiers Critiques à Modifier

| Fichier | Modification | Status |
|---------|--------------|--------|
| [client.ts](src/services/api/client.ts) | Ajouter gestion JWT, intercepteur refresh | ✅ |
| [widget.ts](src/types/widget.ts) | Partager avec backend (inchangé) | ✅ |
| [landingPageApi.ts](src/services/api/landingPageApi.ts) | Pattern pour nouveaux endpoints | ✅ |
| [usePersistence.ts](src/composables/usePersistence.ts) | Adapter pour Nuxt/API | ✅ |
| [useAutoSave.ts](src/composables/useAutoSave.ts) | Adapter pour Nuxt/API | ✅ |
| ~~vite.config.ts~~ | Migré vers nuxt.config.ts | ✅ |
| [stores/auth.ts](src/stores/auth.ts) | Store Pinia authentification | ✅ |
| [pages/login.vue](src/pages/login.vue) | Page de connexion | ✅ |
| [middleware/auth.global.ts](src/middleware/auth.global.ts) | Protection routes client | ✅ |

### Fichiers créés (Phase 2) ✅

| Fichier | Description | Status |
|---------|-------------|--------|
| `server/utils/permissions.ts` | Helper requireAuth, checkPermission | ✅ |
| `server/api/v1/landing-pages/index.get.ts` | Liste landing pages (pagination) | ✅ |
| `server/api/v1/landing-pages/index.post.ts` | Créer landing page | ✅ |
| `server/api/v1/landing-pages/[id]/index.get.ts` | Lire une landing page | ✅ |
| `server/api/v1/landing-pages/[id]/index.put.ts` | Modifier une landing page | ✅ |
| `server/api/v1/landing-pages/[id]/index.delete.ts` | Supprimer une landing page | ✅ |
| `server/api/v1/landing-pages/[id]/design.get.ts` | Charger le design | ✅ |
| `server/api/v1/landing-pages/[id]/design.post.ts` | Sauvegarder le design | ✅ |
| `server/api/v1/landing-pages/[id]/assets.post.ts` | Upload d'assets | ✅ |
| `shared/schemas/design.schema.ts` | Validation Zod DesignDocument | ✅ |

---

## Vérification

### Tests à effectuer
1. **Auth** : Login/logout, refresh token, protection routes
2. **CRUD** : Créer/lire/modifier/supprimer landing pages
3. **Design** : Sauvegarder/charger design, auto-save fonctionne
4. **Permissions** : Accès refusé si pas de droits
5. **Audit** : Vérifier logs en BDD après chaque action
6. **Upload** : Upload image → disponible via CDN
