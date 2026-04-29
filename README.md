# Oneiric Academy

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
