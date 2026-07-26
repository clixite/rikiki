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
EXPOSE 3000
USER node
CMD ["node", "server/dist/index.js"]
