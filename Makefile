.DEFAULT_GOAL := help

# ── Setup ─────────────────────────────────────────────────────
setup: ## Premier lancement : build + install + migrate + seed + passport
	@echo "🚀 Setup Wellpack Platform..."
	cp -n .env.example .env 2>/dev/null || true
	docker compose build
	docker compose up -d postgres redis
	@echo "⏳ Attente PostgreSQL..."
	@until docker compose exec -T postgres pg_isready -U $${POSTGRES_USER:-wellpack} > /dev/null 2>&1; do sleep 1; done
	docker compose up -d api
	@echo "⏳ Attente API healthcheck..."
	@until docker compose exec -T api curl -sf http://localhost/up > /dev/null 2>&1; do sleep 2; done
	docker compose exec api php artisan db:seed
	docker compose exec api php artisan passport:client --personal --name="Wellpack" --no-interaction
	docker compose up -d
	@echo ""
	@echo "✅ Wellpack Platform prête !"
	@echo "   API:        http://localhost:$${PORT_PREFIX:-80}00"
	@echo "   Dashboard:  http://localhost:$${PORT_PREFIX:-80}01"
	@echo "   Mailpit:    http://localhost:$${PORT_PREFIX:-80}25"
	@echo "   Horizon:    http://localhost:$${PORT_PREFIX:-80}00/horizon"
	@echo "   API Docs:   http://localhost:$${PORT_PREFIX:-80}00/docs/api"

# ── Lifecycle ─────────────────────────────────────────────────
up: ## Démarrer tous les services
	docker compose up -d

down: ## Arrêter tous les services
	docker compose down

restart: ## Redémarrer tous les services
	docker compose restart

restart-api: ## Redémarrer API + Horizon + Scheduler
	docker compose restart api horizon scheduler

restart-dash: ## Redémarrer Dashboard
	docker compose restart dashboard

# ── Logs ──────────────────────────────────────────────────────
logs: ## Logs temps réel (tous les services)
	docker compose logs -f

logs-api: ## Logs API + Horizon + Scheduler
	docker compose logs -f api horizon scheduler

logs-dash: ## Logs Dashboard
	docker compose logs -f dashboard

pail: ## Laravel Pail — logs temps réel filtrables
	docker compose exec api php artisan pail

pail-error: ## Laravel Pail — erreurs uniquement
	docker compose exec api php artisan pail --filter="level:error"

# ── API (Laravel) ─────────────────────────────────────────────
artisan: ## php artisan (usage: make artisan cmd="migrate:status")
	docker compose exec api php artisan $(cmd)

composer: ## composer (usage: make composer cmd="require foo/bar")
	docker compose exec api composer $(cmd)

migrate: ## Lancer les migrations
	docker compose exec api php artisan migrate

seed: ## Lancer les seeders
	docker compose exec api php artisan db:seed

fresh: ## Migrate fresh + seed (repart de zéro)
	docker compose exec api php artisan migrate:fresh --seed

tinker: ## Ouvrir Tinker (REPL Laravel)
	docker compose exec api php artisan tinker

horizon-status: ## Statut Horizon
	docker compose exec api php artisan horizon:status

# ── Dashboard (Nuxt) ─────────────────────────────────────────
pnpm: ## pnpm (usage: make pnpm cmd="add dayjs")
	docker compose exec dashboard pnpm $(cmd)

types: ## Régénérer les types OpenAPI depuis l'API
	docker compose exec dashboard pnpm generate:types

# ── Tests + Qualité ───────────────────────────────────────────
test: test-api test-dash ## Lancer TOUS les tests (API + Dashboard)

test-api: ## Tests API (Pest)
	docker compose exec api php artisan test

test-api-parallel: ## Tests API en parallèle
	docker compose exec api php artisan test --parallel

test-dash: ## Tests Dashboard (Vitest)
	docker compose exec dashboard pnpm test

quality: ## Lint + PHPStan + Tests API
	docker compose exec api composer quality

coverage: ## Tests API avec couverture
	docker compose exec api php artisan test --coverage

# ── Documentation ─────────────────────────────────────────────
docs: ## Ouvrir la documentation API (Scramble)
	@echo "📖 API Docs: http://localhost:$${PORT_PREFIX:-80}00/docs/api"
	@open "http://localhost:$${PORT_PREFIX:-80}00/docs/api" 2>/dev/null || true

# ── Shells ────────────────────────────────────────────────────
shell-api: ## Shell bash dans le container API
	docker compose exec api bash

shell-dash: ## Shell sh dans le container Dashboard
	docker compose exec dashboard sh

shell-db: ## Shell psql dans PostgreSQL
	docker compose exec postgres psql -U $${POSTGRES_USER:-wellpack} -d $${POSTGRES_DB:-platform-api}

shell-redis: ## Shell redis-cli
	docker compose exec redis redis-cli

# ── Maintenance ───────────────────────────────────────────────
status: ## Statut de tous les containers
	@docker compose ps

clean: ## Supprimer containers + volumes (DESTRUCTIF)
	docker compose down -v

rebuild: ## Rebuild les images (après modif Dockerfile)
	docker compose build --no-cache

rebuild-api: ## Rebuild uniquement l'image API
	docker compose build --no-cache api

# ── Help ──────────────────────────────────────────────────────
help: ## Afficher cette aide
	@echo ""
	@echo "Wellpack Platform — Commandes disponibles :"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
