# Lucivine

A full-stack lucid dreaming platform: structured 6-week curriculum, dream journal, chakra meditation, reality checks, and a progressive grimoire of in-dream "spells".

**Stack:** Django 5 + DRF + Postgres + Redis + Celery (backend) · React 18 + Vite + TypeScript + Tailwind + Framer Motion (frontend) · Docker Compose (local) · Cloud Run + Cloud SQL + Memorystore (production).

## Quickstart

Requirements: Docker Desktop (or compatible), `make`.

```bash
cp .env.example .env        # edit if you want; defaults work for local
make build
make up
make migrate
make seed                   # loads chakras, spells, weekly program (later)
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin/
- API schema: http://localhost:8000/api/schema/swagger/

## Common commands

```bash
make logs                   # tail all logs
make shell                  # Django shell
make manage cmd=createsuperuser
make manage cmd="dumpdata users.User --indent 2"
make test                   # backend pytest
make restart                # restart backend + celery
make down                   # stop everything
make clean                  # stop + drop volumes (destroys local DB)
```

## Production (`docker-compose.prod.yml`)

Single Compose file for a VPS-style deploy: **Postgres**, **Gunicorn**, **nginx** (built SPA + proxies `/api`, `/admin`, `/static`, `/health/`), plus the **scheduler** loop calling the internal reminder endpoint.

```bash
cp .env.example .env
# DJANGO_SECRET_KEY, POSTGRES_*,
# DJANGO_ALLOWED_HOSTS=your.domain.com
# FRONTEND_URL=https://your.domain.com
# CSRF_TRUSTED_ORIGINS=https://your.domain.com
# INTERNAL_SCHEDULER_SECRET=long-random-string
# Omit VITE_API_URL so the browser uses same-origin `/api` via nginx.

make prod-up
make prod-migrate
```

Bind port **`WEB_HTTP_PORT`** (default `80`). Put HTTPS in front (Caddy, Traefik, Cloudflare, …); web push expects a secure origin. For a quick HTTP-only smoke test on localhost, set `DJANGO_SECURE_SSL_REDIRECT=false` in `.env`.

## Layout

```
backend/           Django project (config/) + apps/ (users, journal, meditation, ...)
frontend/         Vite + React + TS app
infra/terraform/  GCP infrastructure as code (later)
docs/             Architecture notes, runbooks
```

## Production access

The same backend image deploys to Cloud Run as both a service (HTTP) and a Cloud Run Job (`manage`). To run an arbitrary management command against production:

```bash
gcloud run jobs execute manage --region=us-central1 --args="shell"
gcloud run jobs execute manage --region=us-central1 --args="createsuperuser"
```

(Job is provisioned by Terraform — see `infra/terraform/README.md` once that step lands.)
