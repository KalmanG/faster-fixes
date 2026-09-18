#!/bin/sh
set -e
if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  echo "[entrypoint] applying Prisma migrations"
  (cd /app/db && npx --no-install prisma migrate deploy)
fi
echo "[entrypoint] starting Next.js"
exec node /app/apps/web/server.js
