# Déployer Rikiki sur un VPS Hostinger

Guide pas-à-pas pour mettre le jeu en ligne sur un VPS Hostinger (Ubuntu/Debian).
Durée estimée : 20–30 minutes.

## Prérequis

- Un **VPS Hostinger** (n'importe quel plan KVM suffit — le jeu est très léger).
- Un **nom de domaine** (ou sous-domaine) pointant vers l'IP du VPS,
  par ex. `rikiki.mondomaine.fr` → enregistrement DNS `A` vers l'IP du VPS.
- Un accès SSH root au VPS (fourni dans le panneau Hostinger).
- (Optionnel) Un compte e-mail Hostinger pour l'envoi des liens magiques
  (`smtp.hostinger.com`, port 465).

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

# Optionnel — comptes e-mail (liens magiques) via la messagerie Hostinger :
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=no-reply@mondomaine.fr
SMTP_PASS=<mot de passe de la boîte mail>
SMTP_FROM="Rikiki <no-reply@mondomaine.fr>"
```

> Sans configuration SMTP, le jeu fonctionne intégralement — seule la
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

## Mise à jour

```bash
cd /opt/rikiki
git pull
cd deploy && docker compose up -d --build
```

Les parties en cours sont en mémoire : un redéploiement les interrompt.
Préférez les heures creuses.

`install.sh` (utilisé aussi bien à l'installation qu'aux mises à jour) tague
l'image en service avant de reconstruire. Si le nouveau conteneur ne répond
pas correctement à `/api/health` dans les 90 secondes, il est automatiquement
annulé : l'ancienne image est restaurée et relancée, et le script se termine
en indiquant clairement que l'ancienne version tourne de nouveau. Au tout
premier déploiement, il n'existe encore aucune version précédente : le script
l'indique et s'arrête, sans tenter de repli.

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
| Pas d'e-mails reçus | Testez les identifiants SMTP dans le webmail Hostinger ; vérifiez `docker compose logs` |
| JWT invalide après redéploiement | `JWT_SECRET` doit rester identique entre déploiements |
