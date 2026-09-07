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

# Deployable image. `npm run build` syncs from TalaCMS first, so this stage
# requires TALACMS_API_URL/TALACMS_API_TOKEN in the build environment.
FROM deps AS builder

ARG HEAD_COMMIT_HASH
ENV HEAD_COMMIT_HASH=${HEAD_COMMIT_HASH}

RUN npm run build

# Development stage
FROM builder AS dev

FROM nginx:alpine AS production

LABEL org.opencontainers.image.authors="volunteers@bettergov.ph"
LABEL org.opencontainers.image.url="https://bettergov.ph"
LABEL org.opencontainers.image.source="https://github.com/bettergovph/bettergov"

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
