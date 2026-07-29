# Application iOS — conteneur natif

L'App Store n'accepte pas une PWA telle quelle : il lui faut un binaire signé.
Ce dossier contient la configuration Capacitor qui emballe le client web dans
une application native.

**Ces étapes exigent un Mac avec Xcode.** Rien ici ne peut être fait depuis
Linux : la compilation, la signature et l'envoi passent obligatoirement par les
outils Apple.

> La marche à suivre complète, du compte développeur à la mise en ligne, est
> dans **[`../store/PUBLIER.md`](../store/PUBLIER.md)**. Le présent fichier ne
> couvre que le conteneur natif.

---

## Principe retenu

Les fichiers du jeu sont **embarqués dans l'application**, pas chargés depuis le
web. L'app démarre donc instantanément et sans réseau ; seuls les appels au
serveur de jeu (API et temps réel) sortent, vers `https://rikiki.clixite-prod.cloud`.

C'est ce qui distingue une vraie application d'un simple conteneur autour d'un
site — la distinction que fait la règle 4.2 de l'App Store.

Deux conséquences techniques, déjà traitées dans le code :

- `VITE_API_BASE` injecte l'adresse absolue du serveur à la compilation
  (`client/src/config.ts`) ; sans cette variable, le client continue d'utiliser
  des chemins relatifs, ce qui reste le bon comportement sur le web ;
- le serveur autorise l'origine `capacitor://localhost` sur `/api`
  (`server/src/app.ts`). Sans cet en-tête, la WebView bloquerait chaque appel.

---

## Première mise en place

```bash
cd ios
npm install
npm run build:web        # compile le client avec l'adresse absolue du serveur
npx cap add ios          # génère une seule fois le projet Xcode
npx cap sync ios
npm run assets           # icône et écran de lancement, depuis ios/assets/
npx cap open ios
```

`npm run assets` décline `assets/icon-only.png` et `assets/splash*.png` en
toutes les tailles attendues par Xcode. **Sans cette commande, l'application
est publiée avec l'icône par défaut de Capacitor** — refus automatique.

Les sources de `assets/` sont produites par `npm run store:assets` à la racine
du dépôt : l'icône du binaire et celle de la fiche App Store sont ainsi le même
fichier, ce que vérifie `npm run store:check`.

### Dans Xcode

1. **Signing & Capabilities** → sélectionner votre équipe de développeur.
2. **General** → *Display Name* : `Rikiki` · *Bundle Identifier* :
   `be.clixite.rikiki` · *Version* : `1.3.0` (celle de `package.json`) ·
   *Build* : `1`, à incrémenter à chaque envoi.
3. **Deployment Info** → *iPhone* uniquement, *Portrait* uniquement.
   L'interface est pensée pour le portrait ; déclarer l'iPad obligerait à
   fournir des captures 13" et à soigner une mise en page qui n'a pas été
   conçue pour.
4. Icône : rien à glisser à la main, `npm run assets` s'en est chargé.
   Vérifier tout de même que `App/Assets.xcassets/AppIcon.appiconset` porte
   bien l'emplacement 1024×1024.
5. Ajouter dans `App/Info.plist` :

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

Cela évite le questionnaire de conformité à l'exportation à chaque envoi :
l'app n'utilise que HTTPS, ce qui relève de l'exemption standard.

---

## À chaque mise à jour du jeu

```bash
cd ios
npm run sync             # recompile le web et met à jour le projet natif
npx cap open ios
```

Puis dans Xcode : incrémenter *Build*, **Product → Archive**,
**Distribute App → App Store Connect**.

---

## Vérifications avant d'archiver

- [ ] `npm run build:web` a bien été relancé — sinon vous archivez l'ancienne version du jeu
- [ ] Sur simulateur : création de profil, création de partie, ajout de deux
      joueurs automatiques, partie jouée jusqu'au bout
- [ ] Suppression de compte (Profil → Supprimer mon compte) : la session est
      vidée et l'accueil redemande un pseudo
- [ ] Aucun élément de navigateur visible (barre d'adresse, boutons de
      navigation) — sinon la règle 4.2 s'applique immédiatement
- [ ] Mode avion : l'application s'ouvre et affiche les règles et le profil
      sans planter

---

## Notifications

Le Web Push (VAPID) utilisé sur le web **ne fonctionne pas** dans une
application Capacitor : iOS exige APNs. Pour la première version, laissez les
notifications de côté — demander une autorisation sans jamais envoyer de
notification est un motif de rejet. Pour les activer ensuite :
`@capacitor/push-notifications`, une clé APNs dans le compte développeur, et
l'envoi côté serveur à réécrire pour APNs.
