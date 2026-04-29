.PHONY: help up down build rebuild logs shell migrate makemigrations seed test lint manage frontend-shell frontend-install ps restart clean tick vapid prod-build prod-up prod-down prod-migrate

help:
	@echo "Lucivine — local dev commands"
	@echo ""
	@echo "  make up              Start db, backend, frontend, and reminder scheduler"
	@echo "  make down            Stop all services"
	@echo "  make build           Rebuild all images"
	@echo "  make rebuild         Rebuild backend, restart it, apply migrations (use after deps change)"
	@echo "  make logs            Tail logs from all services"
	@echo "  make ps              Show running services"
	@echo "  make restart         Restart backend"
	@echo "  make tick            Manually fire due reminders (sim Cloud Scheduler)"
	@echo "  make vapid           Print Web Push VAPID keys (optional; backend auto-generates)"
	@echo ""
	@echo "  Production (docker-compose.prod.yml — nginx + gunicorn + Postgres):"
	@echo "  make prod-build      Build prod images"
	@echo "  make prod-up         Up -d --build (bind HTTP port WEB_HTTP_PORT, default 80)"
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
	docker compose up -d
	@echo ""
	@echo "Backend:  http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@echo "Admin:    http://localhost:8000/admin/"
	@echo "API docs: http://localhost:8000/api/schema/swagger/"

down:
	docker compose down

build:
	docker compose build

rebuild:
	docker compose build backend
	docker compose up -d backend
	docker compose exec backend python manage.py migrate

vapid:
	@echo "Generating VAPID keys (optional — backend auto-generates if unset)…"
	@echo ""
	@npx --yes web-push generate-vapid-keys
	@echo ""
	@echo "Paste into .env as VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY if you want fixed keys,"
	@echo "then: make restart"

logs:
	docker compose logs -f --tail=100

ps:
	docker compose ps

restart:
	docker compose restart backend

tick:
	@SECRET=$$(grep INTERNAL_SCHEDULER_SECRET .env | cut -d= -f2-); \
	curl -sS -X POST http://localhost:8000/api/internal/fire-due-reminders/ \
	  -H "X-Internal-Secret: $$SECRET" | python3 -m json.tool

shell:
	docker compose exec backend python manage.py shell

manage:
	docker compose exec backend python manage.py $(cmd)

migrate:
	docker compose exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

seed:
	docker compose exec backend python manage.py loaddata spells weekly_program

test:
	docker compose exec backend pytest

lint:
	docker compose exec backend ruff check .
	docker compose exec frontend npm run lint

frontend-shell:
	docker compose exec frontend sh

frontend-install:
	docker compose exec frontend npm ci

prod-build:
	docker compose -f docker-compose.prod.yml build

prod-up:
	docker compose -f docker-compose.prod.yml up -d --build

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-migrate:
	docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

clean:
	docker compose down -v
