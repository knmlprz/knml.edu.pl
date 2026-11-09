# API publikacji wpisów. Budowane z katalogu głównego repo, bo korzysta z plików
# new-website/src/config i new-website/src/redakcja (lista plików: /.dockerignore):
#   podman build -f services/api/Dockerfile .
# Zwykle przez compose.yaml (podman compose up --build). Opis: services/api/README.md.

# Debian trixie, bo ma libheif 1.23. Sharp z npm nie dekoduje HEIC z iPhone'a (HEVC), robi to
# heif-dec z libheif. Wersja 1.15 z Debiana bookworm obracała takie zdjęcia dwa razy.
FROM docker.io/library/node:22-trixie-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends libheif-examples libheif-plugin-libde265 \
  && rm -rf /var/lib/apt/lists/*
# Data wpisu liczona w strefie czasowej koła.
ENV TZ=Europe/Warsaw
WORKDIR /app/services/api

FROM base AS source
COPY services/api/package.json services/api/package-lock.json ./
RUN npm ci
COPY new-website/src/config /app/new-website/src/config
COPY new-website/src/redakcja /app/new-website/src/redakcja
COPY services/api ./

# Testy z HEIC (w CI i lokalnie):
#   podman build --target test -t knml-api-test -f services/api/Dockerfile . && podman run --rm knml-api-test
FROM source AS test
# Tu brak heif-dec to błąd, nie pominięcie testów HEIC.
ENV HEIC_WYMAGANY=1
CMD ["sh", "-c", "npm run check && npm test"]

FROM source AS build
RUN npm run build && npm prune --omit=dev

FROM base
COPY --from=build /app/services/api/package.json ./
COPY --from=build /app/services/api/node_modules ./node_modules
COPY --from=build /app/services/api/dist ./dist
USER node
EXPOSE 8787
CMD ["node", "dist/server.js"]
