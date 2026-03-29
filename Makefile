.DEFAULT_GOAL := help

# ── Bootstrap helpers ────────────────────────────────────────
wait-postgres:
	@echo "Attente PostgreSQL..."
	@until docker compose exec -T postgres pg_isready -U $${POSTGRES_USER:-wellpack} > /dev/null 2>&1; do sleep 1; done

wait-api:
	@echo "Attente API healthcheck..."
	@until docker compose exec -T api curl -sf http://localhost/up > /dev/null 2>&1; do sleep 2; done

bootstrap-api-local:
	docker compose up -d postgres redis
	$(MAKE) wait-postgres
	docker compose up -d api
	$(MAKE) wait-api
	docker compose exec -T api php scripts/ensure_local_dev_seed.php

# ── Setup ─────────────────────────────────────────────────────
setup: ## Premier lancement complet du monorepo v2
	cp -n .env.example .env 2>/dev/null || true
	cp -n apps/api/.env.example apps/api/.env 2>/dev/null || true
	touch .env.kreo.generated
	@echo "Docker project: wellpack-$${PORT_PREFIX:-80}"
	@echo "Port prefix: $${PORT_PREFIX:-80}"
	docker compose build api dashboard kreo dashboard-dev kreo-dev
	docker compose up -d postgres redis
	$(MAKE) wait-postgres
	docker compose up -d api
	$(MAKE) wait-api
	docker compose exec -T api composer dump-autoload
	@grep -q '^APP_KEY=$$' apps/api/.env 2>/dev/null && docker compose exec -T api php artisan key:generate || true
	docker compose exec -T api php artisan migrate --force
	docker compose exec -T api php artisan db:seed --force
	docker compose exec -T api php scripts/ensure_passport_personal_access_client.php Wellpack users
	docker compose run --rm kreo-dev sh -lc "if [ ! -f 'node_modules/.modules.yaml' ]; then pnpm install --frozen-lockfile; fi"
	$(MAKE) up
	@echo ""
	@echo "V2 ready:"
	@echo "  API:        http://localhost:$${PORT_PREFIX:-80}00"
	@echo "  Dashboard:  http://localhost:$${PORT_PREFIX:-80}01"
	@echo "  Kreo:       http://localhost:$${PORT_PREFIX:-80}02"
	@echo "  Mailpit:    http://localhost:$${PORT_PREFIX:-80}25"
	@echo "  PostgreSQL: localhost:$${PORT_PREFIX:-80}32"
	@echo "  Redis:      localhost:$${PORT_PREFIX:-80}79"

# ── Lifecycle ─────────────────────────────────────────────────
up: ## Démarrer le stack stable (API + dashboard + kreo)
	-docker compose stop dashboard-dev kreo-dev
	$(MAKE) bootstrap-api-local
	docker compose up -d postgres redis mailpit api horizon scheduler dashboard kreo

dev: ## Démarrer le stack HMR (API + dashboard-dev + kreo-dev)
	-docker compose stop dashboard kreo
	$(MAKE) bootstrap-api-local
	docker compose --profile dev up -d postgres redis mailpit api horizon scheduler dashboard-dev kreo-dev

down: ## Arrêter tous les services
	docker compose down --remove-orphans

restart: ## Redémarrer tous les services actifs
	docker compose restart

restart-api: ## Redémarrer API + Horizon + Scheduler
	docker compose restart api horizon scheduler

restart-front: ## Redémarrer les fronts stables
	docker compose restart dashboard kreo

restart-front-dev: ## Redémarrer les fronts dev
	docker compose restart dashboard-dev kreo-dev

# ── Logs ──────────────────────────────────────────────────────
logs: ## Logs temps réel (tous les services)
	docker compose logs -f

logs-api: ## Logs API + workers
	docker compose logs -f api horizon scheduler

logs-front: ## Logs dashboard/kreo (stable + dev)
	docker compose logs -f dashboard dashboard-dev kreo kreo-dev

# ── API (Laravel) ─────────────────────────────────────────────
artisan: ## php artisan (usage: make artisan cmd="migrate:status")
	docker compose exec api php artisan $(cmd)

composer: ## composer (usage: make composer cmd="require foo/bar")
	docker compose exec api composer $(cmd)

migrate: ## Lancer les migrations API
	docker compose exec api php artisan migrate --force

seed: ## Lancer les seeders API
	docker compose exec api php artisan db:seed --force

fresh: ## Migrate fresh + seed (DESTRUCTIF)
	docker compose exec api php artisan migrate:fresh --seed --force

# ── Frontends (Nuxt) ──────────────────────────────────────────
pnpm-dashboard: ## Commande pnpm dashboard (usage: make pnpm-dashboard cmd="test")
	docker compose run --rm dashboard-dev pnpm --filter dashboard $(cmd)

pnpm-kreo: ## Commande pnpm kreo (usage: make pnpm-kreo cmd="typecheck")
	docker compose run --rm kreo-dev pnpm --filter kreo $(cmd)

types: ## Régénérer les types OpenAPI du dashboard
	docker compose run --rm dashboard-dev pnpm --filter dashboard generate:types

# ── Tests + Qualité ───────────────────────────────────────────
test: test-api test-dashboard test-kreo ## Lancer les tests v2

test-api: ## Tests API (Pest)
	docker compose exec api php artisan test

test-dashboard: ## Tests dashboard
	docker compose run --rm dashboard-dev pnpm --filter dashboard test

test-kreo: ## Tests kreo
	docker compose run --rm kreo-dev pnpm --filter kreo test

quality: ## Qualité API + typecheck fronts
	docker compose exec api composer quality
	docker compose run --rm dashboard-dev pnpm --filter dashboard typecheck
	docker compose run --rm kreo-dev pnpm --filter kreo typecheck

# ── Shells ────────────────────────────────────────────────────
shell-api: ## Shell bash dans API
	docker compose exec api bash

shell-dashboard: ## Shell sh dans dashboard-dev
	docker compose exec dashboard-dev sh

shell-kreo: ## Shell sh dans kreo-dev
	docker compose exec kreo-dev sh

shell-db: ## Shell psql dans PostgreSQL
	docker compose exec postgres psql -U $${POSTGRES_USER:-wellpack} -d $${POSTGRES_DB:-platform-api}

# ── Maintenance ───────────────────────────────────────────────
status: ## Statut des containers
	docker compose ps

clean: ## Supprimer containers + volumes (DESTRUCTIF)
	docker compose down -v --remove-orphans

rebuild: ## Rebuild toutes les images
	docker compose build --no-cache api dashboard kreo dashboard-dev kreo-dev

rebuild-api: ## Rebuild uniquement l'image API
	docker compose build --no-cache api

# ── Help ──────────────────────────────────────────────────────
help: ## Afficher cette aide
	@echo ""
	@echo "Wellpack v2 — Commandes disponibles :"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
