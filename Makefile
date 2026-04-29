.PHONY: help up down build rebuild logs shell migrate makemigrations seed test lint manage frontend-shell frontend-install ps restart clean tick vapid prod-build prod-up prod-down prod-migrate

# Local hot-reload stack (Vite + runserver). Production/Dokploy uses default `docker-compose.yml`.
COMPOSE_DEV := -f docker-compose.dev.yml

help:
	@echo "Lucivine — local dev commands"
	@echo ""
	@echo "  make up              Dev stack (docker-compose.dev.yml): db, backend, frontend, scheduler"
	@echo "  make down            Stop all services"
	@echo "  make build           Rebuild all images"
	@echo "  make rebuild         Rebuild backend, restart it, apply migrations (use after deps change)"
	@echo "  make logs            Tail logs from all services"
	@echo "  make ps              Show running services"
	@echo "  make restart         Restart backend"
	@echo "  make tick            Manually fire due reminders (sim Cloud Scheduler)"
	@echo "  make vapid           Print Web Push VAPID keys (optional; backend auto-generates)"
	@echo ""
	@echo "  Production / Dokploy (repo root docker-compose.yml — serve + gunicorn + Postgres):"
	@echo "  make prod-build      Build prod images"
	@echo "  make prod-up         Up -d --build (SPA WEB_HTTP_PORT default 3000, API BACKEND_HTTP_PORT default 8000)"
	@echo "  make prod-down       Stop prod stack"
	@echo "  make prod-migrate    Apply migrations in prod backend container"
	@echo ""
	@echo "  make shell           Django shell on backend"
	@echo "  make manage cmd=...  Run any manage.py command, e.g. make manage cmd='createsuperuser'"
	@echo "  make migrate         Apply migrations"
	@echo "  make makemigrations  Create migrations"
	@echo "  make seed            Load fixtures (chakras, spells, weekly program)"
	@echo "  make test            Run pytest"
	@echo "  make lint            Run ruff + eslint"
	@echo ""
	@echo "  make frontend-shell  Shell in frontend container"
	@echo "  make frontend-install npm ci in frontend container (use after package.json changes)"
	@echo "  make clean           Stop and remove volumes (DESTROYS DB)"

up:
	docker compose $(COMPOSE_DEV) up -d
	@echo ""
	@echo "Backend:  http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@echo "Admin:    http://localhost:8000/admin/"
	@echo "API docs: http://localhost:8000/api/schema/swagger/"

down:
	docker compose $(COMPOSE_DEV) down

build:
	docker compose $(COMPOSE_DEV) build

rebuild:
	docker compose $(COMPOSE_DEV) build backend
	docker compose $(COMPOSE_DEV) up -d backend
	docker compose $(COMPOSE_DEV) exec backend python manage.py migrate

vapid:
	@echo "Generating VAPID keys (optional — backend auto-generates if unset)…"
	@echo ""
	@npx --yes web-push generate-vapid-keys
	@echo ""
	@echo "Paste into .env as VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY if you want fixed keys,"
	@echo "then: make restart"

logs:
	docker compose $(COMPOSE_DEV) logs -f --tail=100

ps:
	docker compose $(COMPOSE_DEV) ps

restart:
	docker compose $(COMPOSE_DEV) restart backend

tick:
	@SECRET=$$(grep INTERNAL_SCHEDULER_SECRET .env | cut -d= -f2-); \
	curl -sS -X POST http://localhost:8000/api/internal/fire-due-reminders/ \
	  -H "X-Internal-Secret: $$SECRET" | python3 -m json.tool

shell:
	docker compose $(COMPOSE_DEV) exec backend python manage.py shell

manage:
	docker compose $(COMPOSE_DEV) exec backend python manage.py $(cmd)

migrate:
	docker compose $(COMPOSE_DEV) exec backend python manage.py migrate

makemigrations:
	docker compose $(COMPOSE_DEV) exec backend python manage.py makemigrations

seed:
	docker compose $(COMPOSE_DEV) exec backend python manage.py loaddata spells weekly_program

test:
	docker compose $(COMPOSE_DEV) exec backend pytest

lint:
	docker compose $(COMPOSE_DEV) exec backend ruff check .
	docker compose $(COMPOSE_DEV) exec frontend npm run lint

frontend-shell:
	docker compose $(COMPOSE_DEV) exec frontend sh

frontend-install:
	docker compose $(COMPOSE_DEV) exec frontend npm ci

prod-build:
	docker compose build

prod-up:
	docker compose up -d --build

prod-down:
	docker compose down

prod-migrate:
	docker compose exec backend python manage.py migrate

clean:
	docker compose $(COMPOSE_DEV) down -v
