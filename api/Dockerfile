# ─── Leily API ───────────────────────────────────────────
# Hono + better-sqlite3 — single lightweight container

FROM node:20-alpine AS build
WORKDIR /app

# Native deps for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npx tsc

# ── Runtime ──────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && apk del python3 make g++

COPY --from=build /app/dist/ dist/

# SQLite data volume
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "dist/index.js"]
