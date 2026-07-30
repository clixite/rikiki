import type { Messages } from '../types';

export const da: Messages = {
  appName: 'Rikiki',
  tagline: 'Stikspillet med vennerne — hver på sin telefon',

  // Forsiden
  createGame: 'Opret spil',
  joinGame: 'Deltag i spil',
  resumeGame: 'Fortsæt spillet',
  myGames: 'Mine spil',

  // Profil
  yourPseudo: 'Dit kaldenavn',
  pickAvatar: 'Vælg din avatar',
  letsGo: 'Så spiller vi!',
  save: 'Gem',
  editProfile: 'Min profil',
  changeAvatar: 'Skift avatar',

  // Deltag
  enterCode: 'Spilkode',
  join: 'Deltag',
  gameCode: 'Spilkode',
  copyLink: 'Kopiér link',
  copied: 'Link kopieret!',

  // Lobby
  invite: 'Inviter venner',
  players: 'Spillere',
  host: 'Vært',
  you: 'dig',
  waitingForHost: 'Venter på, at værten starter…',
  waitingForHostNamed: (p: string) => `${p} starter spillet, når alle er her`,
  needPlayers: (missing: number) =>
    missing === 1 ? 'Mangler 1 spiller for at starte' : `Mangler ${missing} spillere for at starte`,
  startGame: 'Start spillet',
  leave: 'Forlad',
  kick: 'Fjern',
  addBot: 'Tilføj robot',
  addBotHint: 'Fyld bordet op med en automatisk spiller',
  botsFull: 'Bordet er fuldt',
  removeBot: 'Fjern robotten',

  // Spilformat (længde)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Spilindstillinger',
  gameSettingsHint: 'Værten vælger inden start',
  gameSettingsLocked: 'Indstillinger valgt af værten',
  settingsDone: 'Færdig',

  gameFormat: 'Spilformat',
  gameFormatHint: 'Vælg længden, før I starter',
  formatNames: {
    blitz: 'Lyn',
    normal: 'Normal',
    climb: 'Stigende',
  },
  formatDescriptions: {
    blitz: 'Op og ned til 5 kort',
    normal: 'Hele vejen op og hele vejen ned',
    climb: 'Kun opad, ingen nedtur',
  },
  formatRounds: (n: number) => (n > 1 ? `${n} runder` : '1 runde'),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formatet er valgt af værten',

  // Barème de score
  scoringVariant: 'Pointsystem',
  scoringHint: 'Sådan tælles pointene',
  scoringNames: {
    classic: 'Klassisk',
    gentle: 'Mildt',
    always: 'Stik tæller',
  },
  scoringDescriptions: {
    classic: 'Bud holdt: 10 + 2 pr. stik. Forfejlet: −2 pr. stik i forskel.',
    gentle: 'Bud holdt: 10 + 1 pr. stik. Forfejlet: 0, ingen straf.',
    always: 'Dine stik giver altid point, +10 hvis buddet holder.',
  },
  scoringLocked: 'Pointsystem valgt af værten',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Tempo',
  gamePaceHint: 'Sammen, eller når hver især kan',
  paceNames: {
    live: 'Live',
    async: 'I eget tempo',
  },
  paceDescriptions: {
    live: 'Alle spiller samtidig; en for lang tur spilles automatisk.',
    async: 'Hver spiller, når de kan, over flere dage. Ingen spiller for dig.',
  },
  paceLocked: 'Tempo valgt af værten',
  waitingForPlayer: (pseudo: string) => `Venter på ${pseudo}`,
  waitingToStart: 'Venter på start',

  // Spillebordet
  round: 'Runde',
  cards: (n: number) => `${n} kort`,
  trump: 'Trumf',
  noTrump: 'Uden trumf',
  dealer: 'Giver',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Hvor mange stik?',
  bidsTotal: (sum: number, cards: number) => `Meldt: ${sum} / ${cards} stik`,
  hookForbidden: (n: number) => `Forbudt: totalen ville blive præcis ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} er forbudt: meldingerne må ikke give præcis ${cards} tilsammen (krogreglen).`,
  bid: 'Melding',
  tricks: 'Stik',
  lastTrick: 'Sidste stik',
  spreadHand: 'Spred kortene',
  collapseHand: 'Saml kortene',

  // Rundens meldinger
  bidsAnnounced: 'Meldt',
  bidsPending: (announced: number, cards: number) => `${announced} af ${cards} — meldinger i gang`,
  bidsBalanced: (cards: number) => `Lige op: ${cards} stik meldt`,
  bidsOver: (n: number) =>
    n > 1 ? `${n} stik for meget: nogen ryger ned` : '1 stik for meget: nogen ryger ned',
  bidsUnder: (n: number) =>
    n > 1 ? `${n} stik i overskud at samle op` : '1 stik i overskud at samle op',
  noBidYet: 'Har ikke meldt endnu',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} stik`,
  yourTurn: 'Din tur',
  turnOf: (p: string) => `${p} er i tur`,
  trickWonBy: (p: string) => `${p} tager stikket`,
  scoreboard: 'Stilling',
  total: 'I alt',

  // Opsamling
  roundRecap: 'Runden er slut',
  contractKept: 'Melding holdt',
  contractMissed: 'Melding misset',
  contract: 'Kontrakt',
  points: 'Point',
  nextRound: 'Næste runde',
  seeResults: 'Se resultatet',
  waitingNextRound: 'Værten starter næste runde…',

  // Spillet slut
  gameOver: 'Spillet er slut',
  shareResult: 'Del resultatet',
  shareTitle: 'Rikiki-parti slut 🃏',
  shareSaved: 'Billede gemt',
  playAgain: 'Spil igen',
  backHome: 'Forsiden',

  // Lyd
  soundOn: 'Slå lyd til',
  soundOff: 'Slå lyd fra',

  // Netværk
  reconnecting: 'Genopretter forbindelsen…',
  playerDisconnected: (p: string) => `${p} har mistet forbindelsen`,
  playerReconnected: (p: string) => `${p} er tilbage`,
  playerPaused: (p: string) => `${p} holder en pause`,
  playerResumed: (p: string) => `${p} er med igen`,
  playerJoined: (p: string) => `${p} er kommet med i spillet`,
  playerLeft: (p: string) => `${p} har forladt spillet`,
  roomClosed: 'Spillet er lukket.',
  roomClosedKicked: 'Du er blevet fjernet fra spillet.',
  roomClosedExpired: 'Spillet er udløbet.',

  // Invitationer
  inviteMessage: (code: string, url: string) =>
    `Kom og spil Rikiki med os! 🃏\nSpilkode: ${code}\nDeltag her: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Del',

  // Konto
  saveAccount: 'Gem mine fremskridt',
  saveAccountHint: 'Få et link på e-mail — ingen adgangskode at huske',
  emailPlaceholder: 'din@email.dk',
  sendMagicLink: 'Send mit link',
  magicLinkSent: 'E-mailen er sendt! Åbn linket for at bekræfte.',
  accountSaved: 'Fremskridt gemt',
  verifying: 'Bekræfter…',
  verified: 'Kontoen er bekræftet! Dine fremskridt er gemt.',
  verifyFailed: 'Linket er ugyldigt eller udløbet. Bed om et nyt fra din profil.',

  privacyPolicy: 'Privatliv',
  deleteAccount: 'Slet min konto',
  deleteAccountHint: 'Sletter din profil, din historik og dine grupper.',
  deleteAccountWarning: 'Dit kaldenavn, dine spil, dine statistikker og dine grupper bliver slettet. Det kan ikke fortrydes.',
  deleteAccountAction: 'Ja, slet alt',
  deleteAccountDone: 'Kontoen er slettet.',
  cancel: 'Annuller',
  botTag: 'bot',
  emotes: 'Reaktioner',
  phrases: 'Beskeder',
  phraseTexts: {
    nice: 'Flot spillet!',
    oops: 'Ups…',
    yourTurn: 'Din tur!',
    hurry: 'Vi venter 🙂',
    watchTrump: 'Pas på trumfen',
    mine: 'Den er min',
    sorry: 'Undskyld!',
    brb: 'Straks tilbage',
    goodGame: 'Godt spillet!',
    again: 'En mere?',
  },
  pauseGame: 'Tag en pause',
  resumePlay: 'Jeg er tilbage',
  pausedTag: 'på pause',
  pauseHint: 'En robot holder din plads, mens du er væk.',
  close: 'Luk',
  leaveGame: 'Forlad spillet',
  leaveGameWarning:
    'Spillet fortsætter uden dig, og dine point i dette spil går tabt.',
  leaveGameAction: 'Ja, forlad',
  takePhoto: 'Tag et billede',
  removePhoto: 'Fjern billede',
  photoError: 'Billedet er for stort eller ulæseligt.',
  reportPlayer: 'Anmeld',
  reportDone: 'Billedet er skjult og anmeldt.',

  // Statistik og historik
  stats: 'Statistik',
  gamesPlayed: 'spil',
  gamesWon: 'sejre',
  bestRound: 'bedste runde',
  contractsKept: 'Holdte meldinger',
  noHistory: 'Ingen færdigspillede spil endnu.',
  historyTitle: 'Mine seneste spil',
  wonBadge: 'Vundet',
  lostBadge: 'Tabt',
  playersCount: (n: number) => (n > 1 ? `${n} spillere` : '1 spiller'),

  // Vennegrupper
  groups: 'Mine grupper',
  groupsTitle: 'Mine grupper',
  groupsSubtitle: 'En samlet stilling for jer, der altid spiller sammen',
  noGroups: 'Du er ikke med i nogen gruppe endnu.',
  createGroup: 'Opret gruppe',
  createGroupCta: 'Opret gruppen',
  groupNamePlaceholder: 'Tirsdagsholdet',
  groupNameLabel: 'Gruppens navn',
  groupNameTooShort: 'Navnet skal være på 2-30 tegn.',
  joinGroup: 'Deltag i en gruppe',
  joinGroupCta: 'Deltag',
  groupCodeLabel: 'Gruppekode',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 bogstaver, uden I, L og O',
  groupCode: 'Gruppekode',
  groupShareHint: 'Del koden, så dine venner kan komme med i gruppen',
  copyGroupCode: 'Kopiér koden',
  groupCodeCopied: 'Kode kopieret!',
  groupMembers: (n: number) => (n > 1 ? `${n} medlemmer` : '1 medlem'),
  groupGames: (n: number) => (n > 1 ? `${n} spil` : n === 1 ? '1 spil' : 'ingen spil'),
  groupRanking: 'Samlet stilling',
  groupRecentGames: 'Gruppens seneste spil',
  groupNoGames: 'Der er ikke spillet i gruppen endnu.',
  groupNoGamesHint: 'Start et spil med gruppen — resultaterne lander her.',
  groupPlay: 'Spil med denne gruppe',
  groupOwner: 'Opretter',
  groupLeave: 'Forlad gruppen',
  groupLeaveConfirm: 'Forlade gruppen? Dine tidligere spil bliver i stillingen.',
  groupDelete: 'Slet gruppen',
  groupDeleteConfirm: 'Slette gruppen og hele stillingen? Det kan ikke fortrydes.',
  groupOwnerCannotLeave: 'Du har oprettet gruppen: du kan kun slette den.',
  groupNotFound: 'Gruppen findes ikke.',
  groupJoined: (name: string) => `Du er med i »${name}«!`,
  groupCreated: (name: string) => `Gruppen »${name}« er oprettet!`,
  groupAttached: (name: string) => `Spillet er knyttet til »${name}«`,
  groupTotalPoints: 'point',
  groupRankHeader: '#',
  groupPlayerHeader: 'Spiller',
  groupPointsHeader: 'Pt',
  groupPlayedHeader: 'S',
  groupWonHeader: 'V',

  // Spilleregler
  rules: 'Spilleregler',
  rulesTitle: 'Sådan spiller du',
  demoTitle: 'Spillet på ét minut',
  demoPlay: 'Afspil gennemgangen',
  demoPause: 'Sæt på pause',
  demoReplay: 'Se igen',
  demoPrev: 'Forrige trin',
  demoNext: 'Næste trin',
  demoDeal: 'Alle får deres kort. Det sidste, der vendes, bestemmer trumfen: den farve slår alle andre.',
  demoBid: 'Alle melder, hvor mange stik de regner med at tage. Giveren melder til sidst og må ikke få totalen til at gå op.',
  demoFollow: 'Følg den farve, der blev spillet ud, hvis du har den. Kun ellers må du spille, hvad du vil.',
  demoTrump: 'En trumf tager stikket fra den udspillede farve — også den laveste.',
  demoScore: 'Melding holdt: 10 point plus 2 pr. stik. Forfejlet: 2 point fra for hvert stiks forskel.',
  rulesSubtitle: 'Rikiki på 2 minutter',
  rulesGoalTitle: 'Idéen',
  rulesGoalText:
    'Før hver runde melder I, hvor mange stik I regner med at tage hjem. Kunsten er at ramme præcist: hverken flere eller færre. Mange stik nytter ikke, hvis I meldte få.',
  rulesDealTitle: 'Givningen',
  rulesDealText:
    'Spillet består af flere runder. I den første får hver spiller ét kort, så to, så tre … og bagefter går det ned igen. I hver runde får alle lige mange kort.',
  rulesTrumpText: 'Et kort vendes: dets farve er rundens trumf.',
  rulesBidTitle: 'Meldingen',
  rulesBidText:
    'På skift melder I, hvor mange stik I går efter — fra 0 op til antal kort på hånden. I ser jeres egne kort og trumfen, før I bestemmer jer.',
  rulesHookTitle: 'Krogreglen',
  rulesHookText:
    'Den sidste, der melder (giveren), må ikke vælge det tal, som ville få meldingerne til at ramme rundens antal stik præcist. Så bliver nogen nødvendigvis skuffet. Det forbudte tal streges automatisk ud.',
  rulesPlayTitle: 'Spillet om stikkene',
  rulesPlayText:
    'Spilleren til venstre for giveren spiller ud. Alle lægger ét kort, og det stærkeste tager stikket. Vinderen spiller ud til næste stik.',
  rulesFollowSuit: 'Du skal bekende farve, hvis du har den.',
  rulesNoSuit: 'Ellers spiller du, hvad du vil: trumfe eller smide af.',
  rulesWinTrick: 'Højeste trumf vinder; uden trumf det højeste kort i den udspillede farve.',
  rulesScoreTitle: 'Pointene',
  rulesScoreOk: 'Kontrakt holdt',
  rulesScoreOkExample: 'Meldt 3, taget 3 → 16 point',
  rulesScoreKo: 'Kontrakt misset',
  rulesScoreKoExample: 'Meldt 3, taget 1 → −4 point',
  rulesScoreZero: 'At melde 0 og ikke tage et eneste stik giver 10 point: en rigtig god forretning.',
  rulesScoreVariants: 'Værten kan vælge et andet pointsystem i lobbyen:',
  rulesEndTitle: 'Spillets afslutning',
  rulesEndText:
    'Når alle runder er spillet, vinder den med flest point. Stillingen kan ses når som helst undervejs.',
  rulesTip:
    'Tip: i de små runder er et es eller en høj trumf tit nok til et stik. I de store skal du passe på de lange farver.',
  rulesGotIt: 'Forstået',

  // Notifikationer »det er din tur«
  notificationsTitle: 'Giv mig besked, når det er min tur',
  notificationsHint:
    'Læg telefonen fra dig: vi sender en besked, så snart bordet venter på dig. Perfekt til spil, der strækker sig over dagen.',
  notificationsEnable: 'Slå notifikationer til',
  notificationsOn: 'Notifikationer slået til',
  notificationsOff: 'Notifikationer slået fra',
  notificationsChecking: 'Tjekker…',
  notificationsUnsupported: 'Din browser understøtter ikke notifikationer.',
  notificationsNeedsInstall:
    'På iPhone og iPad skal du først føje Rikiki til hjemmeskærmen (Del → »Føj til hjemmeskærm«) og så vende tilbage hertil.',
  notificationsDenied:
    'Notifikationer er blokeret for dette site. Slå dem til igen i browserens indstillinger.',
  notificationsNoServiceWorker:
    'Notifikationer er ikke tilgængelige her (installér appen, eller genindlæs siden).',
  notificationsServerOff: 'Notifikationer er ikke sat op på serveren.',
  notificationsError: 'Kunne ikke ændre notifikationerne.',

  updateAvailable: 'Ny version',
  updateReload: 'Opdatér',
  version: (v: string) => `version ${v}`,

  // Accessibilité
  accessibility: 'Tilgængelighed',
  colorblindMode: 'Egne farver',
  colorblindHint: 'Én farve per kulør, så ♥ ♦ ♠ ♣ kan skelnes uden rød',
  leftHandedMode: 'Betjening til venstre',
  leftHandedHint: 'Flytter bordets knapper fra højre kant til venstre.',
  colorblindHintBanner: 'Farveblind? Prøv egne farver i din profil.',
  suitNames: { S: 'spar', H: 'hjerter', D: 'ruder', C: 'klør' } as Record<string, string>,
  rankNames: { 11: 'knægt', 12: 'dame', 13: 'konge', 14: 'es' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${suit} ${rank}`,
  handOf: (n: number) => (n > 1 ? `Din hånd: ${n} kort` : 'Din hånd: 1 kort'),

  language: 'Sprog',
  languageHint: 'Vælg appens sprog',

  loading: 'Indlæser…',
  errorTitle: 'Ups',
  copyright: '© 2026 Clixite SRL',
};

export default da;
