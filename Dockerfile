# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      ffmpeg \
      openssl \
      procps \
    && rm -rf /var/lib/apt/lists/*


# ==================================================
# Dependencies
# ==================================================

FROM base AS dependencies

ENV NODE_ENV=development

COPY package.json package-lock.json ./

RUN npm ci


# ==================================================
# Video regression tests
# ==================================================
#
# Production images may only be built after the
# resumable-upload and worker-health suites pass.
# This makes the deploy workflow fail before any
# running production container is restarted.
# ==================================================

FROM dependencies AS video-tests

COPY . .

RUN npm run test:video


# ==================================================
# Builder
# ==================================================

FROM video-tests AS builder

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_POSTEX_API_KEY

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY}
ENV NEXT_PUBLIC_POSTEX_API_KEY=${NEXT_PUBLIC_POSTEX_API_KEY}

# Source code was copied by the mandatory video-tests stage.

# package.json build خودش prisma generate اجرا می‌کند.
RUN npm run build


# ==================================================
# Runtime
# ==================================================

FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs \
  /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs \
  /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs \
  /app/public ./public

# فایل‌های موردنیاز Video Worker
COPY --from=builder --chown=nextjs:nodejs \
  /app/scripts ./scripts

COPY --from=builder --chown=nextjs:nodejs \
  /app/src ./src

COPY --from=builder --chown=nextjs:nodejs \
  /app/libs ./libs

COPY --from=builder --chown=nextjs:nodejs \
  /app/prisma ./prisma

COPY --from=builder --chown=nextjs:nodejs \
  /app/tsconfig.worker.json ./tsconfig.worker.json

COPY --from=builder --chown=nextjs:nodejs \
  /app/package.json ./package.json

# Worker برای tsx، Prisma و سایر Runtime dependencyها
# به node_modules کامل نیاز دارد.
COPY --from=builder --chown=nextjs:nodejs \
  /app/node_modules ./node_modules

RUN mkdir -p \
      /app/storage/published \
      /app/storage/uploads/jobs \
      /app/storage/processing/jobs \
    && chown -R nextjs:nodejs /app/storage

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]