# syntax=docker/dockerfile:1.6

# --- build stage ------------------------------------------------------------
FROM node:20-alpine AS builder

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=$HTTP_PROXY
ENV HTTPS_PROXY=$HTTPS_PROXY
ENV NO_PROXY=$NO_PROXY
ENV npm_config_proxy=$HTTP_PROXY
ENV npm_config_https_proxy=$HTTPS_PROXY
ENV npm_config_noproxy=$NO_PROXY

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --filter @fast-pass/api... --filter @fast-pass/shared

COPY packages/shared packages/shared
COPY apps/api apps/api

WORKDIR /app/apps/api
RUN pnpm build

# --- runtime stage ----------------------------------------------------------
FROM node:20-alpine AS runtime

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=$HTTP_PROXY
ENV HTTPS_PROXY=$HTTPS_PROXY
ENV NO_PROXY=$NO_PROXY
ENV npm_config_proxy=$HTTP_PROXY
ENV npm_config_https_proxy=$HTTPS_PROXY
ENV npm_config_noproxy=$NO_PROXY

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --prod --filter @fast-pass/api... --filter @fast-pass/shared

COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/packages/shared/src packages/shared/src
COPY apps/api/migrations apps/api/migrations
COPY apps/api/.node-pg-migraterc.json apps/api/.node-pg-migraterc.json

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/server.js"]
