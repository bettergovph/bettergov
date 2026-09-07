# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# CI-only target: bundles the app without syncing TalaCMS, so pull request
# checks (including from forks) never need TalaCMS credentials. This is a
# build correctness check only — its output is not the deployable image.
FROM deps AS build-app

ARG HEAD_COMMIT_HASH
ENV HEAD_COMMIT_HASH=${HEAD_COMMIT_HASH}

RUN npm run build:app

# Deployable image. `npm run build` only consumes already-generated CMS data,
# so this stage runs the `cms:fetch` pre-build step first, using the same
# TALACMS_API_URL/TALACMS_API_TOKEN env vars scripts/talacms/client.ts already
# reads — supplied here as BuildKit secrets, never as ARG/ENV, so they never
# land in an image layer or build cache. `required=true` fails the build
# before any RUN command executes if either secret is not passed in; the
# `&&` chain then fails closed a second time (via cms:fetch's own
# fail-closed check) if a secret is present but empty, and either failure
# happens before `npm run build` ever runs.
FROM deps AS builder

ARG HEAD_COMMIT_HASH
ENV HEAD_COMMIT_HASH=${HEAD_COMMIT_HASH}

RUN --mount=type=secret,id=talacms_api_url,required=true \
    --mount=type=secret,id=talacms_api_token,required=true \
    export TALACMS_API_URL="$(cat /run/secrets/talacms_api_url)" && \
    export TALACMS_API_TOKEN="$(cat /run/secrets/talacms_api_token)" && \
    npm run cms:fetch && \
    npm run build

# Development stage
FROM builder AS dev

FROM nginx:alpine AS production

LABEL org.opencontainers.image.authors="volunteers@bettergov.ph"
LABEL org.opencontainers.image.url="https://bettergov.ph"
LABEL org.opencontainers.image.source="https://github.com/bettergovph/bettergov"

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
