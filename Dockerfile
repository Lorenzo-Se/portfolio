# App-ID: portfolio-lse
# Stack: Next.js 16 standalone (Node 20, Debian bookworm-slim).
# OKD: non-root UID 1001, group 0, Listen 8080. Keine Secrets im Image.
#
# Debian statt UBI: ubi9/nodejs-20 ersetzt /etc/ssl/certs durch einen Symlink.
# Der okd-kaniko-runner mountet dort tc-ca read-only — Kaniko kann das nicht unlinken.

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    BUILD_STANDALONE=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

RUN chgrp -R 0 /app \
    && chmod -R g+rwX /app

USER 1001:0
EXPOSE 8080
CMD ["node", "server.js"]
