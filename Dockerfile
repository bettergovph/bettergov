FROM node:22-alpine AS builder

ARG HEAD_COMMIT_HASH
ENV HEAD_COMMIT_HASH=${HEAD_COMMIT_HASH}

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Development stage
FROM builder AS dev

FROM nginx:alpine AS production

LABEL org.opencontainers.image.authors="volunteers@bettergov.ph"
LABEL org.opencontainers.image.url="https://bettergov.ph"
LABEL org.opencontainers.image.source="https://github.com/bettergovph/bettergov"

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
