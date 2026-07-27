#!/usr/bin/env bash
# Sauvegarde de la base Rikiki (comptes, statistiques, historiques, groupes).
#
# Installation d'une sauvegarde quotidienne à 4h du matin :
#   (crontab -l 2>/dev/null; echo "0 4 * * * /opt/rikiki/deploy/backup.sh") | crontab -
#
# Variables : DB_PATH (défaut /opt/rikiki/data/rikiki.db)
#             BACKUP_DIR (défaut /opt/rikiki/backups)
#             KEEP_DAYS (défaut 14)
set -euo pipefail

DB_PATH="${DB_PATH:-/opt/rikiki/data/rikiki.db}"
BACKUP_DIR="${BACKUP_DIR:-/opt/rikiki/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

if [ ! -f "$DB_PATH" ]; then
  echo "❌ Base introuvable : $DB_PATH" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
TARGET="${BACKUP_DIR}/rikiki-${STAMP}.db"

# `sqlite3 .backup` produit une copie cohérente même pendant les écritures
# (contrairement à un simple cp, qui peut capturer un fichier à moitié écrit).
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '${TARGET}'"
elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx rikiki; then
  # Pas de sqlite3 sur l'hôte : on passe par le conteneur, qui embarque Node
  docker exec rikiki node -e "
    const Database = require('better-sqlite3');
    const db = new Database(process.env.DB_PATH ?? '/app/data/rikiki.db', { readonly: true });
    db.backup('/app/data/.backup-tmp.db').then(() => { db.close(); process.exit(0); })
      .catch((e) => { console.error(e); process.exit(1); });
  "
  mv "$(dirname "$DB_PATH")/.backup-tmp.db" "$TARGET"
else
  echo "⚠️  sqlite3 absent : copie simple (moins sûre pendant une écriture)" >&2
  cp "$DB_PATH" "$TARGET"
fi

gzip -f "$TARGET"
echo "✅ Sauvegarde : ${TARGET}.gz ($(du -h "${TARGET}.gz" | cut -f1))"

# Rotation : on ne garde que les KEEP_DAYS derniers jours
find "$BACKUP_DIR" -name 'rikiki-*.db.gz' -type f -mtime "+${KEEP_DAYS}" -delete
echo "   ${KEEP_DAYS} jours conservés, $(find "$BACKUP_DIR" -name 'rikiki-*.db.gz' | wc -l) fichier(s) en stock"
