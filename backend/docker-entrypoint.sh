#!/bin/sh
set -e
# Run migrations once per container start (typical for a single replica; set SKIP_DB_MIGRATE=1 if a platform runs many replicas and you migrate via a separate job).
if [ "${SKIP_DB_MIGRATE:-0}" != "1" ]; then
  python manage.py migrate --noinput
fi
if [ "${SKIP_SEED_FIXTURES:-0}" != "1" ]; then
  python manage.py loaddata spells weekly_program || true
fi
exec "$@"
