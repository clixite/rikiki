#!/usr/bin/env bash
# Installation complète de Rikiki sur un VPS Ubuntu/Debian (Hostinger).
# Usage (en root, depuis le terminal du VPS) :
#   CERTBOT_EMAIL=vous@email.fr DOMAIN=rikiki.mondomaine.fr bash install.sh
# Ré-exécutable sans risque : met à jour le code et relance les services.
set -euo pipefail

DOMAIN="${DOMAIN:-rikiki.clixite-prod.cloud}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:?Définissez CERTBOT_EMAIL=votre@email (pour le certificat HTTPS)}"
REPO_URL="${REPO_URL:-https://github.com/clixite/rikiki-public.git}"
BRANCH="${BRANCH:-main}"
APP_PORT="${APP_PORT:-3000}"
export APP_PORT
APP_DIR=/opt/rikiki

diagnostics() {
  echo ""
  echo "=== Diagnostic à copier-coller à Claude ==="
  ss -ltnp 2>/dev/null | grep -E '(^State|:80 |:443 |:'"${APP_PORT}"' )' || true
  docker ps --format '{{.Names}}  {{.Ports}}' 2>/dev/null || true
  echo "==========================================="
}

echo "=== Rikiki : installation sur ${DOMAIN} ==="
export DEBIAN_FRONTEND=noninteractive

echo "--- 0/6 Vérifications (VPS partagé avec d'autres services)"
if ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE '(^|:)'"${APP_PORT}"'$'; then
  echo "❌ Le port ${APP_PORT} est déjà utilisé par un autre service."
  echo "   Relancez la même commande en ajoutant APP_PORT=3210 devant (ou collez le diagnostic à Claude)."
  diagnostics
  exit 1
fi
if ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE '(^|:)80$' && ! command -v nginx >/dev/null 2>&1; then
  echo "❌ Un serveur web autre que nginx écoute déjà sur le port 80 (Apache ? Traefik ? Caddy ?)."
  echo "   Collez le diagnostic ci-dessous à Claude : il adaptera la configuration."
  diagnostics
  exit 1
fi

echo "--- 1/6 Docker"
command -v docker >/dev/null 2>&1 || curl -fsSL https://get.docker.com | sh

echo "--- 2/6 Paquets (git, nginx, certbot)"
apt-get update -y -qq
apt-get install -y -qq git nginx certbot python3-certbot-nginx openssl

echo "--- 3/6 Code"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

echo "--- 4/6 Configuration (.env)"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<EOF
PORT=3000
PUBLIC_URL=https://${DOMAIN}
JWT_SECRET=$(openssl rand -hex 32)
DB_PATH=/app/data/rikiki.db
EOF
  echo "    .env créé (SMTP non configuré : les liens magiques par e-mail sont désactivés — voir deploy/DEPLOY.md pour l'activer)"
else
  echo "    .env existant conservé"
fi

echo "--- 5/6 Build et lancement du conteneur"
cd "$APP_DIR/deploy"
docker compose up -d --build
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then break; fi
  sleep 2
done
curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null || { echo "❌ Le serveur ne répond pas — voir : docker compose logs"; diagnostics; exit 1; }
echo "    serveur OK sur le port ${APP_PORT}"

echo "--- 6/6 nginx + HTTPS"
# On ajoute uniquement notre site (server_name dédié) — les sites existants sont préservés
sed -e "s/rikiki\.mondomaine\.fr/${DOMAIN}/" -e "s/127\.0\.0\.1:3000/127.0.0.1:${APP_PORT}/" \
  "$APP_DIR/deploy/nginx.conf.example" > /etc/nginx/sites-available/rikiki
ln -sf /etc/nginx/sites-available/rikiki /etc/nginx/sites-enabled/rikiki
nginx -t && systemctl reload nginx
command -v ufw >/dev/null 2>&1 && ufw allow 80/tcp >/dev/null 2>&1 && ufw allow 443/tcp >/dev/null 2>&1 || true

if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect; then
  echo ""
  echo "✅ Rikiki est en ligne : https://${DOMAIN}"
else
  echo ""
  echo "⚠️  Le site répond en HTTP mais le certificat HTTPS a échoué."
  echo "    Cause probable : le DNS de ${DOMAIN} ne pointe pas (encore) vers ce serveur."
  echo "    Vérifiez l'enregistrement A puis relancez : certbot --nginx -d ${DOMAIN} --redirect"
fi
