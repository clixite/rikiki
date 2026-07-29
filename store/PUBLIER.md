# Publier Rikiki sur l'App Store — la marche à suivre

Procédure complète, dans l'ordre, du compte développeur à l'app en ligne.
Comptez **deux demi-journées** réparties sur environ une semaine : l'essentiel
du délai vient d'Apple (contrats, puis relecture).

Le détail des choix (pourquoi tel prix, telle catégorie, telle réponse au
questionnaire) est dans [`README.md`](README.md). Ce fichier-ci ne contient que
les gestes à faire.

---

## Avant de commencer

| Il vous faut | Vérification |
|---|---|
| Un **Mac** avec **Xcode 16** ou plus | `xcodebuild -version` |
| **Node 20+** | `node -v` |
| Un compte **Apple Developer Program** actif, de type **Organization** | [developer.apple.com/account](https://developer.apple.com/account) — le nom affiché doit être *Clixite SRL*, pas votre nom |
| L'**IBAN** de Clixite SRL et le numéro d'entreprise **BE 0871.430.776** | pour les contrats |
| Le serveur de jeu en ligne | `curl https://rikiki.clixite-prod.cloud/api/health` → `{"ok":true}` |

> **Un compte de type *Individual* ne convient pas.** L'app doit être vendue par
> Clixite SRL : le nom du vendeur s'affiche sur la fiche et sur la facture
> Apple, et le formulaire fiscal à remplir n'est pas le même. Si le compte est
> encore personnel, la conversion se demande au support Apple et prend
> plusieurs jours — à lancer **en premier**.

---

## Étape 1 — Les contrats (à lancer tout de suite, c'est le plus long)

Une app **payante** ne peut pas être soumise tant que le contrat *Paid
Applications* n'est pas actif. C'est le blocage le plus fréquent d'une première
publication : le champ « Prix » reste tout simplement grisé.

Dans [App Store Connect](https://appstoreconnect.apple.com) → **Entreprise** :

1. **Contrats** → accepter *Paid Applications*, au nom de **Clixite SRL**.
2. **Coordonnées bancaires** → IBAN au nom de la société.
3. **Informations fiscales** → pour une société belge, c'est le **W-8BEN-E**
   (le formulaire des *entités*). Le W-8BEN, celui des particuliers, ferait
   retenir 30 % des revenus américains.
   - Chapter 3 status : *Corporation*
   - Chapter 4 (FATCA) status : **Active NFFE** dans la quasi-totalité des cas
   - Numéro d'identification : BE 0871.430.776
   - Traité fiscal : cocher la Belgique, article sur les redevances → 0 %
4. Attendre que les trois lignes passent au **vert**. Comptez 24 à 48 h.

Pendant l'attente, tout le reste peut avancer.

---

## Étape 2 — Réserver le nom de l'app

App Store Connect → **Mes apps** → **+** → **Nouvelle app**.

| Champ | Valeur |
|---|---|
| Plateformes | iOS |
| Nom | **exactement** le contenu de `store/metadata/fr-FR/name.txt`, soit `Rikiki – Jeu de cartes` |
| Langue principale | Français |
| Bundle ID | `be.clixite.rikiki` — à créer d'abord dans *Certificates, Identifiers & Profiles* → *Identifiers* → **+** → *App IDs* → *App* |
| SKU | `rikiki-ios-1` (usage interne, jamais affiché) |
| Accès utilisateur | Accès complet |

> Le nom réservé ici **est** celui qui s'affichera : il doit correspondre au
> `name.txt` de la langue principale, sans quoi la soumission est refusée pour
> incohérence. S'il est déjà pris, App Store Connect le dit à cette étape —
> mieux vaut le découvrir maintenant qu'après avoir tout préparé. Choisissez
> alors une variante de 30 caractères maximum et **reportez-la dans
> `store/metadata/fr-FR/name.txt`** avant de relancer `npm run store:check`.

---

## Étape 3 — Fabriquer les visuels

Depuis ce dépôt, sur n'importe quelle machine (Linux compris) :

```bash
npm ci
npm run build
PORT=3111 DB_PATH=/tmp/store.db JWT_SECRET=peu-importe BOT_DELAY_MS=60 \
  npx tsx server/src/index.ts &
npm run store:assets      # icône, écrans de lancement, 108 captures localisées
npm run store:check       # 600+ contrôles mécaniques
```

Cela produit :

| Fichier | Usage |
|---|---|
| `store/assets/icon-1024.png` | l'icône de la fiche App Store |
| `ios/assets/icon-only.png` | **la même image**, source du jeu d'icônes du binaire |
| `ios/assets/splash.png` et `splash-dark.png` | l'écran de lancement, 2732×2732 |
| `store/assets/screenshots/<langue>/1..6-*.jpg` | 6 captures par langue, 1320×2868 |

Les captures sont prises **dans l'application réelle**, en jouant une vraie
partie : aucune image de synthèse. Une capture qui ne correspond pas à l'app
est un motif de rejet, et c'est une vérification que le relecteur fait
systématiquement.

---

## Étape 4 — Générer le projet Xcode (sur le Mac)

```bash
git clone <le dépôt> && cd rikiki
npm ci

cd ios
npm install
npm run build:web        # compile le client avec l'adresse absolue du serveur
npx cap add ios          # une seule fois : génère ios/App/
npx cap sync ios
```

### Icône et écran de lancement

```bash
npx @capacitor/assets generate --ios \
  --assetPath assets \
  --iosProject App
```

La commande décline `assets/icon-only.png` et `assets/splash*.png` en toutes
les tailles attendues par Xcode. Sans elle, l'app est publiée avec **l'icône
par défaut de Capacitor** — rejet immédiat.

Vérifiez ensuite dans Xcode que `App/Assets.xcassets/AppIcon.appiconset`
contient bien l'emplacement 1024×1024 rempli.

---

## Étape 5 — Régler le projet dans Xcode

```bash
npx cap open ios
```

Cible **App** → onglet **General** / **Signing** :

| Réglage | Valeur | Pourquoi |
|---|---|---|
| Display Name | `Rikiki` | |
| Bundle Identifier | `be.clixite.rikiki` | doit correspondre exactement à l'App ID |
| Version | `1.3.0` | le numéro public, celui de `package.json` |
| Build | `1` | à incrémenter à **chaque** envoi, même pour corriger une virgule |
| Team | *Clixite SRL* | |
| Signing | *Automatically manage signing* | |
| **Supported Destinations** | **iPhone seulement** — retirer iPad | voir l'encadré |
| Device Orientation | **Portrait** uniquement | l'interface est conçue pour le portrait |
| Minimum Deployments | iOS 14.0 | valeur posée par Capacitor 6 |

> **Pourquoi retirer l'iPad.** Dès que l'app est livrée pour iPad, App Store
> Connect **exige** un jeu complet de captures 13" (2064×2752) et le relecteur
> juge la mise en page sur grand écran. La v1 vise le téléphone. Si vous
> voulez l'iPad plus tard : remettez la destination, puis
> `DEVICE=ipad npm run store:assets` produit les captures correspondantes dans
> `store/assets/screenshots/ipad-<langue>/`.

### Info.plist

Ouvrir `App/App/Info.plist` (**Open As → Source Code**) et ajouter dans le
`<dict>` racine :

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

L'app n'utilise que HTTPS : cela relève de l'exemption standard, et cette clé
évite le questionnaire de conformité à l'exportation à chaque envoi.

---

## Étape 6 — Essayer avant d'archiver

Sur simulateur (**iPhone 16 Pro Max**) puis, si possible, sur un vrai iPhone :

- [ ] créer un profil, créer une partie, ajouter deux joueurs automatiques,
      **jouer la partie jusqu'au bout**
- [ ] ouvrir **Réglages de la partie** : les trois choix répondent
- [ ] **Profil → Supprimer mon compte** : la session se vide, l'accueil
      redemande un pseudo
- [ ] **aucun élément de navigateur visible** — barre d'adresse, flèches de
      navigation : leur présence déclenche la règle 4.2
- [ ] **mode avion** : l'app s'ouvre, les règles et le profil s'affichent sans
      planter
- [ ] rotation de l'appareil : l'app reste en portrait

---

## Étape 7 — Archiver et téléverser

Dans Xcode :

1. barre du haut : cible **Any iOS Device (arm64)** — surtout pas un simulateur
2. **Product → Archive** (5 à 10 minutes)
3. dans l'Organizer qui s'ouvre : **Distribute App** → **App Store Connect** →
   **Upload**
4. laisser cochés *Upload your app's symbols* et *Manage Version and Build
   Number*
5. **Next → Upload**

Le build apparaît dans App Store Connect au bout de 10 à 30 minutes, avec la
mention *En cours de traitement*. Attendez qu'elle disparaisse.

> **Un courriel « ITMS-90… » ?** C'est un refus automatique, avant même la
> relecture. Les plus courants : icône manquante ou transparente (revoir
> l'étape 4), clé `ITSAppUsesNonExemptEncryption` absente (étape 5), numéro de
> build déjà utilisé (l'incrémenter et réarchiver).

---

## Étape 8 — Remplir la fiche

App Store Connect → votre app → la version **1.3.0**.

### Les textes, langue par langue

Pour chacune des **18 langues** du dossier `store/metadata/` : cliquer sur le
sélecteur de langue en haut à droite, **Ajouter une langue**, puis recopier
chaque fichier dans le champ correspondant.

| Fichier | Champ App Store Connect |
|---|---|
| `name.txt` | Nom |
| `subtitle.txt` | Sous-titre |
| `promotional_text.txt` | Texte promotionnel |
| `description.txt` | Description |
| `keywords.txt` | Mots-clés |
| `release_notes.txt` | Nouveautés de cette version — **absent pour une première publication**, App Store Connect ne l'affiche qu'à partir de la deuxième version |
| `support_url.txt` | URL d'assistance |
| `marketing_url.txt` | URL marketing |
| `privacy_url.txt` | URL de politique de confidentialité |

> **Gain de temps considérable :** ces champs s'automatisent avec
> [Fastlane](https://docs.fastlane.tools/actions/deliver/). La structure de
> `store/metadata/` est **exactement** celle qu'attend `fastlane deliver` —
> `fastlane deliver --metadata_path store/metadata` téléverse les 18 langues
> et les captures en une commande. À la main, comptez une bonne heure.

### Les captures

Glisser les 6 fichiers de `store/assets/screenshots/<langue>/` dans
**iPhone 6,9"**, dans l'ordre numérique. Les autres tailles d'iPhone sont
dérivées automatiquement par Apple : il n'y a rien d'autre à fournir.

### Le reste de la fiche

| Champ | Valeur |
|---|---|
| Catégorie principale | Jeux → Cartes |
| Catégorie secondaire | Jeux → Famille |
| Droits d'auteur | `2026 Clixite SRL` |
| Version | `1.3.0` |
| Publication | *Publier automatiquement après approbation* |

---

## Étape 9 — Les trois questionnaires

### Classification par âge → **4+**

Répondre **Aucun / Non** partout. Deux pièges :

- **« Jeux d'argent et de hasard simulés » → NON.** Un jeu de plis n'est pas un
  jeu de casino : aucune mise, aucune monnaie virtuelle, aucun gain. Répondre
  oui ferait basculer la note à 17+ sans raison.
- **« Contenu généré par les utilisateurs » → OUI, rare/léger.** Un joueur peut
  mettre une photo de profil. Les contrôles exigés par la règle 1.2 sont en
  place (signalement, masquage, exclusion par l'hôte, contact d'assistance).

### Confidentialité de l'app

**Non** à « Utilisez-vous les données pour le suivi ? ». Puis :

| Donnée | Collectée | Liée à l'identité | Suivi | Finalité |
|---|---|---|---|---|
| Adresse e-mail (facultative) | Oui | Oui | Non | Fonctionnalité de l'app |
| Identifiant utilisateur | Oui | Oui | Non | Fonctionnalité de l'app |
| Nom d'utilisateur (pseudo) | Oui | Oui | Non | Fonctionnalité de l'app |
| Photos (photo de profil, facultative) | Oui | Oui | Non | Fonctionnalité de l'app |
| Contenu de jeu (historique, scores) | Oui | Oui | Non | Fonctionnalité de l'app |
| Diagnostics, publicité, localisation, contacts, achats | **Non** | — | — | — |

### Conformité à l'exportation

Chiffrement → **Oui** ; limité aux algorithmes standards (HTTPS,
authentification) → **Oui** → exemption, aucun document à fournir.

---

## Étape 10 — Le prix

**Tarifs et disponibilité** → **1,99 €**, palier européen correspondant.

Si le champ est grisé, le contrat de l'étape 1 n'est pas encore actif.

Disponibilité : tous les pays, ou au minimum l'Union européenne, la Suisse, le
Royaume-Uni et le Canada — les marchés francophones et néerlandophones où le
jeu a un nom.

---

## Étape 11 — Notes pour la relecture

**Connexion requise : non.** Puis coller ce texte :

> Rikiki est un jeu de plis multijoueur en temps réel (variante « Oh Hell »).
>
> Aucun compte n'est nécessaire pour tester : à l'ouverture, saisissez un
> pseudo, choisissez un avatar, et vous entrez directement dans le jeu.
>
> Pour jouer seul : « Créer une partie », puis « Ajouter un joueur automatique »
> deux fois — la partie démarre à trois joueurs et se joue de bout en bout.
>
> Pour tester à plusieurs : le code à 4 lettres affiché dans le salon peut être
> saisi depuis un autre appareil via « Rejoindre une partie ».
>
> Suppression de compte : Profil (en haut à gauche de l'accueil) → « Supprimer
> mon compte ». La suppression est immédiate et efface toutes les données
> associées.
>
> Contenu généré : un joueur peut choisir une photo de profil, visible
> uniquement des joueurs invités dans sa partie ou de ses groupes d'amis. Il
> n'existe ni messagerie, ni fil public, ni texte libre en dehors du pseudo.
> Les contrôles prévus par la règle 1.2 sont accessibles en jeu : le tableau
> des scores (icône coupe) propose un signalement sur tout joueur ayant une
> photo — le contenu est masqué immédiatement sur l'appareil et le signalement
> est enregistré. L'hôte peut par ailleurs retirer n'importe quel joueur.
>
> Les fichiers du jeu sont embarqués dans le binaire : l'application s'ouvre
> sans réseau, et les règles, le profil et l'historique restent consultables
> hors connexion. Seules les parties en cours nécessitent une connexion.
>
> L'application est vendue à l'unité : ni publicité, ni achat intégré, ni
> abonnement, ni monnaie virtuelle, ni mise d'argent. Les données sont
> hébergées dans l'Union européenne.
> Politique de confidentialité : https://rikiki.clixite-prod.cloud/privacy.html

---

## Étape 12 — Soumettre

Dernière vérification avant d'appuyer :

- [ ] les trois lignes de contrat sont vertes
- [ ] le prix est réglé sur 1,99 €
- [ ] le build 1.3.0 (1) est sélectionné et n'est plus « en cours de traitement »
- [ ] les 18 langues sont remplies, avec leurs 6 captures
- [ ] `https://rikiki.clixite-prod.cloud/privacy.html` et `/support.html`
      répondent 200 — le relecteur les ouvre
- [ ] la version déployée sur le serveur correspond au binaire soumis (la date
      de build s'affiche en bas de l'accueil)

**Ajouter pour la relecture** → **Envoyer pour vérification**.

Comptez 24 à 48 h. En cas de refus, Apple laisse un message dans *Résolution
Center* : on y répond directement, sans avoir à réarchiver, sauf si le refus
porte sur le binaire.

---

## Après la première publication

À chaque mise à jour :

```bash
cd ios
npm run sync             # recompile le web et met à jour le projet natif
npx cap open ios
```

Puis : incrémenter **Build**, ajuster **Version** si le numéro public change,
**Product → Archive**, **Distribute**. Côté App Store Connect, créer une
nouvelle version, coller les nouveaux `release_notes.txt`, soumettre.

Si l'interface a changé, **régénérez les captures** (étape 3) : une fiche qui
montre une version antérieure du jeu est un motif de rejet.

---

## Ce qui n'est pas dans cette version

**Les notifications « c'est ton tour » ne fonctionnent pas dans l'app iOS.**
Elles reposent sur le Web Push (VAPID), que Safari accepte mais qu'une
application Capacitor ne peut pas utiliser : iOS impose APNs. L'app se comporte
simplement sans, et il n'y a rien à déclarer.

Ne les mentionnez **pas** dans les notes de relecture, et surtout ne demandez
pas l'autorisation de notifier sans jamais notifier : c'est, cela, un motif de
rejet. Pour les activer plus tard : `@capacitor/push-notifications`, une clé
APNs, et l'envoi serveur à réécrire.
