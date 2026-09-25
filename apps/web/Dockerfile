# syntax=docker/dockerfile:1.6

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

RUN pnpm install --frozen-lockfile --filter @fast-pass/web... --filter @fast-pass/shared

COPY packages/shared packages/shared
COPY apps/web apps/web

WORKDIR /app/apps/web
RUN pnpm build

# --- nginx runtime ----------------------------------------------------------
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
