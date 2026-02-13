# ═══════════════════════════════════════════════════════════════════════════
# Dockerfile — Next.js TS API (Phase 22C)
# ═══════════════════════════════════════════════════════════════════════════
# Multi-stage build: install → build → production runtime
# Uses Next.js standalone output for minimal image size (~150MB vs ~1GB)

# ── Stage 1: Dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Copy workspace package.json files for npm workspace resolution
COPY packages/core/package.json ./packages/core/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/business/package.json ./packages/business/package.json
RUN npm ci --production=false

# ── Stage 2: Build ──
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js inlines NEXT_PUBLIC_* vars into the JS bundle at build time.
# These must be available during 'next build' for static page generation.
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_AUTH_MODE
ARG NEXT_PUBLIC_SUPER_ADMIN_ID
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_AUTH_MODE=$NEXT_PUBLIC_AUTH_MODE
ENV NEXT_PUBLIC_SUPER_ADMIN_ID=$NEXT_PUBLIC_SUPER_ADMIN_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production Runtime ──
FROM node:22-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy standalone output (includes server.js + required node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
EXPOSE 3001

# Run as non-root
USER nextjs

# Healthcheck: /api/worker/health (use 127.0.0.1 — Alpine resolves localhost to IPv6)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/api/worker/health || exit 1

CMD ["node", "server.js"]
