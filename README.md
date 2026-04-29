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

## Production / Dokploy (`docker-compose.yml`)

Repo-root **`docker-compose.yml`** is the **production** stack (Postgres, Gunicorn, SPA **`serve`** on container port **3000**, scheduler). Point **Dokploy** at this file (and set env vars in the UI).

Publish **two** HTTP ports: **SPA** (`WEB_HTTP_PORT`, default host **3001** → container **3000**) and **API** (`BACKEND_HTTP_PORT`, default **8000**). The SPA is built with **`VITE_API_URL`** pointing at that API origin (default `http://localhost:8000`). Set **`FRONTEND_URL`** to your SPA URL (e.g. `http://localhost:3001`) so **CORS** matches.

Local CLI (same file):

```bash
cp .env.example .env
# DJANGO_SECRET_KEY, POSTGRES_*, DJANGO_ALLOWED_HOSTS=localhost
# FRONTEND_URL=http://localhost:3001
# VITE_API_URL=http://localhost:8000   # optional; compose defaults apply

docker compose up -d --build
docker compose exec backend python manage.py migrate
```

Or: **`make prod-up`** / **`make prod-migrate`** (uses **`docker-compose.yml`**).

### Local development (`docker-compose.dev.yml`)

Hot reload: **`make up`** uses **`docker-compose.dev.yml`** (Vite + `runserver`).

Put **HTTPS** in front (Caddy, Traefik, Cloudflare, …) for real deployments; web push expects a secure origin. For a quick HTTP-only smoke test on localhost, set `DJANGO_SECURE_SSL_REDIRECT=false` in `.env`.

## Layout

```
backend/           Django project (config/) + apps/ (users, journal, meditation, ...)
frontend/          Vite + React + TS app
docker-compose.yml Production / Dokploy (Postgres + Gunicorn + serve + scheduler)
docker-compose.dev.yml Local dev (Vite + runserver + bind mounts)
infra/terraform/   GCP infrastructure as code (later)
docs/              Architecture notes, runbooks
```

## Production access

The same backend image deploys to Cloud Run as both a service (HTTP) and a Cloud Run Job (`manage`). To run an arbitrary management command against production:

```bash
gcloud run jobs execute manage --region=us-central1 --args="shell"
gcloud run jobs execute manage --region=us-central1 --args="createsuperuser"
```

(Job is provisioned by Terraform — see `infra/terraform/README.md` once that step lands.)
