# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# CI-only target: type-checks and bundles the app as a build correctness
# check. Its output is not the deployable image.
FROM deps AS build-app

ARG HEAD_COMMIT_HASH
ENV HEAD_COMMIT_HASH=${HEAD_COMMIT_HASH}

RUN npm run build:app

# Deployable image. The services, categories and hotlines data is committed
# under src/data, so this builds exactly what is in the repository and needs
# no CMS credentials.
FROM deps AS builder

ARG HEAD_COMMIT_HASH
ENV HEAD_COMMIT_HASH=${HEAD_COMMIT_HASH}

RUN npm run build

# Development stage
FROM builder AS dev

FROM nginx:alpine AS production

LABEL org.opencontainers.image.url="https://www.gov.ph"
LABEL org.opencontainers.image.source="https://github.com/bettergovph/bettergov"

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
