# Rikiki 🃏

**Le jeu de plis entre amis, chacun sur son téléphone.**
Créez une partie, partagez un code à 4 lettres, et jouez — sans installation,
sans inscription.

🎮 **[rikiki.clixite-prod.cloud](https://rikiki.clixite-prod.cloud)**

Application web progressive (installable sur iOS et Android) adossée à un
serveur Node.js/Socket.IO qui arbitre la partie : la logique de jeu vit
entièrement côté serveur, aucun joueur ne voit la main d'un autre.

## Fonctionnalités

- **Compte en 5 secondes** — pseudo et avatar, sans mot de passe ; sauvegarde
  facultative par lien magique pour retrouver sa progression sur tout appareil.
- **Rejoindre en un code** — chaque partie a un code à 4 lettres (`KWPZ`), ou
  un lien direct `…/j/KWPZ` qui ouvre le jeu sur la bonne table.
- **Inviter en un geste** — WhatsApp, SMS et partage natif depuis le salon.
- **Joueurs automatiques** — pas assez de monde ? Ajoutez un robot : il évalue
  sa main pour annoncer, puis joue selon son contrat.
- **Règles classiques avec crochet** — manches 1 → 10 → 1, atout retourné, le
  dernier annonceur ne peut pas égaliser le nombre de plis ; contrat réussi
  10 + 2 × plis, sinon −2 par pli d'écart. De 3 à 8 joueurs.
- **Trois barèmes de score** — classique, bienveillant (jamais de points
  négatifs) ou « plis toujours comptés » : chaque famille retrouve le sien.
- **Deux rythmes** — en temps réel, un tour trop long se joue tout seul pour ne
  pas bloquer la table ; en asynchrone, chacun joue quand il peut sur plusieurs
  jours, personne n'est jamais joué à sa place, et l'accueil liste les parties
  en cours en mettant devant celle qui vous attend.
- **Pensé pour le mobile** — main toujours visible, y compris pendant les
  annonces ; reconnexion automatique ; écran maintenu allumé ; sons coupables
  d'un geste ; animations respectant `prefers-reduced-motion`.
- **Historique et statistiques** — parties passées, classements, mis en cache
  sur l'appareil pour un affichage instantané.

## Structure

| Dossier | Rôle |
| --- | --- |
| `shared/` | Types et logique de jeu pure (règles, moteur, stratégie des robots) |
| `server/` | Express + Socket.IO, authentification JWT, salons, SQLite |
| `client/` | React + Vite + Tailwind, PWA |
| `deploy/` | Dockerfile, compose, nginx, installation automatisée |
| `scripts/` | Tests de bout en bout et d'ergonomie (Playwright) |

## Développement

```bash
npm install
npm test                 # 190 tests : règles, moteur, robots, sockets, comptes, géométrie
npm run dev:server       # serveur sur :3000
npm run dev:client       # client Vite sur :5173 (proxy vers :3000)
```

Ouvrez http://localhost:5173 dans plusieurs navigateurs pour simuler
plusieurs joueurs.

**Tests de bout en bout** — trois navigateurs jouent une partie complète :

```bash
npm run build -w client
PORT=3111 DB_PATH=:memory: npx tsx server/src/index.ts &
BASE_URL=http://localhost:3111 SHOTS_DIR=/tmp/shots FULL_GAME=1 node scripts/e2e.mjs
```

**Tests d'ergonomie** — 214 vérifications d'interface sur trois formats de
téléphone (visibilité de la main pendant l'annonce, cibles tactiles, absence
de chevauchement et de débordement, persistance du son, manifest PWA) :

```bash
BASE_URL=http://localhost:3111 node scripts/ux-tests.mjs
```

**Audit du tapis** — la géométrie de la table (sièges, pli, main) est fixée par
un test unitaire exhaustif (`client/test/tableLayout.test.ts`) qui balaie toutes
les tailles d'écran plausibles. Pour vérifier que le rendu s'y conforme
réellement, un script monte une vraie partie et mesure le DOM — utile après
toute retouche du tapis, trop lent pour l'intégration continue :

```bash
OPP=7 MIN_CARDS=6 SHOTS_DIR=/tmp/shots node scripts/table-audit.mjs
```

## Production

```bash
npm run build            # client (Vite) puis serveur (esbuild → server/dist)
npm start                # sert l'API, les WebSockets et le client compilé
```

Installation complète sur un VPS : **[deploy/DEPLOY.md](deploy/DEPLOY.md)**.
Le script `deploy/install.sh` détecte le reverse proxy déjà en place (nginx,
Traefik…) et s'y adapte sans toucher aux services existants.

## Variables d'environnement

Voir `.env.example` : `PORT`, `PUBLIC_URL`, `JWT_SECRET`, `DB_PATH`,
`BOT_DELAY_MS`, et `SMTP_*` (facultatif, pour les liens magiques).

---

© 2026 **Clixite SRL** — Avenue Reine Astrid 53, 1300 Wavre, Belgique — BE 0871.430.776.
Tous droits réservés. Voir [LICENSE](LICENSE).

Le Rikiki (Oh Hell) est un jeu traditionnel du domaine public ; seule cette
implémentation est protégée.
