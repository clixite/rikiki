import type { Messages } from '../types';

export const nl: Messages = {
  appName: 'Rikiki',
  tagline: 'Het slagenspel met vrienden, ieder op zijn eigen telefoon',

  // Start
  createGame: 'Spel maken',
  joinGame: 'Meedoen met een spel',
  resumeGame: 'Spel hervatten',
  myGames: 'Mijn spellen',

  // Profiel
  yourPseudo: 'Je bijnaam',
  pickAvatar: 'Kies je avatar',
  letsGo: 'Daar gaan we!',
  save: 'Opslaan',
  editProfile: 'Mijn profiel',
  changeAvatar: 'Avatar wijzigen',

  // Meedoen
  enterCode: 'Spelcode',
  join: 'Meedoen',
  gameCode: 'Spelcode',
  copyLink: 'Link kopiëren',
  copied: 'Link gekopieerd!',

  // Lobby
  invite: 'Vrienden uitnodigen',
  players: 'Spelers',
  host: 'Host',
  you: 'jij',
  waitingForHost: 'Wachten tot de host begint…',
  waitingForHostNamed: (p: string) => `${p} start het spel zodra iedereen er is`,
  needPlayers: (missing: number) =>
    missing === 1 ? 'Nog 1 speler om te beginnen' : `Nog ${missing} spelers om te beginnen`,
  startGame: 'Spel starten',
  leave: 'Verlaten',
  kick: 'Verwijderen',
  addBot: 'Bot toevoegen',
  addBotHint: 'Vul het spel aan met een automatische speler',
  botsFull: 'De tafel is vol',
  removeBot: 'Bot verwijderen',

  // Spelformaat (duur)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Spelinstellingen',
  gameSettingsHint: 'De host kiest voor de start',
  gameSettingsLocked: 'Instellingen gekozen door de host',
  settingsDone: 'Klaar',

  gameFormat: 'Spelformaat',
  gameFormatHint: 'Kies de speelduur voor je begint',
  formatNames: {
    blitz: 'Bliksem',
    normal: 'Normaal',
    climb: 'Klim',
  },
  formatDescriptions: {
    blitz: 'Op en af tot 5 kaarten',
    normal: 'Helemaal op en weer af',
    climb: 'Alleen omhoog, zonder terugweg',
  },
  formatRounds: (n: number) => (n === 1 ? '1 ronde' : `${n} rondes`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formaat gekozen door de host',

  // Barème de score
  scoringVariant: 'Puntentelling',
  scoringHint: 'Hoe de punten geteld worden',
  scoringNames: {
    classic: 'Klassiek',
    gentle: 'Mild',
    always: 'Slagen tellen altijd',
  },
  scoringDescriptions: {
    classic: 'Bod gehaald: 10 + 2 per slag. Gemist: −2 per slag verschil.',
    gentle: 'Bod gehaald: 10 + 1 per slag. Gemist: 0, geen straf.',
    always: 'Je slagen tellen altijd, +10 als het bod klopt.',
  },
  scoringLocked: 'Telling gekozen door de host',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Tempo',
  gamePaceHint: 'Samen, of ieder wanneer het uitkomt',
  paceNames: {
    live: 'Live',
    async: 'In eigen tempo',
  },
  paceDescriptions: {
    live: 'Iedereen speelt tegelijk; een beurt die te lang duurt speelt zichzelf.',
    async: 'Iedereen speelt wanneer het uitkomt, over dagen. Niemand speelt voor jou.',
  },
  paceLocked: 'Tempo gekozen door de host',
  waitingForPlayer: (pseudo: string) => `Wacht op ${pseudo}`,
  waitingToStart: 'Wacht op de start',

  // Speeltafel
  round: 'Ronde',
  cards: (n: number) => (n === 1 ? '1 kaart' : `${n} kaarten`),
  trump: 'Troef',
  noTrump: 'Zonder troef',
  dealer: 'Gever',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Hoeveel slagen?',
  bidsTotal: (sum: number, cards: number) => `Geboden: ${sum} / ${cards} slagen`,
  hookForbidden: (n: number) => `Verboden: het totaal zou precies ${n} worden`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} mag niet: alle biedingen samen mogen geen ${cards} zijn (haakregel).`,
  bid: 'Bod',
  tricks: 'Slagen',
  lastTrick: 'Laatste slag',
  spreadHand: 'Kaarten uitspreiden',
  collapseHand: 'Kaarten samenvoegen',

  // Overzicht van de biedingen
  bidsAnnounced: 'Geboden',
  bidsPending: (announced: number, cards: number) =>
    `${announced} van ${cards} — bieden loopt nog`,
  bidsBalanced: (cards: number) => `Totaal klopt precies: ${cards} slagen geboden`,
  bidsOver: (n: number) =>
    n === 1 ? '1 slag te veel: iemand gaat nat' : `${n} slagen te veel: iemand gaat nat`,
  bidsUnder: (n: number) =>
    n === 1 ? '1 slag extra te pakken' : `${n} slagen extra te pakken`,
  noBidYet: 'Nog niet geboden',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} slagen`,
  yourTurn: 'Jij bent aan de beurt',
  turnOf: (p: string) => `${p} is aan de beurt`,
  trickWonBy: (p: string) => `${p} wint de slag`,
  scoreboard: 'Scores',
  total: 'Totaal',

  // Overzicht
  roundRecap: 'Einde van de ronde',
  contractKept: 'Contract gehaald',
  contractMissed: 'Contract gemist',
  contract: 'Contract',
  points: 'Punten',
  nextRound: 'Volgende ronde',
  seeResults: 'Resultaten bekijken',
  waitingNextRound: 'De host start zo de volgende ronde…',

  // Einde van het spel
  gameOver: 'Spel afgelopen',
  shareResult: 'Resultaat delen',
  shareTitle: 'Rikiki-partij afgelopen 🃏',
  shareSaved: 'Afbeelding opgeslagen',
  playAgain: 'Opnieuw spelen',
  backHome: 'Start',

  // Geluid
  soundOn: 'Geluid aan',
  soundOff: 'Geluid uit',

  // Netwerk
  reconnecting: 'Opnieuw verbinden…',
  playerDisconnected: (p: string) => `${p} heeft de verbinding verloren`,
  playerReconnected: (p: string) => `${p} is terug`,
  playerPaused: (p: string) => `${p} pauzeert even`,
  playerResumed: (p: string) => `${p} speelt weer mee`,
  playerJoined: (p: string) => `${p} doet mee`,
  playerLeft: (p: string) => `${p} heeft het spel verlaten`,
  roomClosed: 'Het spel is gesloten.',
  roomClosedKicked: 'Je bent uit het spel verwijderd.',
  roomClosedExpired: 'Het spel is verlopen.',

  // Uitnodigingen
  inviteMessage: (code: string, url: string) =>
    `Kom Rikiki met ons spelen! 🃏\nSpelcode: ${code}\nDoe hier mee: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'Sms',
  inviteShare: 'Delen',

  // Account
  saveAccount: 'Mijn voortgang bewaren',
  saveAccountHint: 'Je krijgt een link per e-mail — geen wachtwoord om te onthouden',
  emailPlaceholder: 'jij@email.nl',
  sendMagicLink: 'Stuur mijn link',
  magicLinkSent: 'E-mail verstuurd! Open de link om te bevestigen.',
  accountSaved: 'Voortgang bewaard',
  verifying: 'Controleren…',
  verified: 'Account bevestigd! Je voortgang is bewaard.',
  verifyFailed: 'Link ongeldig of verlopen. Vraag een nieuwe aan via je profiel.',

  privacyPolicy: 'Privacy',
  deleteAccount: 'Mijn account verwijderen',
  deleteAccountHint: 'Wist je profiel, geschiedenis en groepen.',
  deleteAccountWarning: 'Je bijnaam, je partijen, je statistieken en je groepen worden gewist. Dit kan niet ongedaan worden gemaakt.',
  deleteAccountAction: 'Ja, alles verwijderen',
  deleteAccountDone: 'Account verwijderd.',
  cancel: 'Annuleren',
  botTag: 'bot',
  emotes: 'Reacties',
  phrases: 'Berichten',
  phraseTexts: {
    nice: 'Mooi gespeeld!',
    oops: 'Oeps…',
    yourTurn: 'Jij bent!',
    hurry: 'We wachten 🙂',
    watchTrump: 'Let op de troef',
    mine: 'Die is voor mij',
    sorry: 'Sorry!',
    brb: 'Zo terug',
    goodGame: 'Mooi partijtje!',
    again: 'Nog een?',
  },
  pauseGame: 'Even pauzeren',
  resumePlay: 'Ik ben terug',
  pausedTag: 'gepauzeerd',
  pauseHint: 'Een robot houdt je plaats vrij zolang je weg bent.',
  close: 'Sluiten',
  leaveGame: 'Partij verlaten',
  leaveGameWarning:
    'De partij gaat door zonder jou en je punten van deze partij gaan verloren.',
  leaveGameAction: 'Ja, verlaten',
  takePhoto: 'Foto maken',
  removePhoto: 'Foto verwijderen',
  photoError: 'Foto te groot of onleesbaar.',
  reportPlayer: 'Melden',
  reportDone: 'Foto verborgen en gemeld.',

  // Statistieken en geschiedenis
  stats: 'Statistieken',
  gamesPlayed: 'spellen',
  gamesWon: 'gewonnen',
  bestRound: 'beste ronde',
  noHistory: 'Nog geen enkel spel uitgespeeld.',
  historyTitle: 'Mijn laatste spellen',
  wonBadge: 'Gewonnen',
  lostBadge: 'Verloren',
  playersCount: (n: number) => `${n} spelers`,

  // Vriendengroepen
  groups: 'Mijn groepen',
  groupsTitle: 'Mijn groepen',
  groupsSubtitle: 'Een doorlopend klassement voor wie altijd samen speelt',
  noGroups: 'Je zit nog in geen enkele groep.',
  createGroup: 'Groep maken',
  createGroupCta: 'Groep maken',
  groupNamePlaceholder: 'De dinsdagclub',
  groupNameLabel: 'Groepsnaam',
  groupNameTooShort: 'De naam moet tussen 2 en 30 tekens lang zijn.',
  joinGroup: 'Bij een groep gaan',
  joinGroupCta: 'Meedoen',
  groupCodeLabel: 'Groepscode',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 letters, zonder I, L en O',
  groupCode: 'Groepscode',
  groupShareHint: 'Deel deze code zodat je vrienden bij de groep komen',
  copyGroupCode: 'Code kopiëren',
  groupCodeCopied: 'Code gekopieerd!',
  groupMembers: (n: number) => (n === 1 ? '1 lid' : `${n} leden`),
  groupGames: (n: number) => (n === 1 ? '1 spel' : n === 0 ? 'geen spellen' : `${n} spellen`),
  groupRanking: 'Totaalklassement',
  groupRecentGames: 'Laatste spellen van de groep',
  groupNoGames: 'Nog geen spel in groepsverband gespeeld.',
  groupNoGamesHint: 'Start een spel met deze groep: de resultaten komen hier te staan.',
  groupPlay: 'Met deze groep spelen',
  groupOwner: 'Maker',
  groupLeave: 'Groep verlaten',
  groupLeaveConfirm: 'Deze groep verlaten? Je gespeelde spellen blijven in het klassement staan.',
  groupDelete: 'Groep verwijderen',
  groupDeleteConfirm: 'Deze groep en het hele klassement verwijderen? Dit is definitief.',
  groupOwnerCannotLeave: 'Jij hebt deze groep gemaakt: je kunt hem alleen verwijderen.',
  groupNotFound: 'Groep niet gevonden.',
  groupJoined: (name: string) => `Je zit nu in ‘${name}’!`,
  groupCreated: (name: string) => `Groep ‘${name}’ gemaakt!`,
  groupAttached: (name: string) => `Spel gekoppeld aan ‘${name}’`,
  groupTotalPoints: 'punten',
  groupRankHeader: '#',
  groupPlayerHeader: 'Speler',
  groupPointsHeader: 'Ptn',
  groupPlayedHeader: 'G',
  groupWonHeader: 'W',

  // Spelregels
  rules: 'Spelregels',
  rulesTitle: 'Zo speel je',
  rulesSubtitle: 'Rikiki in 2 minuten',
  rulesGoalTitle: 'Het idee',
  rulesGoalText:
    'Voor elke ronde bied je hoeveel slagen je denkt te halen. Het gaat erom precies goed te zitten: niet meer, niet minder. Veel slagen halen levert niets op als je er weinig had geboden.',
  rulesDealTitle: 'Het delen',
  rulesDealText:
    'Een spel gaat over meerdere rondes. In de eerste krijgt iedereen maar één kaart, dan twee, dan drie… en daarna weer omlaag. Elke ronde krijgt iedereen evenveel kaarten.',
  rulesTrumpText: 'Er wordt één kaart omgedraaid: die kleur is de troef van de ronde.',
  rulesBidTitle: 'Het bod',
  rulesBidText:
    'Om de beurt bied je hoeveel slagen je wilt halen — van 0 tot het aantal kaarten in je hand. Je ziet je kaarten en de troef voor je beslist.',
  rulesHookTitle: 'De haakregel',
  rulesHookText:
    'Wie als laatste biedt (de gever) mag niet het getal kiezen waarmee alle biedingen samen precies uitkomen op het aantal slagen van de ronde. Gevolg: iemand komt gegarandeerd bedrogen uit. Het verboden getal wordt automatisch doorgestreept.',
  rulesPlayTitle: 'De slagen spelen',
  rulesPlayText:
    'De speler links van de gever komt uit. Iedereen legt één kaart en de sterkste wint de slag. De winnaar komt uit voor de volgende slag.',
  rulesFollowSuit: 'Je moet de gevraagde kleur bekennen als je die hebt.',
  rulesNoSuit: 'Anders speel je wat je wilt: troeven of een kaart afgooien.',
  rulesWinTrick: 'De hoogste troef wint; zonder troef de hoogste kaart van de gevraagde kleur.',
  rulesScoreTitle: 'De punten',
  rulesScoreOk: 'Contract gehaald',
  rulesScoreOkExample: 'Geboden 3, gehaald 3 → 16 punten',
  rulesScoreKo: 'Contract gemist',
  rulesScoreKoExample: 'Geboden 3, gehaald 1 → −4 punten',
  rulesScoreZero: '0 bieden en er geen halen levert 10 punten op: een heel lucratief contract.',
  rulesScoreVariants: 'De host kan in de lobby een andere telling kiezen:',
  rulesEndTitle: 'Einde van het spel',
  rulesEndText:
    'Als alle rondes gespeeld zijn, wint wie de meeste punten heeft. Het scorebord kun je tijdens het spel altijd bekijken.',
  rulesTip:
    'Tip: in korte rondes is een aas of een hoge troef vaak genoeg voor een zekere slag. In lange rondes moet je oppassen voor lange kleuren.',
  rulesGotIt: 'Duidelijk',

  // Meldingen ‘je bent aan de beurt’
  notificationsTitle: 'Waarschuw me als ik aan de beurt ben',
  notificationsHint:
    'Steek je telefoon weg: we sturen je een melding zodra de tafel op je wacht. Ideaal voor spellen die over de dag verspreid zijn.',
  notificationsEnable: 'Meldingen aanzetten',
  notificationsOn: 'Meldingen aan',
  notificationsOff: 'Meldingen uit',
  notificationsChecking: 'Controleren…',
  notificationsUnsupported: 'Je browser ondersteunt geen meldingen.',
  notificationsNeedsInstall:
    'Zet Rikiki op iPhone en iPad eerst op je beginscherm (Deel → ‘Zet op beginscherm’) en kom dan hier terug.',
  notificationsDenied:
    'Meldingen zijn geblokkeerd voor deze site. Zet ze weer aan in de instellingen van je browser.',
  notificationsNoServiceWorker:
    'Meldingen hier niet beschikbaar (installeer de app of laad de pagina opnieuw).',
  notificationsServerOff: 'Meldingen zijn niet ingesteld op de server.',
  notificationsError: 'Meldingen konden niet gewijzigd worden.',

  updateAvailable: 'Nieuwe versie',
  updateReload: 'Bijwerken',
  version: (v: string) => `versie ${v}`,

  // Toegankelijkheid
  accessibility: 'Toegankelijkheid',
  colorblindMode: 'Aparte kleuren',
  colorblindHint: 'Eén kleur per soort, zodat ♥ ♦ ♠ ♣ ook zonder rood te onderscheiden zijn',
  suitNames: { S: 'schoppen', H: 'harten', D: 'ruiten', C: 'klaveren' } as Record<string, string>,
  rankNames: { 11: 'boer', 12: 'vrouw', 13: 'heer', 14: 'aas' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) => (n > 1 ? `Jouw hand: ${n} kaarten` : 'Jouw hand: 1 kaart'),

  language: 'Taal',
  languageHint: 'Kies de taal van de app',

  loading: 'Laden…',
  errorTitle: 'Oeps',
  copyright: '© 2026 Clixite SRL',
};

export default nl;
