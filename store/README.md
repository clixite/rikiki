# Publication sur l'App Store — le dossier

Ce fichier explique **les choix** : pourquoi tel prix, telle catégorie, telle
réponse aux questionnaires, et ce qui a été corrigé pour être publiable.

**La marche à suivre, geste par geste, est dans [`PUBLIER.md`](PUBLIER.md).**

---

## 1. Ce qui bloquait la publication — corrigé

| Règle Apple | Constat initial | Correction |
|---|---|---|
| **5.1.1(v)** — toute app permettant de créer un compte doit permettre de le supprimer *depuis l'app* | Aucune suppression de compte : refus quasi certain | **Profil → Supprimer mon compte**, confirmation en deux temps, effacement immédiat du compte, de l'historique, des statistiques, des groupes et des abonnements aux notifications (`DELETE /api/me`) |
| **5.1.1(i)** — politique de confidentialité obligatoire, avec URL accessible | Aucune politique | `/privacy.html` — bilingue FR/EN, conforme RGPD, avec responsable du traitement, bases légales, durées de conservation, droits et procédure de suppression |
| **5.1.1(v)** — l'app ne doit pas exiger de compte pour ses fonctions principales | ✅ déjà conforme | Un pseudo suffit ; l'e-mail reste facultatif |
| **2.1** — l'app doit être testable par le relecteur | À fournir | Voir « Notes pour la relecture » plus bas : compte invité en un tap, plus des joueurs automatiques pour jouer seul |

Un bug d'affichage a également été corrigé au passage : l'identifiant d'avatar
(`a3`) s'affichait en texte brut au lieu de l'image, sur l'accueil, l'écran de
victoire, les groupes et l'historique.

---

## 2. Ce qui ne peut pas se faire depuis ce dépôt

**La publication exige un binaire natif signé, donc un Mac avec Xcode.** Une PWA
ne se dépose pas telle quelle sur l'App Store. Le dossier `ios/` contient la
configuration Capacitor ; `PUBLIER.md` déroule les étapes.

Tout le reste — textes des 18 langues, icône, écrans de lancement, captures —
est produit et vérifié ici, sur n'importe quelle machine :

```bash
npm run store:assets     # icône, écrans de lancement, captures localisées
npm run store:check      # contrôle mécanique du dossier
```

---

## 3. Risque de rejet à connaître : règle 4.2 (fonctionnalité minimale)

> « Your app should include features, content, and UI that elevate it beyond a
> repackaged website. »

Un simple conteneur autour d'un site se fait refuser. Ce qui joue en votre
faveur, et qu'il faut **écrire noir sur blanc dans les notes de relecture** :

- c'est un vrai jeu multijoueur temps réel, pas un site vitrine ;
- interface plein écran, sans aucun élément de navigateur ;
- retours haptiques natifs, son, maintien de l'écran allumé ;
- fonctionne hors connexion pour tout ce qui ne demande pas d'adversaire
  (règles, historique, profil, groupes en cache) ;
- les fichiers du jeu sont embarqués dans le binaire, pas chargés depuis un
  site : l'app s'ouvre sans réseau (voir `ios/README.md`) ;
- le mode asynchrone donne à l'application une raison d'exister sur le
  téléphone : une partie s'y mène sur plusieurs jours, l'accueil liste celles
  qui attendent après vous — c'est un usage d'application, pas de page web.

N'invoquez pas les notifications dans les notes de relecture pour la première
version : elles ne fonctionnent pas encore dans le conteneur natif (voir la
dernière section).

Si vous voulez réduire encore le risque, la mesure la plus efficace est
d'ajouter un plugin natif visible : `@capacitor/haptics` est déjà prévu dans la
configuration, et Game Center (classements) serait un ajout franchement natif.

---

## 4. Fiche App Store Connect

### Langues

Apple accepte **18** des 24 langues de l'application. Ne sont **pas** prises en
charge par l'App Store : bulgare, estonien, irlandais, letton, lituanien,
maltais. L'application reste traduite dans ces langues, seule la fiche du store
ne peut pas les afficher.

Un dossier par code de langue App Store Connect dans `metadata/` :

```
fr-FR  en-US  de-DE  es-ES  it     nl-NL  pt-PT  pl     sv
da     fi     cs     sk     sl     hr     hu     ro     el
```

Chaque dossier contient, aux longueurs maximales d'Apple (vérifiées) :

| Fichier | Champ App Store Connect | Limite |
|---|---|---|
| `name.txt` | Nom de l'app | 30 |
| `subtitle.txt` | Sous-titre | 30 |
| `promotional_text.txt` | Texte promotionnel (modifiable sans nouvelle version) | 170 |
| `keywords.txt` | Mots-clés | 100 |
| `description.txt` | Description | 4000 |
| `release_notes.txt` | Nouveautés de cette version | 4000 |

Le contenu livré dans `release_notes.txt` décrit la **première** version : App
Store Connect n'affiche pas ce champ pour une app jamais publiée, mais il le
réclame dès la mise à jour suivante — autant qu'il soit juste dès maintenant.
| `support_url.txt` | URL d'assistance — page dédiée avec contact et FAQ, pas l'app | — |
| `marketing_url.txt` | URL marketing | — |
| `privacy_url.txt` | URL de politique de confidentialité | — |

### Visuels

Tous produits par `npm run store:assets`, depuis l'application réelle.

| Fichier | Format | Usage |
|---|---|---|
| `assets/icon-1024.png` | 1024×1024, PNG **sans canal alpha**, sans coins arrondis | l'icône de la fiche |
| `ios/assets/icon-only.png` | le **même fichier**, à l'octet près | source du jeu d'icônes du binaire (`npx cap assets generate`) |
| `ios/assets/splash.png` · `splash-dark.png` | 2732×2732 | écran de lancement, toutes déclinaisons dérivées |
| `assets/screenshots/<langue>/1..6-*.jpg` | 1320×2868, JPEG | 6 captures par langue |

Les six captures : accueil · salon avec le code d'invitation · réglages de la
partie · annonce du contrat, main visible · pli en cours · tableau des scores.

Elles sont prises en jouant une **vraie partie** jusqu'à une manche fournie :
aucune image de synthèse, aucun écran maquillé. Une capture qui ne correspond
pas à l'app est un motif de rejet, et c'est une vérification que le relecteur
fait systématiquement — donc **à régénérer après toute retouche d'interface**.

Apple n'exige plus qu'une taille par famille d'appareils : l'iPhone 6,9", dont
il dérive tous les écrans plus petits. L'iPad 13" (2064×2752) n'est requis que
si l'application est livrée pour iPad — ce que la v1 ne fait pas
(`TARGETED_DEVICE_FAMILY = 1`). Si vous changez d'avis :
`DEVICE=ipad npm run store:assets`.

Pour téléverser sans y passer l'après-midi, la structure de `metadata/` est
exactement celle qu'attend [`fastlane deliver`](https://docs.fastlane.tools/actions/deliver/) :

```bash
fastlane deliver --metadata_path store/metadata --screenshots_path store/assets/screenshots
```

### Champs à renseigner à la main

| Champ | Valeur |
|---|---|
| Catégorie principale | Jeux → Cartes |
| Catégorie secondaire | Jeux → Famille |
| Droits d'auteur | `2026 Clixite SRL` |
| Nom du vendeur (affiché sur la fiche) | `Clixite SRL` |
| **Prix** | **1,99 € — achat unique** (App Store Connect → Tarifs et disponibilité) |
| Achats intégrés | **Aucun** — le prix est payé une fois, à l'installation |
| Abonnement | Aucun |
| Publicité | Non — cocher « ne contient pas de publicité » |

### Conséquence d'une app payante : contrat et coordonnées bancaires

**C'est le point qui bloque le plus souvent une première publication payante.**
Une app gratuite se soumet sans rien signer ; une app payante exige que le
contrat « Paid Applications » soit **actif** avant même que le prix puisse être
choisi. Dans App Store Connect → **Entreprise** (Business) :

1. accepter le contrat **Paid Applications** — au nom de **Clixite SRL**, pas
   d'une personne physique : le compte développeur doit être de type
   *Organization*, avec le numéro d'entreprise belge comme identifiant légal ;
2. renseigner les **coordonnées bancaires** (IBAN au nom de la société) ;
3. remplir les **formulaires fiscaux** — pour Clixite SRL c'est le
   **W-8BEN-E** (formulaire des entités, pas le W-8BEN des particuliers), sans
   lequel Apple retient 30 % des revenus américains. Prévoyez le numéro
   d'entreprise BE 0871.430.776 et, si demandé, le GIIN ou le statut de
   « Active NFFE » ;
4. attendre que les trois lignes passent au vert. Cela prend souvent 24 à 48 h.

Tant que ce contrat n'est pas actif, le champ « Prix » reste inaccessible et la
soumission ne part pas.

### Ce qu'un prix de vente change — et ce qu'il ne change pas

- **Rien à coder.** Apple encaisse ; l'application ne voit ni paiement, ni carte,
  ni reçu. Aucun StoreKit, aucun écran d'achat, aucun bouton « Restaurer »
  (celui-ci n'est obligatoire que pour les achats intégrés et les abonnements).
- **Le relecteur n'achète rien** : Apple lui fournit l'app. Aucun code
  promotionnel à prévoir.
- **La confidentialité reste inchangée** : aucune donnée bancaire ne transite par
  l'app, la politique publiée reste exacte.
- **Ne jamais écrire le prix dans la description.** Apple le refuse : le prix
  s'affiche déjà sur la fiche et changerait à chaque évolution tarifaire. Les
  descriptions livrées disent « achat unique, sans abonnement », ce qui est
  autorisé et constitue le meilleur argument de vente face aux jeux de cartes
  bourrés de publicité.
- **Codes promotionnels** : 100 par version, à distribuer depuis App Store
  Connect. De quoi faire tester le jeu à vos amis sans qu'ils paient.

### Le site reste gratuit — est-ce un problème ?

Non. Apple n'impose aucune parité de prix avec votre site, et n'interdit que de
**renvoyer depuis l'app** vers un moyen de paiement extérieur — ce que
l'application ne fait pas. En revanche, c'est une vraie question commerciale :
`rikiki.clixite-prod.cloud` offre gratuitement le même jeu. Trois options, à
trancher quand vous voudrez :

1. laisser le site tel quel — l'app payante vend le confort natif (icône,
   plein écran, hors-ligne, notifications à venir) ;
2. réserver au site le rôle de vitrine et d'invitation (rejoindre une partie
   depuis un lien), le jeu complet restant sur l'app ;
3. aligner le site sur un paiement Stripe équivalent.

---

## 5. Classification par âge

Répondre **Aucun / Non** à toutes les questions. Points d'attention :

| Question | Réponse | Pourquoi |
|---|---|---|
| Jeux d'argent et de hasard simulés | **Non** | Aucune mise, aucune monnaie virtuelle, aucun gain — un jeu de plis n'est pas un jeu de casino |
| Concours | Non | |
| Contenu généré par les utilisateurs | **Oui — rare/léger** | Un joueur peut mettre une photo de profil, visible des seuls joueurs de sa partie ou de ses groupes. Ni chat, ni fil public, ni texte libre au-delà du pseudo. Les contrôles exigés par la règle 1.2 sont en place : signalement (drapeau dans le tableau des scores), masquage immédiat sur l'appareil, retrait du joueur par l'hôte, et contact publié sur la page d'assistance |
| Accès web illimité | Non | |
| Violence, contenu sexuel, langage grossier | Non | |

Résultat attendu : **4+**.

Répondre « Oui » à « jeux d'argent simulés » ferait basculer la note à 17+ sans
raison — c'est l'erreur classique sur un jeu de cartes.

---

## 6. Confidentialité de l'app (« nutrition labels »)

À déclarer dans App Store Connect → Confidentialité de l'app :

| Donnée | Collectée | Liée à l'identité | Suivi publicitaire | Finalité |
|---|---|---|---|---|
| Adresse e-mail (facultative) | Oui | Oui | **Non** | Fonctionnalité de l'app |
| Identifiant utilisateur (compte) | Oui | Oui | **Non** | Fonctionnalité de l'app |
| Contenu de jeu (historique, scores) | Oui | Oui | **Non** | Fonctionnalité de l'app |
| Nom d'utilisateur (pseudo) | Oui | Oui | **Non** | Fonctionnalité de l'app |
| Photos (photo de profil, facultative) | Oui | Oui | **Non** | Fonctionnalité de l'app |
| Diagnostics, publicité, localisation, contacts, achats | **Non** | — | — | — |

Répondre **Non** à « Utilisez-vous les données pour le suivi ? ». Aucun SDK
publicitaire, aucun outil d'analyse tiers n'est embarqué — c'est vérifiable
dans le dépôt.

---

## 7. Conformité à l'exportation (chiffrement)

L'app utilise HTTPS et rien d'autre en matière de chiffrement.

- « Votre app utilise-t-elle du chiffrement ? » → **Oui**
- « Est-il limité à des algorithmes standards pour l'authentification et
  HTTPS ? » → **Oui** → exemption applicable, aucun document à fournir.

Ajouter dans `Info.plist` (déjà prévu dans la configuration Capacitor) :

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

---

## 8. Notes pour la relecture (à copier dans App Store Connect)

> Rikiki est un jeu de plis multijoueur en temps réel (variante « Oh Hell »).
>
> Aucun compte n'est nécessaire pour tester : à l'ouverture, saisissez un pseudo,
> choisissez un avatar, et vous entrez directement dans le jeu.
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
> des scores (icône coupe) propose un drapeau de signalement sur tout joueur
> ayant une photo — le contenu est masqué immédiatement sur l'appareil et le
> signalement est enregistré. L'hôte peut par ailleurs retirer n'importe quel
> joueur de la table.
>
> Les fichiers du jeu sont embarqués dans le binaire : l'application s'ouvre
> sans réseau, et les règles, le profil et l'historique restent consultables
> hors connexion. Seules les parties en cours nécessitent une connexion.
>
> L'application est vendue à l'unité : elle ne contient ni publicité, ni achat
> intégré, ni abonnement, ni monnaie virtuelle, ni mise d'argent. Les données
> sont hébergées dans l'Union européenne.
> Politique de confidentialité : https://rikiki.clixite-prod.cloud/privacy.html

Aucun compte de démonstration n'est requis : cochez « Connexion non requise ».

---

## 9. Vérification automatique du dossier

```bash
npm run store:check
```

Contrôle mécaniquement ce qu'Apple refuse sans discussion : langue manquante,
texte trop long, mention de prix dans un texte (interdite), mot-clé gaspillant
des caractères en espaces, URL non https, icône transparente ou mal
dimensionnée, icône de la fiche différente de celle du binaire, sources iOS
absentes, capture à la mauvaise taille ou porteuse d'un canal alpha, nombre de
captures inégal d'une langue à l'autre. À relancer après chaque retouche.

Pour vérifier en plus que les URL publiées répondent — le relecteur les
ouvrira :

```bash
CHECK_URLS=1 npm run store:check
```

---

## 10. Avant d'appuyer sur « Soumettre » — vérifications

- [ ] **Contrat « Paid Applications » actif**, coordonnées bancaires et formulaires fiscaux validés — sans cela le prix ne peut pas être fixé
- [ ] Compte développeur de type **Organization**, au nom de Clixite SRL
- [ ] Prix réglé sur **1,99 €**, disponibilité étendue aux pays visés
- [ ] `npm run store:check` passe, y compris `CHECK_URLS=1`
- [ ] Le serveur de production répond : `https://rikiki.clixite-prod.cloud/api/health` → `{"ok":true}`
- [ ] La page d'assistance est en ligne : `/support.html` → 200
- [ ] La politique de confidentialité est en ligne : `/privacy.html` → 200
- [ ] La suppression de compte fonctionne sur la production, pas seulement en local
- [ ] Le signalement d'un joueur masque bien sa photo et répond 200 (`POST /api/report`)
- [ ] La version déployée correspond au binaire soumis (la date de build est affichée en bas de l'accueil)
- [ ] L'icône du binaire n'est pas celle de Capacitor (`npm run assets` dans `ios/` a bien été lancé)
- [ ] Les captures montrent la version soumise, pas la précédente
- [ ] Xcode : destination **iPhone seulement**, orientation **portrait**, `ITSAppUsesNonExemptEncryption` dans `Info.plist`
- [ ] Le nom de l'app n'est pas déjà pris — à vérifier dans App Store Connect, c'est le premier point de blocage possible

---

## 11. Limite connue, à traiter avant ou après la première version

**Notifications « c'est ton tour ».** Elles reposent aujourd'hui sur le Web Push
(VAPID), qui fonctionne dans Safari mais **pas** dans une application native
Capacitor : il faut passer par APNs. Deux options :

1. soumettre la v1 sans notifications sur iOS (rien à déclarer, l'app se comporte
   simplement sans) ;
2. ajouter `@capacitor/push-notifications` et une clé APNs, puis publier une
   v1.1.

L'option 1 est la plus sûre pour une première soumission : demander
l'autorisation de notifications sans jamais en envoyer est, elle, un motif de
rejet.
