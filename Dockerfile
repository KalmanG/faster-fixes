# Self-hosted Faster Fixes — dashboard + widget API in one container.
# Build:  docker build -t faster-fixes .
# Run:    see self-host/docker-compose.yml
#
# Stages: deps (pnpm install) -> build (prisma generate + next build, standalone)
#         -> runner (node:22-alpine, standalone server + a tiny prisma CLI for migrations)

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat \
 && corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/mcp/package.json packages/mcp/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/widget-core/package.json packages/widget-core/package.json
COPY packages/widget-react/package.json packages/widget-react/package.json
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
COPY . .
# NEXT_PUBLIC_* values are inlined at build time. Everything runtime-relevant
# was made overridable via non-public env (see self-host/README.md).
ENV NEXT_PUBLIC_IS_CLOUD=false \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
# Dummy values so `next build` can evaluate modules that read env at import time.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build \
    DOMAIN_NAME=example.com \
    BASE_URL=https://example.com \
    BETTER_AUTH_URL=https://example.com \
    BETTER_AUTH_SECRET=build-time-placeholder \
    LINEAR_TOKEN_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000 \
    JIRA_TOKEN_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000 \
    SLACK_TOKEN_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000
RUN pnpm turbo run build --filter=web...

# ---------- runner ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# Next standalone output (pruned node_modules + server.js for the web app)
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Prisma CLI + schema/migrations so the container can run `migrate deploy` on start.
COPY --from=build /app/packages/database/schema ./db/schema
COPY --from=build /app/packages/database/migrations ./db/migrations
COPY --from=build /app/packages/database/prisma.config.ts ./db/prisma.config.ts
RUN cd db && npm init -y >/dev/null && npm install --no-audit --no-fund --omit=dev prisma@7.2.0 dotenv@17 \
 && chown -R nextjs:nodejs /app/db

COPY --chown=nextjs:nodejs self-host/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
