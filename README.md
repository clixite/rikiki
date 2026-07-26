# Rikiki 🃏

Jeu de Rikiki (Oh Hell) multijoueur en ligne : chacun joue depuis son téléphone.
PWA mobile-first + serveur Node.js/Socket.IO autoritaire (anti-triche).

## Fonctionnalités

- **Compte en 5 secondes** : pseudo + avatar, sans mot de passe (et sauvegarde
  optionnelle par e-mail via lien magique).
- **Rejoindre en un code** : chaque partie a un code à 4 lettres (ex. `KWPZ`),
  saisie rapide ou lien direct `https://…/j/KWPZ`.
- **Inviter ses amis** : boutons WhatsApp, SMS et partage natif directement
  depuis le salon d'attente.
- **Règles classiques avec crochet** : manches 1 → 10 → 1, atout retourné,
  le dernier annonceur ne peut pas égaliser le total, score 10 + 2×plis ou
  −2 par pli d'écart. 3 à 8 joueurs.
- **Robuste au quotidien mobile** : reconnexion automatique, reprise après
  refresh, période de grâce de 90 s puis jeu automatique pour les absents.
- **PWA installable** : icône sur l'écran d'accueil, plein écran, écran
  maintenu allumé pendant la partie.

## Structure

| Dossier | Rôle |
| --- | --- |
| `shared/` | Types + logique de jeu pure (règles, moteur), testée unitairement |
| `server/` | Express + Socket.IO, auth JWT, rooms, SQLite (comptes/stats) |
| `client/` | React + Vite + Tailwind, PWA |
| `deploy/` | Dockerfile, docker-compose, nginx, guide Hostinger |

## Développement

```bash
npm install
npm test                 # logique de jeu + intégration socket + magic link
npm run dev:server       # serveur sur :3000
npm run dev:client       # client Vite sur :5173 (proxy vers :3000)
```

Ouvrez http://localhost:5173 dans plusieurs onglets/navigateurs pour simuler
plusieurs joueurs. Test E2E complet (3 navigateurs jouent une partie entière) :

```bash
npm run build -w client
PORT=3111 DB_PATH=:memory: npx tsx server/src/index.ts &
BASE_URL=http://localhost:3111 SHOTS_DIR=/tmp/shots FULL_GAME=1 node scripts/e2e.mjs
```

## Production

```bash
npm run build            # client (Vite) puis serveur (esbuild → server/dist)
npm start                # sert l'API, les WebSockets et le client buildé
```

Déploiement complet sur VPS Hostinger : voir **[deploy/DEPLOY.md](deploy/DEPLOY.md)**.

## Variables d'environnement

Voir `.env.example` : `PORT`, `PUBLIC_URL`, `JWT_SECRET`, `DB_PATH`,
et `SMTP_*` (optionnel, pour les liens magiques).
