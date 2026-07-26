#!/usr/bin/env bash
# Installation de Rikiki sur un VPS Ubuntu/Debian (Hostinger).
#
# Usage (en root, depuis le terminal du VPS) :
#   CERTBOT_EMAIL=vous@email.fr DOMAIN=rikiki.mondomaine.fr bash install.sh
#
# Le script s'adapte au serveur : il détecte le reverse proxy déjà en place
# (nginx, Traefik, Caddy, Nginx Proxy Manager…) et ne modifie jamais les
# services existants. Ré-exécutable sans risque (sert aussi aux mises à jour).
set -euo pipefail

DOMAIN="${DOMAIN:-rikiki.clixite-prod.cloud}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
REPO_URL="${REPO_URL:-https://github.com/clixite/rikiki.git}"
BRANCH="${BRANCH:-claude/rikiki-multiplayer-card-game-t2urye}"
APP_PORT="${APP_PORT:-3000}"
export APP_PORT
APP_DIR=/opt/rikiki

diagnostics() {
  echo ""
  echo "=== Diagnostic à copier-coller à Claude ==="
  echo "--- ports 80 / 443 / ${APP_PORT} ---"
  ss -ltnp 2>/dev/null | grep -E ":(80|443|${APP_PORT}) " || echo "(aucun)"
  echo "--- conteneurs docker ---"
  docker ps --format '{{.Names}} | {{.Image}} | {{.Ports}}' 2>/dev/null || echo "(docker absent)"
  echo "--- nginx ---"
  nginx -v 2>&1 || echo "(nginx absent)"
  ls /etc/nginx/sites-enabled 2>/dev/null || true
  echo "==========================================="
}

echo "=== Rikiki : installation sur ${DOMAIN} ==="
export DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------- 1/6 pré-checks
echo "--- 1/6 Vérifications (le VPS héberge peut-être déjà d'autres services)"

# Qui écoute sur le port 80 ? (détermine toute la suite)
PROXY_MODE="none"          # none | nginx | traefik | container
PROXY_INFO=""
TRAEFIK_CONTAINER=""

# Traefik gère le routage par réseau Docker : on cherche son conteneur en premier.
if command -v docker >/dev/null 2>&1; then
  TRAEFIK_CONTAINER="$(docker ps --format '{{.Names}}|{{.Image}}' 2>/dev/null | awk -F'|' 'tolower($2) ~ /traefik/ {print $1; exit}' || true)"
fi

if [ -n "$TRAEFIK_CONTAINER" ]; then
  PROXY_MODE="traefik"
elif ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE '(^|:)80$'; then
  if command -v docker >/dev/null 2>&1; then
    PROXY_INFO="$(docker ps --format '{{.Names}} | {{.Image}} | {{.Ports}}' 2>/dev/null | grep -E ':80->|:80/tcp' || true)"
  fi
  if [ -n "$PROXY_INFO" ]; then
    PROXY_MODE="container"
  elif command -v nginx >/dev/null 2>&1 && ss -ltnp 2>/dev/null | grep ':80 ' | grep -q nginx; then
    PROXY_MODE="nginx"
  else
    echo "❌ Un serveur web inconnu occupe le port 80 (Apache ? autre ?)."
    echo "   Collez le diagnostic ci-dessous à Claude : il adaptera la configuration."
    diagnostics
    exit 1
  fi
fi

# En mode Traefik, l'application n'expose aucun port sur l'hôte : rien à vérifier.
if [ "$PROXY_MODE" != "traefik" ] && ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE '(^|:)'"${APP_PORT}"'$'; then
  echo "❌ Le port ${APP_PORT} est déjà pris par un autre service."
  echo "   Relancez la même commande précédée de : APP_PORT=3210"
  diagnostics
  exit 1
fi

case "$PROXY_MODE" in
  traefik)   echo "    Traefik détecté (conteneur « ${TRAEFIK_CONTAINER} ») → raccordement par labels, aucun port exposé" ;;
  nginx)     echo "    nginx détecté sur le port 80 → configuration d'un site dédié" ;;
  container) echo "    reverse proxy conteneurisé détecté → l'application sera exposée en local, sans toucher au proxy" ;;
  none)      echo "    port 80 libre → nginx sera installé" ;;
esac

# ---------------------------------------------------------------- 2/6 paquets
echo "--- 2/6 Docker et paquets"
command -v docker >/dev/null 2>&1 || curl -fsSL https://get.docker.com | sh
apt-get update -y -qq
apt-get install -y -qq git openssl
if [ "$PROXY_MODE" = "none" ] || [ "$PROXY_MODE" = "nginx" ]; then
  apt-get install -y -qq nginx certbot python3-certbot-nginx
fi

# ---------------------------------------------------------------- 3/6 code
echo "--- 3/6 Code source"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/${BRANCH}"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

# ---------------------------------------------------------------- 4/6 config
echo "--- 4/6 Configuration (.env)"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<EOF
PORT=3000
PUBLIC_URL=https://${DOMAIN}
JWT_SECRET=$(openssl rand -hex 32)
DB_PATH=/app/data/rikiki.db
EOF
  echo "    .env créé (sans SMTP : la sauvegarde de profil par e-mail est désactivée — voir deploy/DEPLOY.md)"
else
  echo "    .env existant conservé"
fi

# ---------------------------------------------------------------- 5/6 conteneur
echo "--- 5/6 Build et lancement du conteneur (quelques minutes au premier lancement)"
# L'application tourne sous l'utilisateur « node » (uid 1000) dans le conteneur :
# le dossier de la base SQLite monté depuis l'hôte doit lui appartenir.
mkdir -p "$APP_DIR/data"
chown -R 1000:1000 "$APP_DIR/data"
cd "$APP_DIR/deploy"

if [ "$PROXY_MODE" = "traefik" ]; then
  # --- Reprendre la convention Traefik déjà utilisée par les autres services du serveur
  ALL_LABELS="$(docker ps -q | xargs -r docker inspect --format '{{range $k, $v := .Config.Labels}}{{$k}}={{$v}}
{{end}}' 2>/dev/null || true)"

  if [ -z "${TRAEFIK_NETWORK:-}" ]; then
    TRAEFIK_NETWORK="$(printf '%s\n' "$ALL_LABELS" | sed -n 's/^traefik\.docker\.network=//p' | head -1)"
  fi
  if [ -z "${TRAEFIK_NETWORK:-}" ]; then
    TRAEFIK_NETWORK="$(docker inspect "$TRAEFIK_CONTAINER" \
      --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}
{{end}}' | grep -v '^bridge$' | grep -v '^$' | head -1)"
  fi
  : "${TRAEFIK_NETWORK:=bridge}"

  if [ -z "${TRAEFIK_ENTRYPOINT:-}" ]; then
    TRAEFIK_ENTRYPOINT="$(printf '%s\n' "$ALL_LABELS" \
      | sed -n 's/^traefik\.http\.routers\.[^.]*\.entrypoints=//p' | tr ',' '\n' \
      | grep -vx 'web' | grep -v '^$' | head -1)"
  fi
  : "${TRAEFIK_ENTRYPOINT:=websecure}"

  if [ -z "${TRAEFIK_CERTRESOLVER:-}" ]; then
    TRAEFIK_CERTRESOLVER="$(printf '%s\n' "$ALL_LABELS" | sed -n 's/^.*\.certresolver=//p' | head -1)"
  fi

  echo "    réseau Traefik   : ${TRAEFIK_NETWORK}"
  echo "    entrypoint       : ${TRAEFIK_ENTRYPOINT}"
  echo "    certresolver     : ${TRAEFIK_CERTRESOLVER:-<aucun : certificat par défaut de Traefik>}"

  if ! docker network inspect "$TRAEFIK_NETWORK" >/dev/null 2>&1; then
    echo "❌ Le réseau Docker « ${TRAEFIK_NETWORK} » est introuvable."
    diagnostics
    exit 1
  fi

  # Compose dédié à Traefik : aucun port publié sur l'hôte, routage par labels
  {
    cat <<EOF
services:
  rikiki:
    build:
      context: ..
      dockerfile: deploy/Dockerfile
    container_name: rikiki
    restart: unless-stopped
    env_file:
      - ../.env
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/rikiki.db
    volumes:
      - ../data:/app/data
    networks:
      - proxy
    labels:
      - traefik.enable=true
      - traefik.docker.network=${TRAEFIK_NETWORK}
      - traefik.http.routers.rikiki.rule=Host(\`${DOMAIN}\`)
      - traefik.http.routers.rikiki.entrypoints=${TRAEFIK_ENTRYPOINT}
      - traefik.http.routers.rikiki.tls=true
EOF
    [ -n "${TRAEFIK_CERTRESOLVER:-}" ] && \
      echo "      - traefik.http.routers.rikiki.tls.certresolver=${TRAEFIK_CERTRESOLVER}"
    cat <<EOF
      - traefik.http.services.rikiki.loadbalancer.server.port=3000

networks:
  proxy:
    external: true
    name: ${TRAEFIK_NETWORK}
EOF
  } > docker-compose.traefik.yml

  docker compose -p rikiki -f docker-compose.traefik.yml up -d --build
  COMPOSE_ARGS="-p rikiki -f docker-compose.traefik.yml"
  HEALTH_CMD='docker exec rikiki node -e "fetch(\"http://127.0.0.1:3000/api/health\").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1'
else
  docker compose up -d --build
  COMPOSE_ARGS=""
  HEALTH_CMD="curl -fsS http://127.0.0.1:${APP_PORT}/api/health >/dev/null 2>&1"
fi

fail_with_logs() {
  echo "❌ $1"
  echo "--- journaux de l'application ---"
  # shellcheck disable=SC2086
  docker compose $COMPOSE_ARGS logs --tail 30 2>/dev/null | tail -30 || true
  diagnostics
  exit 1
}

HEALTHY=0
for _ in $(seq 1 45); do
  if eval "$HEALTH_CMD"; then HEALTHY=1; break; fi
  # Inutile d'attendre si le conteneur s'est arrêté : on affiche l'erreur tout de suite
  if [ "$(docker inspect -f '{{.State.Running}}' rikiki 2>/dev/null)" = "false" ]; then
    fail_with_logs "Le conteneur s'est arrêté au démarrage."
  fi
  sleep 2
done
[ "$HEALTHY" = "1" ] || fail_with_logs "Le serveur ne répond pas."
echo "    ✅ application démarrée et fonctionnelle"

# ---------------------------------------------------------------- 6/6 exposition publique
echo "--- 6/6 Exposition publique"

if [ "$PROXY_MODE" = "traefik" ]; then
  echo "    Traefik route ${DOMAIN} vers le conteneur (certificat émis automatiquement)."
  echo ""
  echo "    Vérification publique dans quelques secondes…"
  sleep 12
  if curl -fsS --max-time 20 "https://${DOMAIN}/api/health" >/dev/null 2>&1; then
    echo ""
    echo "✅ Rikiki est en ligne : https://${DOMAIN}"
  else
    echo ""
    echo "⏳ Le routage est en place mais le site ne répond pas encore en HTTPS."
    echo "   C'est normal si le certificat Let's Encrypt est en cours d'émission (1 à 2 minutes)."
    echo "   Réessayez : curl -I https://${DOMAIN}/api/health"
    echo "   Si le problème persiste, collez ceci à Claude :"
    docker logs "$TRAEFIK_CONTAINER" --tail 20 2>&1 | grep -i -E "rikiki|error|acme" | tail -10 || true
  fi
  exit 0
fi

if [ "$PROXY_MODE" = "container" ]; then
  cat <<EOF

⚠️  Un reverse proxy conteneurisé gère déjà les ports 80/443 de ce serveur :
${PROXY_INFO}

L'application tourne et attend derrière lui, sur 127.0.0.1:${APP_PORT}.
Dernière étape : y ajouter une entrée pour ${DOMAIN}
(WebSockets à autoriser — Socket.IO en a besoin).

Collez le bloc ci-dessous à Claude, il vous donnera la configuration exacte :
EOF
  diagnostics
  exit 0
fi

# nginx (natif, existant ou fraîchement installé)
sed -e "s/rikiki\.mondomaine\.fr/${DOMAIN}/" -e "s/127\.0\.0\.1:3000/127.0.0.1:${APP_PORT}/" \
  "$APP_DIR/deploy/nginx.conf.example" > /etc/nginx/sites-available/rikiki
ln -sf /etc/nginx/sites-available/rikiki /etc/nginx/sites-enabled/rikiki
if ! nginx -t; then
  echo "❌ Configuration nginx invalide — aucun changement appliqué."
  rm -f /etc/nginx/sites-enabled/rikiki
  diagnostics
  exit 1
fi
systemctl reload nginx
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi
echo "    site nginx activé (les autres sites sont intacts)"

if [ -z "$CERTBOT_EMAIL" ]; then
  echo ""
  echo "⚠️  HTTPS non configuré (CERTBOT_EMAIL non fourni)."
  echo "    Lancez : certbot --nginx -d ${DOMAIN} --redirect"
  exit 0
fi

if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect; then
  echo ""
  echo "✅ Rikiki est en ligne : https://${DOMAIN}"
else
  echo ""
  echo "⚠️  Le site répond en HTTP, mais le certificat HTTPS a échoué."
  echo "    Cause la plus fréquente : le DNS de ${DOMAIN} ne pointe pas encore vers ce serveur,"
  echo "    ou le port 443 est bloqué. Réessayez : certbot --nginx -d ${DOMAIN} --redirect"
  diagnostics
fi
