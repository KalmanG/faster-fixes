# Self-hosting Faster Fixes with Docker

This branch (`self-host`) adds what the upstream repo lacks for running your own
instance: a `Dockerfile`, a `docker-compose.yml`, a GitHub Actions workflow that
publishes the image to GHCR, and five small source patches (listed below).

## What runs

| Service   | Image                     | Purpose                                  |
| --------- | ------------------------- | ---------------------------------------- |
| `app`     | `ghcr.io/<you>/faster-fixes` | Next.js dashboard + widget API + MCP API |
| `db`      | `postgres:16-alpine`      | Application database                      |
| `inngest` | `inngest/inngest`         | Background jobs (self-hosted, SQLite)     |

External: a Cloudflare R2 bucket for screenshots (optional — feedback still
saves without it) and a Resend key for the sign-up/password-reset email.

Traefik is assumed to already be running on the host (Dokploy) and attached to
`dokploy-network`; `traefik.yml` is the routing file for it.

## Deploy (first time)

```bash
mkdir -p /opt/faster-fixes && cd /opt/faster-fixes
curl -fsSLO https://raw.githubusercontent.com/<you>/faster-fixes/self-host/self-host/docker-compose.yml
curl -fsSL  https://raw.githubusercontent.com/<you>/faster-fixes/self-host/self-host/.env.example -o .env
# edit .env (hostname, secrets, R2, Resend)
docker compose up -d
```

Then drop `traefik.yml` (hostname edited) into `/etc/dokploy/traefik/dynamic/faster-fixes.yml`.
The app container runs `prisma migrate deploy` on every start, so upgrades are
`docker compose pull && docker compose up -d`.

Sign up at `https://<host>/signup` — the first account is the admin.

## Source patches on this branch

- `apps/web/next.config.mjs` — `output: "standalone"` so the image is small.
- `packages/database/index.ts` — Neon HTTP driver only when the URL is Neon;
  otherwise the standard `pg` adapter (upstream used Neon for all of production).
- `apps/web/src/lib/mailer/constants.ts` — `MAIL_FROM` env override for the
  sender (Resend without a verified domain must send from `onboarding@resend.dev`).
- `apps/web/src/lib/mailer/client.ts` — mailer is created on first use, not at
  import; the Resend SDK throws without a key, which broke `next build` and
  would crash an instance that hasn't set up email yet.
- `apps/web/src/server/storage/index.ts` — R2 client created on first use, for
  the same reason as the mailer (screenshots are optional; uploads that fail
  are already non-fatal).
- `apps/web/src/server/auth/{index,plugins/stripe}.ts` — the Stripe auth
  plugin is registered only when `NEXT_PUBLIC_IS_CLOUD=true`; self-hosted
  installs already get the full plan without billing, and the plugin demanded a
  webhook secret in production and tried to create Stripe customers on sign-up.
- `apps/web/src/server/storage/{build-asset-url,resolve-s3-url}.ts` — read
  `STORAGE_BASE_URL` at runtime; `NEXT_PUBLIC_STORAGE_BASE_URL` is inlined at
  build time and can't be set per-deployment on a prebuilt image.

Keeping up with upstream: `git fetch upstream && git rebase upstream/main`.
