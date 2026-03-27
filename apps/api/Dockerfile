FROM node:22-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
RUN npm ci --workspace=@sentralyzed/api --workspace=@sentralyzed/shared --include-workspace-root

COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN npm run build --workspace=@sentralyzed/shared
RUN npm run build --workspace=@sentralyzed/api

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono
COPY --from=builder --chown=hono:nodejs /app .
USER hono

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
