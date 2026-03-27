# Infrastructure Guide

## Architecture Overview

Sentralyzed runs as a monorepo with three main services:

- **Web** (Next.js 15): Frontend at `app.sentralyzed.com`
- **API** (Hono.js): Backend at `api.sentralyzed.com`
- **Database**: PostgreSQL 16 + Redis 7

## Home Server Setup

### Requirements

- 4GB+ RAM, 2+ CPU cores, 50GB+ storage
- Ubuntu 22.04 or 24.04 LTS
- Ethernet connection (not WiFi)
- UPS recommended for power resilience

### 1. Install Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Access dashboard at `http://<server-ip>:8000`

### 2. Cloudflare Tunnel

1. Register domain via Cloudflare Registrar
2. Zero Trust → Networks → Tunnels → Create
3. Install `cloudflared` connector on server
4. Map hostnames:
   - `app.sentralyzed.com` → `http://localhost:80`
   - `coolify.sentralyzed.com` → `http://localhost:8000`
   - `api.sentralyzed.com` → `http://localhost:3001`
5. Add wildcard CNAME: `*.sentralyzed.com` → `<tunnel-id>.cfargotunnel.com`

### 3. Provision Services in Coolify

1. Create project "Sentralyzed"
2. Add PostgreSQL 16 (one-click) → name: `sentralyzed-db`
3. Add Redis 7 (one-click) → name: `sentralyzed-redis`
4. Note connection strings for env vars

### 4. Connect GitHub & Deploy

1. Coolify → Sources → Add GitHub App → authorize repo
2. Add `apps/api` as Dockerfile deployment (domain: `api.sentralyzed.com`)
3. Add `apps/web` as Dockerfile deployment (domain: `app.sentralyzed.com`)
4. Set environment variables in Coolify dashboard
5. Auto-deploy triggers on push to `main`

## Backups

### Automated Backups

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * /path/to/sentralyzed/scripts/backup.sh
```

Keeps 7 daily + 4 weekly backups with rotation.

### Manual Restore

```bash
gunzip -c /backups/sentralyzed/daily/sentralyzed_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i sentralyzed-db psql -U sentralyzed sentralyzed_dev
```

## Local Development

```bash
# Start PostgreSQL + Redis
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Run migrations
npm run db:push --workspace=@sentralyzed/api

# Seed dev data
npm run db:seed --workspace=@sentralyzed/api

# Start all apps in dev mode
npm run dev
```

## Upgrade Path: Hetzner VPS

If home hosting is outgrown:

1. Provision Hetzner CX22 (~$8.50/mo)
2. In Coolify dashboard → Servers → Add Remote Server
3. Migrate containers via Coolify's UI — zero code changes needed
