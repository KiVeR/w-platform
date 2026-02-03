# Wellpack Platform

Monorepo pour la nouvelle plateforme Wellpack (refonte admin + front).

## Structure

```
platform/
├── apps/
│   ├── api/            # Laravel 12 REST API
│   └── dashboard/      # Nuxt 3 B2B self-service
├── layers/
│   └── kreo-editor/    # Nuxt Layer - éditeurs visuels
└── packages/           # Types partagés (optionnel)
```

## Prérequis

- Node.js 20+
- pnpm 9+
- PHP 8.3+
- Composer

## Installation

```bash
pnpm install
```

## Développement

```bash
# Dashboard (Nuxt 3)
pnpm dev:dashboard

# API (Laravel)
pnpm dev:api
```

## Documentation

Voir [MIGRATION-PLATFORM.md](../MIGRATION-PLATFORM.md) pour le plan complet de migration.
