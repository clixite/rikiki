# --- Étape de build : compile le client (Vite) et le serveur (esbuild)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY tsconfig.base.json ./
COPY shared/ shared/
COPY server/ server/
COPY client/ client/
RUN npm run build

# --- Étape finale : uniquement le nécessaire à l'exécution
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/server/dist/ server/dist/
COPY --from=build /app/client/dist/ client/dist/
# Le conteneur tourne sans privilèges : le dossier de la base doit lui appartenir
RUN mkdir -p /app/data && chown -R node:node /app/data
EXPOSE 3000
USER node
# Sonde native Docker : interroge /api/health (qui vérifie réellement la base
# et répond 503 si elle ne répond pas) avec Node lui-même, sans dépendance
# supplémentaire (pas de curl dans l'image alpine). Sans cela, `docker ps` ne
# peut jamais signaler "unhealthy" pour un serveur qui répond mais
# dysfonctionne (base injoignable) — seul un process planté déclenche
# aujourd'hui `restart: unless-stopped`.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/dist/index.js"]
