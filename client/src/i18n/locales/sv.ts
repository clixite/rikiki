import type { Messages } from '../types';

export const sv: Messages = {
  appName: 'Rikiki',
  tagline: 'Stickspelet med kompisarna — var och en på sin mobil',

  // Startsidan
  createGame: 'Skapa parti',
  joinGame: 'Gå med i parti',
  resumeGame: 'Fortsätt partiet',
  myGames: 'Mina partier',

  // Profil
  yourPseudo: 'Ditt smeknamn',
  pickAvatar: 'Välj din avatar',
  letsGo: 'Nu kör vi!',
  save: 'Spara',
  editProfile: 'Min profil',
  changeAvatar: 'Byt avatar',

  // Gå med
  enterCode: 'Spelkod',
  join: 'Gå med',
  gameCode: 'Spelkod',
  copyLink: 'Kopiera länk',
  copied: 'Länk kopierad!',

  // Lobby
  invite: 'Bjud in vänner',
  players: 'Spelare',
  host: 'Värd',
  you: 'du',
  waitingForHost: 'Väntar på att värden startar…',
  waitingForHostNamed: (p: string) => `${p} startar spelet när alla är på plats`,
  needPlayers: (missing: number) =>
    missing === 1 ? 'Saknas 1 spelare för att börja' : `Saknas ${missing} spelare för att börja`,
  startGame: 'Starta partiet',
  leave: 'Lämna',
  kick: 'Ta bort',
  addBot: 'Lägg till robot',
  addBotHint: 'Fyll bordet med en automatisk spelare',
  botsFull: 'Bordet är fullt',
  removeBot: 'Ta bort roboten',

  // Spelformat (längd)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Spelinställningar',
  gameSettingsHint: 'Värden väljer innan start',
  gameSettingsLocked: 'Inställningar valda av värden',
  settingsDone: 'Klart',

  gameFormat: 'Spelformat',
  gameFormatHint: 'Välj längden innan ni startar',
  formatNames: {
    blitz: 'Blixt',
    normal: 'Normal',
    climb: 'Stigande',
  },
  formatDescriptions: {
    blitz: 'Upp och ner till 5 kort',
    normal: 'Hela vägen upp och hela vägen ner',
    climb: 'Bara uppåt, ingen nedgång',
  },
  formatRounds: (n: number) => (n > 1 ? `${n} rundor` : '1 runda'),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formatet är valt av värden',

  // Barème de score
  scoringVariant: 'Poängräkning',
  scoringHint: 'Så räknas poängen',
  scoringNames: {
    classic: 'Klassisk',
    gentle: 'Mild',
    always: 'Stick räknas alltid',
  },
  scoringDescriptions: {
    classic: 'Budet höll: 10 + 2 per stick. Missat: −2 per sticks skillnad.',
    gentle: 'Budet höll: 10 + 1 per stick. Missat: 0, inget straff.',
    always: 'Dina stick ger alltid poäng, +10 om budet håller.',
  },
  scoringLocked: 'Poängräkning vald av värden',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Tempo',
  gamePaceHint: 'Tillsammans, eller var och en när det passar',
  paceNames: {
    live: 'Live',
    async: 'I egen takt',
  },
  paceDescriptions: {
    live: 'Alla spelar samtidigt; ett drag som drar ut spelas automatiskt.',
    async: 'Var och en spelar när det passar, över flera dagar. Ingen spelar åt dig.',
  },
  paceLocked: 'Tempo valt av värden',
  waitingForPlayer: (pseudo: string) => `Väntar på ${pseudo}`,
  waitingToStart: 'Väntar på start',

  // Spelbordet
  round: 'Runda',
  cards: (n: number) => `${n} kort`,
  trump: 'Trumf',
  noTrump: 'Utan trumf',
  dealer: 'Given',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Hur många stick?',
  bidsTotal: (sum: number, cards: number) => `Budat: ${sum} / ${cards} stick`,
  hookForbidden: (n: number) => `Förbjudet: summan skulle bli exakt ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} är förbjudet: budens summa får inte bli exakt ${cards} (krokregeln).`,
  bid: 'Bud',
  tricks: 'Stick',
  lastTrick: 'Senaste sticket',
  spreadHand: 'Sprid ut korten',
  collapseHand: 'Samla korten',

  // Rundans bud
  bidsAnnounced: 'Budat',
  bidsPending: (announced: number, cards: number) =>
    `${announced} av ${cards} — budgivning pågår`,
  bidsBalanced: (cards: number) => `Jämnt ut: ${cards} stick budade`,
  bidsOver: (n: number) =>
    n > 1 ? `${n} stick för mycket: någon åker dit` : '1 stick för mycket: någon åker dit',
  bidsUnder: (n: number) =>
    n > 1 ? `${n} stick över att plocka upp` : '1 stick över att plocka upp',
  noBidYet: 'Har inte budat än',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} stick`,
  yourTurn: 'Din tur',
  turnOf: (p: string) => `${p} har turen`,
  trickWonBy: (p: string) => `${p} tar sticket`,
  scoreboard: 'Ställning',
  total: 'Totalt',

  // Sammanfattning
  roundRecap: 'Rundan är slut',
  contractKept: 'Kontrakt hållet',
  contractMissed: 'Kontrakt missat',
  contract: 'Kontrakt',
  points: 'Poäng',
  nextRound: 'Nästa runda',
  seeResults: 'Se resultatet',
  waitingNextRound: 'Värden startar nästa runda…',

  // Partiet slut
  gameOver: 'Partiet är slut',
  shareResult: 'Dela resultatet',
  shareTitle: 'Rikiki-parti avslutat 🃏',
  shareSaved: 'Bild sparad',
  playAgain: 'Spela igen',
  backHome: 'Startsidan',

  // Ljud
  soundOn: 'Slå på ljudet',
  soundOff: 'Stäng av ljudet',

  // Nätverk
  reconnecting: 'Återansluter…',
  playerDisconnected: (p: string) => `${p} har tappat anslutningen`,
  playerReconnected: (p: string) => `${p} är tillbaka`,
  playerPaused: (p: string) => `${p} tar en paus`,
  playerResumed: (p: string) => `${p} är med igen`,
  playerJoined: (p: string) => `${p} har gått med i partiet`,
  playerLeft: (p: string) => `${p} har lämnat partiet`,
  roomClosed: 'Partiet har stängts.',
  roomClosedKicked: 'Du har tagits bort från partiet.',
  roomClosedExpired: 'Partiet har gått ut.',

  // Inbjudningar
  inviteMessage: (code: string, url: string) =>
    `Kom och spela Rikiki med oss! 🃏\nSpelkod: ${code}\nGå med här: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Dela',

  // Konto
  saveAccount: 'Spara mina framsteg',
  saveAccountHint: 'Få en länk via e-post — inget lösenord att komma ihåg',
  emailPlaceholder: 'din@epost.se',
  sendMagicLink: 'Skicka min länk',
  magicLinkSent: 'E-posten är skickad! Öppna länken för att bekräfta.',
  accountSaved: 'Framstegen är sparade',
  verifying: 'Verifierar…',
  verified: 'Kontot är bekräftat! Dina framsteg är sparade.',
  verifyFailed: 'Länken är ogiltig eller har gått ut. Be om en ny från din profil.',

  privacyPolicy: 'Integritet',
  deleteAccount: 'Radera mitt konto',
  deleteAccountHint: 'Raderar din profil, din historik och dina grupper.',
  deleteAccountWarning: 'Ditt smeknamn, dina partier, din statistik och dina grupper raderas. Det går inte att ångra.',
  deleteAccountAction: 'Ja, radera allt',
  deleteAccountDone: 'Kontot raderat.',
  cancel: 'Avbryt',
  botTag: 'bot',
  emotes: 'Reaktioner',
  phrases: 'Meddelanden',
  phraseTexts: {
    nice: 'Snyggt spelat!',
    oops: 'Oj då…',
    yourTurn: 'Din tur!',
    hurry: 'Vi väntar 🙂',
    watchTrump: 'Se upp för trumfen',
    mine: 'Den är min',
    sorry: 'Förlåt!',
    brb: 'Strax tillbaka',
    goodGame: 'Bra spelat!',
    again: 'En till?',
  },
  pauseGame: 'Ta en paus',
  resumePlay: 'Jag är tillbaka',
  pausedTag: 'pausad',
  pauseHint: 'En robot håller din plats medan du är borta.',
  close: 'Stäng',
  leaveGame: 'Lämna partiet',
  leaveGameWarning:
    'Partiet fortsätter utan dig och dina poäng i det här partiet går förlorade.',
  leaveGameAction: 'Ja, lämna',
  takePhoto: 'Ta ett foto',
  removePhoto: 'Ta bort foto',
  photoError: 'Fotot är för stort eller oläsbart.',
  reportPlayer: 'Rapportera',
  reportDone: 'Fotot dolt och rapporterat.',

  // Statistik och historik
  stats: 'Statistik',
  gamesPlayed: 'partier',
  gamesWon: 'vinster',
  bestRound: 'bästa rundan',
  noHistory: 'Inga färdigspelade partier än.',
  historyTitle: 'Mina senaste partier',
  wonBadge: 'Vunnet',
  lostBadge: 'Förlorat',
  playersCount: (n: number) => `${n} spelare`,

  // Kompisgrupper
  groups: 'Mina grupper',
  groupsTitle: 'Mina grupper',
  groupsSubtitle: 'En sammanlagd ställning för er som alltid spelar ihop',
  noGroups: 'Du är inte med i någon grupp än.',
  createGroup: 'Skapa grupp',
  createGroupCta: 'Skapa gruppen',
  groupNamePlaceholder: 'Tisdagsgänget',
  groupNameLabel: 'Gruppens namn',
  groupNameTooShort: 'Namnet måste vara 2-30 tecken.',
  joinGroup: 'Gå med i en grupp',
  joinGroupCta: 'Gå med',
  groupCodeLabel: 'Gruppkod',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 bokstäver, utan I, L och O',
  groupCode: 'Gruppkod',
  groupShareHint: 'Dela koden så att dina vänner kan gå med i gruppen',
  copyGroupCode: 'Kopiera koden',
  groupCodeCopied: 'Kod kopierad!',
  groupMembers: (n: number) => (n > 1 ? `${n} medlemmar` : '1 medlem'),
  groupGames: (n: number) => (n > 1 ? `${n} partier` : n === 1 ? '1 parti' : 'inga partier'),
  groupRanking: 'Sammanlagd ställning',
  groupRecentGames: 'Gruppens senaste partier',
  groupNoGames: 'Inga partier spelade i gruppen än.',
  groupNoGamesHint: 'Starta ett parti med gruppen — resultaten dyker upp här.',
  groupPlay: 'Spela med den här gruppen',
  groupOwner: 'Skapare',
  groupLeave: 'Lämna gruppen',
  groupLeaveConfirm: 'Lämna gruppen? Dina tidigare partier ligger kvar i ställningen.',
  groupDelete: 'Radera gruppen',
  groupDeleteConfirm: 'Radera gruppen och hela ställningen? Det går inte att ångra.',
  groupOwnerCannotLeave: 'Du har skapat gruppen: du kan bara radera den.',
  groupNotFound: 'Gruppen hittades inte.',
  groupJoined: (name: string) => `Du har gått med i ”${name}”!`,
  groupCreated: (name: string) => `Gruppen ”${name}” är skapad!`,
  groupAttached: (name: string) => `Partiet är kopplat till ”${name}”`,
  groupTotalPoints: 'poäng',
  groupRankHeader: '#',
  groupPlayerHeader: 'Spelare',
  groupPointsHeader: 'P',
  groupPlayedHeader: 'S',
  groupWonHeader: 'V',

  // Spelregler
  rules: 'Spelregler',
  rulesTitle: 'Så spelar du',
  rulesSubtitle: 'Rikiki på 2 minuter',
  rulesGoalTitle: 'Idén',
  rulesGoalText:
    'Före varje runda bjuder ni hur många stick ni tror er ta hem. Hela poängen är att pricka rätt: varken fler eller färre. Många stick hjälper inte om ni bjöd få.',
  rulesDealTitle: 'Given',
  rulesDealText:
    'Partiet spelas i flera rundor. I den första delas bara ett kort per spelare, sedan två, sedan tre … och därefter går det nedåt igen. I varje runda får alla lika många kort.',
  rulesTrumpText: 'Ett kort vänds upp: dess färg är rundans trumf.',
  rulesBidTitle: 'Budgivningen',
  rulesBidText:
    'En i taget bjuder ni antalet stick ni siktar på — från 0 upp till antalet kort på handen. Ni ser er hand och trumfen innan ni bestämmer er.',
  rulesHookTitle: 'Krokregeln',
  rulesHookText:
    'Den som bjuder sist (given) får inte välja den siffra som skulle göra att budens summa exakt motsvarar rundans antal stick. Alltså blir någon garanterat besviken. Den förbjudna siffran stryks automatiskt.',
  rulesPlayTitle: 'Spelet om sticken',
  rulesPlayText:
    'Spelaren till vänster om given spelar ut. Alla lägger ett kort, och det starkaste tar sticket. Vinnaren spelar ut till nästa stick.',
  rulesFollowSuit: 'Du måste följa färg om du har den.',
  rulesNoSuit: 'Annars spelar du vad du vill: trumfa eller kasta av.',
  rulesWinTrick: 'Högsta trumfen vinner; utan trumf det högsta kortet i utspelad färg.',
  rulesScoreTitle: 'Poängen',
  rulesScoreOk: 'Kontrakt hållet',
  rulesScoreOkExample: 'Bjöd 3, tog 3 → 16 poäng',
  rulesScoreKo: 'Kontrakt missat',
  rulesScoreKoExample: 'Bjöd 3, tog 1 → −4 poäng',
  rulesScoreZero: 'Att bjuda 0 och inte ta ett enda stick ger 10 poäng: ett riktigt lönsamt kontrakt.',
  rulesScoreVariants: 'Värden kan välja en annan poängräkning i lobbyn:',
  rulesEndTitle: 'Slutet på partiet',
  rulesEndText:
    'När alla rundor är spelade vinner den som har flest poäng. Ställningen går att se när som helst under partiet.',
  rulesTip:
    'Tips: i de små rundorna räcker ett ess eller en hög trumf ofta för ett stick. I de stora ska du se upp med de långa färgerna.',
  rulesGotIt: 'Jag fattar',

  // Aviseringar ”det är din tur”
  notificationsTitle: 'Säg till när det är min tur',
  notificationsHint:
    'Lägg undan mobilen: vi aviserar dig så fort bordet väntar. Perfekt för partier som pågår över hela dagen.',
  notificationsEnable: 'Slå på aviseringar',
  notificationsOn: 'Aviseringar på',
  notificationsOff: 'Aviseringar av',
  notificationsChecking: 'Kontrollerar…',
  notificationsUnsupported: 'Din webbläsare stöder inte aviseringar.',
  notificationsNeedsInstall:
    'På iPhone och iPad lägger du först till Rikiki på hemskärmen (Dela → ”Lägg till på hemskärmen”) och kommer sedan tillbaka hit.',
  notificationsDenied:
    'Aviseringar är blockerade för den här sajten. Slå på dem igen i webbläsarens inställningar.',
  notificationsNoServiceWorker:
    'Aviseringar är inte tillgängliga här (installera appen eller ladda om sidan).',
  notificationsServerOff: 'Aviseringar är inte konfigurerade på servern.',
  notificationsError: 'Det gick inte att ändra aviseringarna.',

  updateAvailable: 'Ny version',
  updateReload: 'Uppdatera',
  version: (v: string) => `version ${v}`,

  // Accessibilité
  accessibility: 'Tillgänglighet',
  colorblindMode: 'Egna färger',
  colorblindHint: 'En färg per svit, så att ♥ ♦ ♠ ♣ går att skilja åt utan rött',
  suitNames: { S: 'spader', H: 'hjärter', D: 'ruter', C: 'klöver' } as Record<string, string>,
  rankNames: { 11: 'knekt', 12: 'dam', 13: 'kung', 14: 'ess' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${suit} ${rank}`,
  handOf: (n: number) => (n > 1 ? `Din hand: ${n} kort` : 'Din hand: 1 kort'),

  language: 'Språk',
  languageHint: 'Välj appens språk',

  loading: 'Laddar…',
  errorTitle: 'Hoppsan',
  copyright: '© 2026 Clixite SRL',
};

export default sv;
