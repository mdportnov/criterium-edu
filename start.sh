#!/bin/sh
# Exit on any error, and treat unset variables as errors.
set -eu

echo "Waiting for database at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
attempts=0
until nc -z "${DB_HOST:-postgres}" "${DB_PORT:-5432}"; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 60 ]; then
        echo "Database did not become reachable within 120s, giving up." >&2
        exit 1
    fi
    sleep 2
done
echo "Database is ready."

# `set -e` aborts here if this fails. The previous version checked $? after
# the command and printed "continuing anyway", which was unreachable - and
# starting the API against an un-migrated schema is not something to continue
# through in any case.
echo "Running database migrations..."
npx typeorm migration:run -d dist/apps/api/src/database/data-source.js
echo "Migrations completed successfully."

echo "Starting NestJS application..."
exec node dist/apps/api/main.js
