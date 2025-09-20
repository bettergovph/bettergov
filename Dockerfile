FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS production

LABEL org.opencontainers.image.authors="guerzon@proton.me"
LABEL org.opencontainers.image.url="https://bettergov.ph"
LABEL org.opencontainers.image.source="https://github.com/bettergovph/bettergov"

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80