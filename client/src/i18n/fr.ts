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
  letsGo: "C'est parti !",
  save: 'Enregistrer',
  editProfile: 'Mon profil',
  changeAvatar: "Changer d'avatar",

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
  waitingForHost: "En attente du lancement par l'hôte…",
  needPlayers: (missing: number) =>
    missing === 1 ? 'Encore 1 joueur pour commencer' : `Encore ${missing} joueurs pour commencer`,
  startGame: 'Lancer la partie',
  leave: 'Quitter',
  kick: 'Retirer',
  addBot: 'Ajouter un robot',
  addBotHint: 'Complète la partie avec un joueur automatique',
  botsFull: 'La table est complète',
  removeBot: 'Retirer le robot',

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
  noBidYet: 'Pas encore annoncé',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} plis`,
  yourTurn: 'À toi de jouer',
  turnOf: (p: string) => `Au tour de ${p}`,
  trickWonBy: (p: string) => `${p} remporte le pli`,
  scoreboard: 'Scores',
  total: 'Total',

  // Récap
  roundRecap: 'Fin de la manche',
  contract: 'Contrat',
  points: 'Points',
  nextRound: 'Manche suivante',
  seeResults: 'Voir les résultats',
  waitingNextRound: "L'hôte va lancer la manche suivante…",

  // Fin de partie
  gameOver: 'Partie terminée',
  playAgain: 'Rejouer',
  backHome: 'Accueil',

  // Son
  soundOn: 'Activer le son',
  soundOff: 'Couper le son',

  // Réseau
  reconnecting: 'Reconnexion…',
  playerDisconnected: (p: string) => `${p} est déconnecté·e`,
  playerReconnected: (p: string) => `${p} est de retour`,
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

  // Statistiques et historique
  stats: 'Statistiques',
  gamesPlayed: 'parties',
  gamesWon: 'victoires',
  bestRound: 'meilleure manche',
  noHistory: "Aucune partie terminée pour l'instant.",
  historyTitle: 'Mes dernières parties',
  wonBadge: 'Gagné',
  lostBadge: 'Perdu',
  playersCount: (n: number) => `${n} joueurs`,

  loading: 'Chargement…',
  errorTitle: 'Oups',
  copyright: '© 2026 Nicolas Simon',
};
