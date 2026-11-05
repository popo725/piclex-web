# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY tsconfig.json vite.config.ts ./
COPY apps/public/ apps/public/
COPY packages/ packages/
COPY content/snapshot.json content/snapshot.json
COPY scripts/build-public-content.mjs scripts/build-public-content.mjs
RUN --mount=type=cache,target=/var/cache/piclex-content \
    PICLEX_CONTENT_CACHE=/var/cache/piclex-content npm run content:build
RUN npm run build

FROM nginx:stable-alpine AS runtime
LABEL org.opencontainers.image.title="PicLex Web" \
      org.opencontainers.image.description="Photo-based English learning with bundled public decks" \
      org.opencontainers.image.source="https://github.com/zhaoolee/piclex-web" \
      org.opencontainers.image.licenses="MIT"
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/piclex-web/
COPY LICENSE ASSET_LICENSES.md /usr/share/licenses/piclex-web/
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/piclex-web/library/catalog.json || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
