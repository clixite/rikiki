import type { GameFormat, GamePace, PhraseId, ScoringVariant } from '@rikiki/shared';

/**
 * Les petites phrases envoyables à la table.
 *
 * Typées sur `PhraseId` : ajouter une phrase au protocole partagé casse
 * la compilation des vingt-quatre langues tant qu'elle n'est pas traduite.
 */
const FR_PHRASES: Record<PhraseId, string> = {
  nice: 'Bien joué !',
  oops: 'Aïe…',
  yourTurn: 'À toi !',
  hurry: 'On t’attend 🙂',
  watchTrump: 'Attention à l’atout',
  mine: 'Celui-là est pour moi',
  sorry: 'Désolé !',
  brb: 'Je reviens tout de suite',
  goodGame: 'Belle partie !',
  again: 'On en refait une ?',
};

export const fr = {
  appName: 'Rikiki',
  tagline: 'Le jeu de plis entre amis, chacun sur son téléphone',

  // Accueil
  createGame: 'Créer une partie',
  joinGame: 'Rejoindre une partie',
  resumeGame: 'Reprendre la partie',
  myGames: 'Mes parties',

  // Profil
  yourPseudo: 'Ton pseudo',
  pickAvatar: 'Choisis ton avatar',
  letsGo: 'C’est parti !',
  save: 'Enregistrer',
  editProfile: 'Mon profil',
  changeAvatar: 'Changer d’avatar',

  // Rejoindre
  enterCode: 'Code de la partie',
  join: 'Rejoindre',
  gameCode: 'Code de la partie',
  copyLink: 'Copier le lien',
  copied: 'Lien copié !',

  // Salon
  invite: 'Inviter des amis',
  players: 'Joueurs',
  host: 'Hôte',
  you: 'toi',
  waitingForHost: 'En attente du lancement par l’hôte…',
  waitingForHostNamed: (p: string) => `${p} lance la partie quand tout le monde est là`,
  needPlayers: (missing: number) =>
    missing === 1 ? 'Encore 1 joueur pour commencer' : `Encore ${missing} joueurs pour commencer`,
  startGame: 'Lancer la partie',
  leave: 'Quitter',
  kick: 'Retirer',
  addBot: 'Ajouter un robot',
  addBotHint: 'Complète la partie avec un joueur automatique',
  botsFull: 'La table est complète',
  removeBot: 'Retirer le robot',

  // Réglages de la partie (feuille du salon)
  gameSettings: 'Réglages de la partie',
  gameSettingsHint: 'L’hôte choisit avant de lancer',
  gameSettingsLocked: 'Réglages choisis par l’hôte',
  settingsDone: 'Terminé',

  // Format de partie (durée)
  gameFormat: 'Format de la partie',
  gameFormatHint: 'Choisis la durée avant de lancer',
  formatNames: {
    blitz: 'Éclair',
    normal: 'Normale',
    climb: 'Montante',
  } as Record<GameFormat, string>,
  formatDescriptions: {
    blitz: 'Montée et descente jusqu’à 5 cartes',
    normal: 'Montée puis descente complètes',
    climb: 'Montée seule, sans redescente',
  } as Record<GameFormat, string>,
  formatRounds: (n: number) => (n > 1 ? `${n} manches` : '1 manche'),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Format choisi par l’hôte',

  // Barème de score
  scoringVariant: 'Barème de score',
  scoringHint: 'Comment on compte les points',
  scoringNames: {
    classic: 'Classique',
    gentle: 'Bienveillant',
    always: 'Plis toujours comptés',
  } as Record<ScoringVariant, string>,
  scoringDescriptions: {
    classic: 'Contrat tenu : 10 + 2 par pli. Raté : −2 par pli d’écart.',
    gentle: 'Contrat tenu : 10 + 1 par pli. Raté : 0, aucune pénalité.',
    always: 'Tes plis comptent toujours, +10 si le contrat est tenu.',
  } as Record<ScoringVariant, string>,
  scoringLocked: 'Barème choisi par l’hôte',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Rythme',
  gamePaceHint: 'Ensemble, ou chacun quand il peut',
  paceNames: {
    live: 'Temps réel',
    async: 'Au rythme de chacun',
  } as Record<GamePace, string>,
  paceDescriptions: {
    live: 'Tout le monde joue en même temps ; un tour qui s’éternise se joue tout seul.',
    async: 'Chacun joue quand il peut, sur plusieurs jours. Personne ne joue à ta place.',
  } as Record<GamePace, string>,
  paceLocked: 'Rythme choisi par l’hôte',
  waitingForPlayer: (pseudo: string) => `En attente de ${pseudo}`,
  waitingToStart: 'En attente du lancement',

  // Table de jeu
  round: 'Manche',
  cards: (n: number) => (n > 1 ? `${n} cartes` : '1 carte'),
  trump: 'Atout',
  noTrump: 'Sans atout',
  dealer: 'Donneur',
  offline: 'hors ligne',
  thinking: '…',
  yourBid: 'Combien de plis ?',
  bidsTotal: (sum: number, cards: number) => `Annoncé : ${sum} / ${cards} plis`,
  hookForbidden: (n: number) => `Interdit : le total ferait exactement ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} est interdit : le total des annonces ne peut pas égaler ${cards} (règle du crochet).`,
  bid: 'Annonce',
  tricks: 'Plis',
  lastTrick: 'Dernier pli',
  spreadHand: 'Étaler mes cartes',
  collapseHand: 'Regrouper mes cartes',

  // Récapitulatif des annonces de la manche
  bidsAnnounced: 'Annoncé',
  bidsPending: (announced: number, cards: number) =>
    `${announced} sur ${cards} — annonces en cours`,
  bidsBalanced: (cards: number) => `Total juste : ${cards} plis annoncés`,
  bidsOver: (n: number) => (n > 1 ? `${n} plis de trop : ça va tomber` : '1 pli de trop : ça va tomber'),
  bidsUnder: (n: number) => (n > 1 ? `${n} plis en rab à ramasser` : '1 pli en rab à ramasser'),
  noBidYet: 'Pas encore annoncé',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} plis`,
  yourTurn: 'À toi de jouer',
  turnOf: (p: string) => `Au tour de ${p}`,
  trickWonBy: (p: string) => `${p} remporte le pli`,
  scoreboard: 'Scores',
  total: 'Total',

  // Récap
  roundRecap: 'Fin de la manche',
  contractKept: 'Contrat tenu',
  contractMissed: 'Contrat manqué',
  contract: 'Contrat',
  points: 'Points',
  nextRound: 'Manche suivante',
  seeResults: 'Voir les résultats',
  waitingNextRound: 'L’hôte va lancer la manche suivante…',

  // Fin de partie
  gameOver: 'Partie terminée',
  shareResult: 'Partager le résultat',
  shareTitle: 'Partie de Rikiki terminée 🃏',
  shareSaved: 'Image enregistrée',
  playAgain: 'Rejouer',
  backHome: 'Accueil',

  // Son
  soundOn: 'Activer le son',
  soundOff: 'Couper le son',

  // Réseau
  reconnecting: 'Reconnexion…',
  playerDisconnected: (p: string) => `${p} est déconnecté·e`,
  playerReconnected: (p: string) => `${p} est de retour`,
  playerPaused: (p: string) => `${p} fait une pause`,
  playerResumed: (p: string) => `${p} reprend la partie`,
  playerJoined: (p: string) => `${p} a rejoint la partie`,
  playerLeft: (p: string) => `${p} a quitté la partie`,
  roomClosed: 'La partie a été fermée.',
  roomClosedKicked: 'Tu as été retiré·e de la partie.',
  roomClosedExpired: 'La partie a expiré.',

  // Invitations
  inviteMessage: (code: string, url: string) =>
    `Viens jouer au Rikiki avec nous ! 🃏\nCode de la partie : ${code}\nRejoins ici : ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Partager',

  // Compte
  saveAccount: 'Sauvegarder ma progression',
  saveAccountHint: 'Reçois un lien par e-mail — pas de mot de passe à retenir',
  emailPlaceholder: 'ton@email.fr',
  sendMagicLink: 'Recevoir mon lien',
  magicLinkSent: 'E-mail envoyé ! Ouvre le lien pour confirmer.',
  accountSaved: 'Progression sauvegardée',
  verifying: 'Vérification…',
  verified: 'Compte confirmé ! Ta progression est sauvegardée.',
  verifyFailed: 'Lien invalide ou expiré. Redemande un lien depuis ton profil.',

  // Confidentialité et suppression du compte
  privacyPolicy: 'Confidentialité',
  deleteAccount: 'Supprimer mon compte',
  deleteAccountHint: 'Efface ton profil, ton historique et tes groupes.',
  deleteAccountWarning:
    'Ton pseudo, tes parties, tes statistiques et tes groupes seront effacés. Cette action est définitive.',
  deleteAccountAction: 'Oui, tout supprimer',
  deleteAccountDone: 'Compte supprimé.',
  cancel: 'Annuler',
  botTag: 'robot',
  emotes: 'Réactions',
  phrases: 'Messages',
  phraseTexts: FR_PHRASES,
  pauseGame: 'Faire une pause',
  resumePlay: 'Je reprends',
  pausedTag: 'en pause',
  pauseHint: 'Un robot tient ta place le temps de ta pause.',
  close: 'Fermer',
  leaveGame: 'Quitter la partie',
  leaveGameWarning:
    'La partie continue sans toi et tes points de cette partie sont perdus.',
  leaveGameAction: 'Oui, quitter',
  takePhoto: 'Prendre une photo',
  removePhoto: 'Retirer la photo',
  photoError: 'Photo trop lourde ou illisible.',
  reportPlayer: 'Signaler',
  reportDone: 'Photo masquée et signalée.',

  // Statistiques et historique
  stats: 'Statistiques',
  gamesPlayed: 'parties',
  gamesWon: 'victoires',
  bestRound: 'meilleure manche',
  contractsKept: 'Contrats tenus',
  noHistory: 'Aucune partie terminée pour l’instant.',
  historyTitle: 'Mes dernières parties',
  wonBadge: 'Gagné',
  lostBadge: 'Perdu',
  playersCount: (n: number) => `${n} joueurs`,

  // Groupes d'amis
  groups: 'Mes groupes',
  groupsTitle: 'Mes groupes',
  groupsSubtitle: 'Un classement cumulé avec ceux qui jouent toujours ensemble',
  noGroups: 'Tu ne fais partie d’aucun groupe pour l’instant.',
  createGroup: 'Créer un groupe',
  createGroupCta: 'Créer le groupe',
  groupNamePlaceholder: 'Les copains du mardi',
  groupNameLabel: 'Nom du groupe',
  groupNameTooShort: 'Le nom doit faire entre 2 et 30 caractères.',
  joinGroup: 'Rejoindre un groupe',
  joinGroupCta: 'Rejoindre',
  groupCodeLabel: 'Code du groupe',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 lettres, sans I, L ni O',
  groupCode: 'Code du groupe',
  groupShareHint: 'Partage ce code pour que tes amis rejoignent le groupe',
  copyGroupCode: 'Copier le code',
  groupCodeCopied: 'Code copié !',
  groupMembers: (n: number) => (n > 1 ? `${n} membres` : '1 membre'),
  groupGames: (n: number) => (n > 1 ? `${n} parties` : n === 1 ? '1 partie' : 'aucune partie'),
  groupRanking: 'Classement cumulé',
  groupRecentGames: 'Dernières parties du groupe',
  groupNoGames: 'Aucune partie jouée en groupe pour l’instant.',
  groupNoGamesHint: 'Lance une partie avec ce groupe : les résultats arriveront ici.',
  groupPlay: 'Jouer avec ce groupe',
  groupOwner: 'Créateur',
  groupLeave: 'Quitter le groupe',
  groupLeaveConfirm: 'Quitter ce groupe ? Tes parties passées restent au classement.',
  groupDelete: 'Supprimer le groupe',
  groupDeleteConfirm: 'Supprimer ce groupe et tout son classement ? C’est définitif.',
  groupOwnerCannotLeave: 'Tu as créé ce groupe : tu peux seulement le supprimer.',
  groupNotFound: 'Groupe introuvable.',
  groupJoined: (name: string) => `Tu as rejoint « ${name} » !`,
  groupCreated: (name: string) => `Groupe « ${name} » créé !`,
  groupAttached: (name: string) => `Partie rattachée à « ${name} »`,
  groupTotalPoints: 'points',
  groupRankHeader: '#',
  groupPlayerHeader: 'Joueur',
  groupPointsHeader: 'Pts',
  groupPlayedHeader: 'J',
  groupWonHeader: 'V',

  // Règles du jeu
  rules: 'Règles du jeu',
  rulesTitle: 'Comment jouer',
  demoTitle: 'La partie en une minute',
  demoPlay: 'Lancer la démonstration',
  demoPause: 'Mettre en pause',
  demoReplay: 'Revoir depuis le début',
  demoPrev: 'Étape précédente',
  demoNext: 'Étape suivante',
  demoDeal: 'Chacun reçoit ses cartes. La dernière retournée fixe l’atout : sa couleur bat toutes les autres.',
  demoBid: 'Chacun annonce combien de plis il compte remporter. Le donneur annonce en dernier, et ne peut pas faire tomber le total juste.',
  demoFollow: 'On rejoue la couleur demandée si on en a. Sinon seulement, on met ce qu’on veut.',
  demoTrump: 'Un atout, même le plus petit, remporte le pli sur la couleur demandée.',
  demoScore: 'Contrat tenu : 10 points plus 2 par pli. Manqué : 2 points en moins par pli d’écart.',
  rulesSubtitle: 'Le Rikiki en 2 minutes',
  rulesGoalTitle: 'Le principe',
  rulesGoalText:
    'Avant chaque manche, vous annoncez combien de plis vous pensez remporter. Tout l’enjeu est de tomber juste : ni plus, ni moins. Faire beaucoup de plis ne sert à rien si vous en aviez annoncé peu.',
  rulesDealTitle: 'La donne',
  rulesDealText:
    'La partie se joue en plusieurs manches. La première ne distribue qu’une carte par joueur, puis deux, puis trois… avant de redescendre. À chaque manche, tout le monde reçoit le même nombre de cartes.',
  rulesTrumpText: 'Une carte est retournée : sa couleur est l’atout de la manche.',
  rulesBidTitle: 'L’annonce',
  rulesBidText:
    'Chacun son tour, vous annoncez le nombre de plis visé — de 0 au nombre de cartes en main. Vous voyez votre jeu et l’atout pour décider.',
  rulesHookTitle: 'La règle du crochet',
  rulesHookText:
    'Le dernier à annoncer (le donneur) ne peut pas choisir le chiffre qui ferait correspondre exactement le total des annonces au nombre de plis de la manche. Résultat : quelqu’un sera forcément déçu. Le chiffre interdit est barré automatiquement.',
  rulesPlayTitle: 'Le jeu des plis',
  rulesPlayText:
    'Le joueur à gauche du donneur entame. Chacun pose une carte, et la plus forte remporte le pli. Le gagnant entame le pli suivant.',
  rulesFollowSuit: 'Vous devez fournir la couleur demandée si vous en avez une.',
  rulesNoSuit: 'Sinon, vous jouez ce que vous voulez : couper à l’atout ou vous défausser.',
  rulesWinTrick: 'Le plus haut atout l’emporte ; sans atout, la plus haute carte de la couleur demandée.',
  rulesScoreTitle: 'Les points',
  rulesScoreOk: 'Contrat réussi',
  rulesScoreOkFormula: '10 + 2 × plis',
  rulesScoreKoFormula: '−2 × écart',
  pseudoPlaceholder: 'Marie, Karim, Léa…',
  rulesScoreOkExample: 'Annoncé 3, réalisé 3 → 16 points',
  rulesScoreKo: 'Contrat manqué',
  rulesScoreKoExample: 'Annoncé 3, réalisé 1 → −4 points',
  rulesScoreZero: 'Annoncer 0 et n’en faire aucun rapporte 10 points : un contrat très rentable.',
  rulesScoreVariants: 'L’hôte peut choisir un autre barème dans le salon :',
  rulesEndTitle: 'Fin de partie',
  rulesEndText:
    'Une fois toutes les manches jouées, le joueur qui totalise le plus de points l’emporte. Le tableau des scores est consultable à tout moment pendant la partie.',
  rulesTip:
    'Astuce : sur les petites manches, un as ou un atout élevé suffit souvent à assurer un pli. Sur les grandes, méfiez-vous des couleurs longues.',
  rulesGotIt: 'J’ai compris',

  // Notifications « c'est ton tour »
  notificationsTitle: 'Me prévenir quand c’est mon tour',
  notificationsHint:
    'Range ton téléphone : on t’envoie une notification dès que la table t’attend. Idéal pour les parties étalées sur la journée.',
  notificationsEnable: 'Activer les notifications',
  notificationsOn: 'Notifications activées',
  notificationsOff: 'Notifications désactivées',
  notificationsChecking: 'Vérification…',
  notificationsUnsupported: 'Ton navigateur ne gère pas les notifications.',
  notificationsNeedsInstall:
    'Sur iPhone et iPad, ajoute d’abord Rikiki à ton écran d’accueil (Partager → « Sur l’écran d’accueil »), puis reviens ici.',
  notificationsDenied:
    'Les notifications sont bloquées pour ce site. Réactive-les dans les réglages de ton navigateur.',
  notificationsNoServiceWorker: 'Notifications indisponibles ici (installe l’application ou recharge la page).',
  notificationsServerOff: 'Les notifications ne sont pas configurées sur le serveur.',
  notificationsError: 'Impossible de modifier les notifications.',

  updateAvailable: 'Nouvelle version',
  updateReload: 'Mettre à jour',
  version: (v: string) => `version ${v}`,

  // Accessibilité
  accessibility: 'Accessibilité',
  colorblindMode: 'Couleurs distinctes',
  colorblindHint: 'Une teinte par enseigne, pour distinguer ♥ ♦ ♠ ♣ sans dépendre du rouge',
  leftHandedMode: 'Commandes à gauche',
  leftHandedHint: 'Déplace les boutons de la table du bord droit vers le bord gauche.',
  colorblindHintBanner: 'Daltonien ? Essaie les couleurs distinctes dans ton profil.',
  suitNames: { S: 'pique', H: 'cœur', D: 'carreau', C: 'trèfle' } as Record<string, string>,
  rankNames: { 11: 'valet', 12: 'dame', 13: 'roi', 14: 'as' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} de ${suit}`,
  handOf: (n: number) => (n > 1 ? `Ta main : ${n} cartes` : 'Ta main : 1 carte'),

  language: 'Langue',
  languageHint: 'Choisis la langue de l’application',

  loading: 'Chargement…',
  errorTitle: 'Oups',
  copyright: '© 2026 Clixite SRL',
};

export default fr;
