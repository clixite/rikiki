# Déployer Rikiki sur un VPS Hostinger

Guide pas-à-pas pour mettre le jeu en ligne sur un VPS Hostinger (Ubuntu/Debian).
Durée estimée : 20–30 minutes.

## Prérequis

- Un **VPS Hostinger** (n'importe quel plan KVM suffit — le jeu est très léger).
- Un **nom de domaine** (ou sous-domaine) pointant vers l'IP du VPS,
  par ex. `rikiki.mondomaine.fr` → enregistrement DNS `A` vers l'IP du VPS.
- Un accès SSH root au VPS (fourni dans le panneau Hostinger).
- (Optionnel) De quoi envoyer les liens magiques — un compte gratuit Resend ou
  Brevo suffit, voir [Envoi des e-mails](#envoi-des-e-mails-liens-magiques).

## 1. Installer Docker

```bash
ssh root@IP_DU_VPS
curl -fsSL https://get.docker.com | sh
```

## 2. Récupérer le projet et le configurer

```bash
apt-get install -y git
git clone https://github.com/clixite/rikiki.git /opt/rikiki
cd /opt/rikiki
cp .env.example .env
nano .env
```

Dans `.env`, renseignez au minimum :

```
PORT=3000
PUBLIC_URL=https://rikiki.mondomaine.fr
JWT_SECRET=<résultat de : openssl rand -hex 32>
DB_PATH=/app/data/rikiki.db

# Optionnel — comptes e-mail (liens magiques), voir « Envoi des e-mails » :
MAIL_FROM="Rikiki <no-reply@mondomaine.fr>"
BREVO_API_KEY=xkeysib-…
```

> Sans configuration d'envoi, le jeu fonctionne intégralement — seule la
> sauvegarde de profil par e-mail est désactivée.

## 3. Lancer le jeu

```bash
cd /opt/rikiki/deploy
docker compose up -d --build
curl http://127.0.0.1:3000/api/health   # doit répondre {"ok":true}
```

## 4. Mettre nginx + HTTPS devant

```bash
apt-get install -y nginx certbot python3-certbot-nginx
cp /opt/rikiki/deploy/nginx.conf.example /etc/nginx/sites-available/rikiki
nano /etc/nginx/sites-available/rikiki   # remplacer rikiki.mondomaine.fr
ln -s /etc/nginx/sites-available/rikiki /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d rikiki.mondomaine.fr
```

Le HTTPS est indispensable : la PWA (installation sur l'écran d'accueil),
le wake lock et le partage natif l'exigent.

## 5. Vérifier

- Ouvrez `https://rikiki.mondomaine.fr` sur votre téléphone.
- Créez une partie, le code à 4 lettres s'affiche.
- Depuis un second téléphone, ouvrez le lien d'invitation WhatsApp/SMS :
  il doit arriver directement dans la partie.
- Sur Android/iOS : « Ajouter à l'écran d'accueil » installe l'app.

## Envoi des e-mails (liens magiques)

Le bandeau **« L'envoi d'e-mails n'est pas configuré sur ce serveur »** sous
« Sauvegarder ma progression » signifie qu'aucune des variables ci-dessous n'est
renseignée dans `/opt/rikiki/.env`. **Une seule des trois options suffit.**

| Option | Gratuit | Domaine exigé | Port SMTP sortant |
| --- | --- | --- | --- |
| **Resend** (API HTTPS) | 3 000 e-mails/mois | oui (vérification DNS) | non |
| **Brevo** (API HTTPS) | 300 e-mails/jour | non (adresse validée) | non |
| **SMTP** (Gmail, messagerie du domaine…) | selon le fournisseur | non | **oui** |

> Les deux premières options passent par HTTPS. C'est le choix sûr : beaucoup
> d'hébergeurs bloquent les ports 25/465/587 en sortie, auquel cas un réglage
> SMTP pourtant correct reste silencieusement sans effet.

### Option A — Resend (vous avez un domaine)

1. Créez un compte sur [resend.com](https://resend.com) (offre gratuite, sans carte).
2. **Domains → Add Domain** : ajoutez `mondomaine.fr`, puis créez chez votre
   registrar les enregistrements DNS affichés (DKIM + SPF). Vérification en
   quelques minutes.
3. **API Keys → Create API Key** (permission *Sending access*), copiez la clé `re_…`.
4. Dans `/opt/rikiki/.env` :

   ```
   MAIL_FROM="Rikiki <no-reply@mondomaine.fr>"
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

Sans domaine vérifié, Resend n'accepte que l'adresse du titulaire du compte
comme destinataire : utile pour un essai, insuffisant pour de vrais joueurs.

### Option B — Brevo (aucun domaine nécessaire)

1. Créez un compte sur [brevo.com](https://www.brevo.com) (offre gratuite, 300/jour).
2. **Expéditeurs & IP → Expéditeurs → Ajouter** : saisissez l'adresse
   d'expédition — y compris une adresse Gmail — et validez-la depuis l'e-mail
   de confirmation reçu.
3. **SMTP & API → Clés d'API → Générer**, copiez la clé `xkeysib-…`.
4. Dans `/opt/rikiki/.env` :

   ```
   MAIL_FROM="Rikiki <votre.adresse.validee@gmail.com>"
   BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Option C — SMTP classique

Convient à la messagerie d'un domaine, ou à Gmail avec un **mot de passe
d'application** (compte Google → Sécurité → Validation en deux étapes →
Mots de passe des applications) :

```
MAIL_FROM="Rikiki <vous@gmail.com>"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=vous@gmail.com
SMTP_PASS=<mot de passe d'application, 16 lettres, sans espaces>
```

Brevo fournit aussi un relais SMTP (`smtp-relay.brevo.com`, port `587`) si vous
préférez cette voie à son API.

### Appliquer et vérifier

```bash
cd /opt/rikiki/deploy
docker compose up -d            # recharge le .env
docker compose logs --tail=20 rikiki | grep '\[mail\]'
```

Le démarrage annonce le fournisseur retenu, par exemple
`[mail] fournisseur : Brevo (API HTTPS), expéditeur Rikiki <…>`. L'API le
confirme aussi :

```bash
curl -s http://127.0.0.1:3000/api/health
# {"ok":true,"mail":{"enabled":true,"provider":"brevo"}}
```

Envoi de contrôle vers votre propre adresse :

```bash
docker compose exec rikiki node server/dist/index.js --mail-test vous@exemple.fr
```

Le lien contenu dans cet e-mail est factice : seule la réception compte. En cas
de refus, le motif exact du fournisseur (clé invalide, expéditeur non validé,
quota atteint) est imprimé tel quel.

## Mise à jour

```bash
cd /opt/rikiki
git pull
cd deploy && docker compose up -d --build
```

Les parties en cours sont en mémoire : un redéploiement les interrompt.
Préférez les heures creuses.

## Sauvegarde

Le seul état persistant (comptes, stats) est le fichier SQLite `/opt/rikiki/data/rikiki.db` :

```bash
cp /opt/rikiki/data/rikiki.db /root/backup-rikiki-$(date +%F).db
```

## Dépannage

| Symptôme | Piste |
| --- | --- |
| `docker compose` introuvable | Docker < v20 : utilisez `docker-compose` ou réinstallez via get.docker.com |
| 502 Bad Gateway | Le conteneur tourne-t-il ? `docker compose ps`, `docker compose logs -f` |
| Les joueurs se déconnectent en boucle | Vérifiez le bloc `location /socket.io/` (headers Upgrade) dans nginx |
| « L'envoi d'e-mails n'est pas configuré » | Aucune clé dans `.env` : voir [Envoi des e-mails](#envoi-des-e-mails-liens-magiques) |
| E-mail annoncé envoyé mais jamais reçu | Indésirables, puis `docker compose exec rikiki node server/dist/index.js --mail-test vous@exemple.fr` : le motif du fournisseur s'affiche |
| SMTP configuré, aucun envoi, aucune erreur nette | Ports 25/465/587 probablement bloqués par l'hébergeur : passez à Resend ou Brevo (HTTPS) |
| JWT invalide après redéploiement | `JWT_SECRET` doit rester identique entre déploiements |
