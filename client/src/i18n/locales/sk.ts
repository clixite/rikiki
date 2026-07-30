import type { Messages } from '../types';

/**
 * Pluriel slovaque : trois formes.
 *   1        → nominatif singulier (1 karta)
 *   2-4      → nominatif pluriel   (3 karty)
 *   0, 5+    → génitif pluriel     (7 kariet, 21 kariet)
 */
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

const zdvihy = (n: number): string =>
  plural(n, '1 zdvih', `${n} zdvihy`, `${n} zdvihov`);

export const sk: Messages = {
  appName: 'Rikiki',
  tagline: 'Zdvihová hra s priateľmi, každý na svojom telefóne',

  // Úvod
  createGame: 'Založiť hru',
  joinGame: 'Pripojiť sa k hre',
  resumeGame: 'Pokračovať v hre',
  myGames: 'Moje hry',

  // Profil
  yourPseudo: 'Tvoja prezývka',
  pickAvatar: 'Vyber si avatara',
  letsGo: 'Ideme na to!',
  save: 'Uložiť',
  editProfile: 'Môj profil',
  changeAvatar: 'Zmeniť avatara',

  // Pripojenie
  enterCode: 'Kód hry',
  join: 'Pripojiť sa',
  gameCode: 'Kód hry',
  copyLink: 'Kopírovať odkaz',
  copied: 'Odkaz skopírovaný!',

  // Čakáreň
  invite: 'Pozvať priateľov',
  players: 'Hráči',
  host: 'Hostiteľ',
  you: 'ty',
  waitingForHost: 'Čakáme, kým hostiteľ spustí hru…',
  waitingForHostNamed: (p: string) => `${p} spustí hru, keď budú všetci`,
  needPlayers: (missing: number) =>
    plural(
      missing,
      'Ešte 1 hráč a začíname',
      `Ešte ${missing} hráči a začíname`,
      `Ešte ${missing} hráčov a začíname`,
    ),
  startGame: 'Spustiť hru',
  leave: 'Odísť',
  kick: 'Vyhodiť',
  addBot: 'Pridať robota',
  addBotHint: 'Doplň stôl automatickým hráčom',
  botsFull: 'Stôl je plný',
  removeBot: 'Odobrať robota',

  // Formát hry (dĺžka)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Nastavenia hry',
  gameSettingsHint: 'Hostiteľ volí pred štartom',
  gameSettingsLocked: 'Nastavenia určuje hostiteľ',
  settingsDone: 'Hotovo',

  gameFormat: 'Formát hry',
  gameFormatHint: 'Vyber dĺžku pred spustením',
  formatNames: {
    blitz: 'Bleskovka',
    normal: 'Normálna',
    climb: 'Stúpajúca',
  },
  formatDescriptions: {
    blitz: 'Hore a dole až po 5 kariet',
    normal: 'Celý výstup aj zostup',
    climb: 'Len hore, bez zostupu',
  },
  formatRounds: (n: number) => plural(n, '1 kolo', `${n} kolá`, `${n} kôl`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formát určuje hostiteľ',

  // Barème de score
  scoringVariant: 'Bodovanie',
  scoringHint: 'Ako sa počítajú body',
  scoringNames: {
    classic: 'Klasické',
    gentle: 'Mierne',
    always: 'Zdvihy sa počítajú',
  },
  scoringDescriptions: {
    classic: 'Splnený záväzok: 10 + 2 za zdvih. Nesplnený: −2 za každý zdvih rozdielu.',
    gentle: 'Splnený záväzok: 10 + 1 za zdvih. Nesplnený: 0, žiadny postih.',
    always: 'Zdvihy vždy bodujú, +10 pri splnenom záväzku.',
  },
  scoringLocked: 'Bodovanie určuje hostiteľ',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Tempo',
  gamePaceHint: 'Spoločne alebo každý keď môže',
  paceNames: {
    live: 'Naživo',
    async: 'Vlastným tempom',
  },
  paceDescriptions: {
    live: 'Všetci hrajú naraz; príliš dlhý ťah sa zahrá sám.',
    async: 'Každý hrá, keď môže, aj niekoľko dní. Nikto nehrá za teba.',
  },
  paceLocked: 'Tempo určuje hostiteľ',
  waitingForPlayer: (pseudo: string) => `Čaká sa na ${pseudo}`,
  waitingToStart: 'Čaká sa na štart',

  // Stôl
  round: 'Kolo',
  cards: (n: number) => plural(n, '1 karta', `${n} karty`, `${n} kariet`),
  trump: 'Tromf',
  noTrump: 'Bez tromfov',
  dealer: 'Rozdávajúci',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Koľko zdvihov?',
  bidsTotal: (sum: number, cards: number) => `Hlásenia: ${sum} / ${zdvihy(cards)}`,
  hookForbidden: (n: number) => `Zakázané: súčet by bol presne ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} je zakázané: súčet hlásení sa nesmie rovnať ${cards} (pravidlo háčika).`,
  bid: 'Hlásenie',
  tricks: 'Zdvihy',
  lastTrick: 'Posledný zdvih',
  spreadHand: 'Rozložiť karty',
  collapseHand: 'Zložiť karty',

  // Prehľad hlásení kola
  bidsAnnounced: 'Nahlásené',
  bidsPending: (announced: number, cards: number) => `${announced} z ${cards} — hlási sa`,
  bidsBalanced: (cards: number) => `Súčet sedí: ${zdvihy(cards)}`,
  bidsOver: (n: number) =>
    plural(
      n,
      'O 1 zdvih viac: niekto to odnesie',
      `O ${n} zdvihy viac: niekto to odnesie`,
      `O ${n} zdvihov viac: niekto to odnesie`,
    ),
  bidsUnder: (n: number) =>
    plural(
      n,
      'Zostáva 1 zdvih navyše na pobratie',
      `Zostávajú ${n} zdvihy navyše na pobratie`,
      `Zostáva ${n} zdvihov navyše na pobratie`,
    ),
  noBidYet: 'Zatiaľ bez hlásenia',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} zdvihov`,
  yourTurn: 'Si na ťahu',
  turnOf: (p: string) => `Na ťahu: ${p}`,
  trickWonBy: (p: string) => `${p} berie zdvih`,
  scoreboard: 'Skóre',
  total: 'Spolu',

  // Zhrnutie
  roundRecap: 'Koniec kola',
  contractKept: 'Záväzok splnený',
  contractMissed: 'Záväzok nesplnený',
  contract: 'Záväzok',
  points: 'Body',
  nextRound: 'Ďalšie kolo',
  seeResults: 'Zobraziť výsledky',
  waitingNextRound: 'Hostiteľ spustí ďalšie kolo…',

  // Koniec hry
  gameOver: 'Koniec hry',
  shareResult: 'Zdieľať výsledok',
  shareTitle: 'Partia Rikiki sa skončila 🃏',
  shareSaved: 'Obrázok uložený',
  playAgain: 'Odveta',
  backHome: 'Domov',

  // Zvuk
  soundOn: 'Zapnúť zvuk',
  soundOff: 'Vypnúť zvuk',

  // Sieť
  reconnecting: 'Obnovujem spojenie…',
  playerDisconnected: (p: string) => `${p} stráca spojenie`,
  playerReconnected: (p: string) => `${p} je späť`,
  playerPaused: (p: string) => `${p} si dáva pauzu`,
  playerResumed: (p: string) => `${p} sa vracia do hry`,
  playerJoined: (p: string) => `${p} sa pripája k hre`,
  playerLeft: (p: string) => `${p} opúšťa hru`,
  roomClosed: 'Hra bola ukončená.',
  roomClosedKicked: 'Vyhodili ťa z hry.',
  roomClosedExpired: 'Hra vypršala.',

  // Pozvánky
  inviteMessage: (code: string, url: string) =>
    `Poď si s nami zahrať Rikiki! 🃏\nKód hry: ${code}\nPripoj sa tu: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Zdieľať',

  // Účet
  saveAccount: 'Uložiť môj postup',
  saveAccountHint: 'Pošleme ti odkaz e-mailom — žiadne heslo si nemusíš pamätať',
  emailPlaceholder: 'tvoj@email.sk',
  sendMagicLink: 'Poslať mi odkaz',
  magicLinkSent: 'E-mail odoslaný! Otvor odkaz a potvrď.',
  accountSaved: 'Postup uložený',
  verifying: 'Overujem…',
  verified: 'Účet potvrdený! Tvoj postup je uložený.',
  verifyFailed: 'Odkaz je neplatný alebo vypršal. Vyžiadaj si nový vo svojom profile.',

  privacyPolicy: 'Súkromie',
  deleteAccount: 'Zmazať môj účet',
  deleteAccountHint: 'Zmaže tvoj profil, históriu a skupiny.',
  deleteAccountWarning: 'Tvoja prezývka, hry, štatistiky a skupiny budú zmazané. Túto akciu nemožno vrátiť späť.',
  deleteAccountAction: 'Áno, zmazať všetko',
  deleteAccountDone: 'Účet bol zmazaný.',
  cancel: 'Zrušiť',
  botTag: 'robot',
  emotes: 'Reakcie',
  phrases: 'Správy',
  phraseTexts: {
    nice: 'Pekne zahraté!',
    oops: 'Ajaj…',
    yourTurn: 'Si na rade!',
    hurry: 'Čakáme 🙂',
    watchTrump: 'Pozor na tromf',
    mine: 'Tento je môj',
    sorry: 'Prepáč!',
    brb: 'Hneď som späť',
    goodGame: 'Dobrá hra!',
    again: 'Ešte jednu?',
  },
  pauseGame: 'Dať si pauzu',
  resumePlay: 'Som späť',
  pausedTag: 'pauza',
  pauseHint: 'Počas pauzy drží tvoje miesto robot.',
  close: 'Zavrieť',
  leaveGame: 'Opustiť hru',
  leaveGameWarning:
    'Hra pokračuje bez teba a tvoje body z tejto hry prepadnú.',
  leaveGameAction: 'Áno, opustiť',
  takePhoto: 'Odfotiť sa',
  removePhoto: 'Odstrániť fotku',
  photoError: 'Fotka je príliš veľká alebo nečitateľná.',
  reportPlayer: 'Nahlásiť',
  reportDone: 'Fotka skrytá a nahlásená.',

  // Štatistiky a história
  stats: 'Štatistiky',
  gamesPlayed: 'hier',
  gamesWon: 'výhier',
  bestRound: 'najlepšie kolo',
  noHistory: 'Zatiaľ žiadna dohraná hra.',
  historyTitle: 'Moje posledné hry',
  wonBadge: 'Výhra',
  lostBadge: 'Prehra',
  playersCount: (n: number) => plural(n, '1 hráč', `${n} hráči`, `${n} hráčov`),

  // Skupiny priateľov
  groups: 'Moje skupiny',
  groupsTitle: 'Moje skupiny',
  groupsSubtitle: 'Priebežné poradie pre tých, čo hrávajú stále spolu',
  noGroups: 'Zatiaľ nie si v žiadnej skupine.',
  createGroup: 'Vytvoriť skupinu',
  createGroupCta: 'Vytvoriť skupinu',
  groupNamePlaceholder: 'Utorková partia',
  groupNameLabel: 'Názov skupiny',
  groupNameTooShort: 'Názov musí mať 2 až 30 znakov.',
  joinGroup: 'Pripojiť sa k skupine',
  joinGroupCta: 'Pripojiť sa',
  groupCodeLabel: 'Kód skupiny',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 písmen, bez I, L a O',
  groupCode: 'Kód skupiny',
  groupShareHint: 'Zdieľaj tento kód, nech sa priatelia pridajú do skupiny',
  copyGroupCode: 'Kopírovať kód',
  groupCodeCopied: 'Kód skopírovaný!',
  groupMembers: (n: number) => plural(n, '1 člen', `${n} členovia`, `${n} členov`),
  groupGames: (n: number) =>
    n === 0 ? 'žiadna hra' : plural(n, '1 hra', `${n} hry`, `${n} hier`),
  groupRanking: 'Celkové poradie',
  groupRecentGames: 'Posledné hry skupiny',
  groupNoGames: 'V skupine sa zatiaľ nehralo.',
  groupNoGamesHint: 'Zahraj si s touto skupinou — výsledky sa objavia tu.',
  groupPlay: 'Hrať s touto skupinou',
  groupOwner: 'Zakladateľ',
  groupLeave: 'Opustiť skupinu',
  groupLeaveConfirm: 'Opustiť túto skupinu? Tvoje odohrané hry v poradí ostanú.',
  groupDelete: 'Zmazať skupinu',
  groupDeleteConfirm: 'Zmazať túto skupinu aj celé jej poradie? Nedá sa to vrátiť.',
  groupOwnerCannotLeave: 'Toto je tvoja skupina — môžeš ju len zmazať.',
  groupNotFound: 'Skupina sa nenašla.',
  groupJoined: (name: string) => `Si v skupine „${name}“!`,
  groupCreated: (name: string) => `Skupina „${name}“ vytvorená!`,
  groupAttached: (name: string) => `Hra priradená k skupine „${name}“`,
  groupTotalPoints: 'bodov',
  groupRankHeader: '#',
  groupPlayerHeader: 'Hráč',
  groupPointsHeader: 'B',
  groupPlayedHeader: 'H',
  groupWonHeader: 'V',

  // Pravidlá hry
  rules: 'Pravidlá hry',
  rulesTitle: 'Ako sa hrá',
  demoTitle: 'Hra za minútu',
  demoPlay: 'Prehrať ukážku',
  demoPause: 'Pozastaviť',
  demoReplay: 'Prehrať znova',
  demoPrev: 'Predchádzajúci krok',
  demoNext: 'Ďalší krok',
  demoDeal: 'Každý dostane svoje karty. Posledná otočená určuje tromf: jeho farba bije všetky ostatné.',
  demoBid: 'Každý hlási, koľko zdvihov chce urobiť. Rozdávajúci hlási posledný a nesmie nechať súčet vyjsť presne.',
  demoFollow: 'Vynesenú farbu treba priznať, ak ju máte. Až inak hráte, čo chcete.',
  demoTrump: 'Tromf, aj ten najnižší, berie zdvih na vynesenej farbe.',
  demoScore: 'Splnený záväzok: 10 bodov plus 2 za zdvih. Nesplnený: 2 body dole za každý zdvih rozdielu.',
  rulesSubtitle: 'Rikiki za 2 minúty',
  rulesGoalTitle: 'O čo ide',
  rulesGoalText:
    'Pred každým kolom nahlásiš, koľko zdvihov podľa seba získaš. Celé umenie je trafiť sa presne: ani viac, ani menej. Veľa zdvihov je na nič, ak bolo hlásenie nízke.',
  rulesDealTitle: 'Rozdávanie',
  rulesDealText:
    'Hra má viacero kôl. V prvom dostane každý len jednu kartu, potom dve, potom tri… a potom sa zase klesá. V každom kole majú všetci rovnaký počet kariet.',
  rulesTrumpText: 'Jedna karta sa otočí: jej farba je tromfom kola.',
  rulesBidTitle: 'Hlásenie',
  rulesBidText:
    'Postupne každý nahlási počet zdvihov, o ktoré sa usiluje — od 0 po počet kariet v ruke. Rozhoduješ sa podľa svojich kariet a tromfu.',
  rulesHookTitle: 'Pravidlo háčika',
  rulesHookText:
    'Posledný hlásiaci (rozdávajúci) si nesmie vybrať číslo, po ktorom by súčet hlásení presne zodpovedal počtu zdvihov v kole. Výsledok: niekto bude určite sklamaný. Zakázané číslo je automaticky prečiarknuté.',
  rulesPlayTitle: 'Hra o zdvihy',
  rulesPlayText:
    'Vynáša hráč naľavo od rozdávajúceho. Každý priloží jednu kartu a najsilnejšia berie zdvih. Víťaz vynáša do ďalšieho zdvihu.',
  rulesFollowSuit: 'Musíš priznať farbu, ak ju máš.',
  rulesNoSuit: 'Inak hráš, čo chceš: prebiješ tromfom alebo odhodíš.',
  rulesWinTrick: 'Vyhráva najvyšší tromf; bez tromfu najvyššia karta vynesenej farby.',
  rulesScoreTitle: 'Body',
  rulesScoreOk: 'Záväzok splnený',
  rulesScoreOkExample: 'Hlásenie 3, získané 3 → 16 bodov',
  rulesScoreKo: 'Záväzok nesplnený',
  rulesScoreKoExample: 'Hlásenie 3, získaný 1 → −4 body',
  rulesScoreZero:
    'Nahlásiť 0 a nezískať ani jeden zdvih dá 10 bodov: veľmi výnosný záväzok.',
  rulesScoreVariants: 'Hostiteľ môže v miestnosti zvoliť iné bodovanie:',
  rulesEndTitle: 'Koniec hry',
  rulesEndText:
    'Keď sa odohrajú všetky kolá, vyhráva hráč s najvyšším súčtom bodov. Tabuľku skóre si môžeš počas hry kedykoľvek otvoriť.',
  rulesTip:
    'Tip: v krátkych kolách stačí na zdvih zvyčajne eso alebo vysoký tromf. V dlhých si dávaj pozor na dlhé farby.',
  rulesGotIt: 'Rozumiem',

  // Upozornenia „si na ťahu“
  notificationsTitle: 'Upozorniť ma, keď budem na ťahu',
  notificationsHint:
    'Odlož telefón: pošleme ti upozornenie, len čo na teba stôl čaká. Ideálne na hry roztiahnuté cez celý deň.',
  notificationsEnable: 'Zapnúť upozornenia',
  notificationsOn: 'Upozornenia zapnuté',
  notificationsOff: 'Upozornenia vypnuté',
  notificationsChecking: 'Overujem…',
  notificationsUnsupported: 'Tvoj prehliadač upozornenia nepodporuje.',
  notificationsNeedsInstall:
    'Na iPhone a iPade najprv pridaj Rikiki na plochu (Zdieľať → „Pridať na plochu“) a potom sa sem vráť.',
  notificationsDenied:
    'Upozornenia sú pre túto stránku zablokované. Povoľ ich znova v nastaveniach prehliadača.',
  notificationsNoServiceWorker:
    'Upozornenia tu nie sú dostupné (nainštaluj aplikáciu alebo obnov stránku).',
  notificationsServerOff: 'Upozornenia nie sú na serveri nastavené.',
  notificationsError: 'Upozornenia sa nepodarilo zmeniť.',

  updateAvailable: 'Nová verzia',
  updateReload: 'Aktualizovať',
  version: (v: string) => `verzia ${v}`,

  // Prístupnosť
  accessibility: 'Prístupnosť',
  colorblindMode: 'Odlíšené farby',
  colorblindHint:
    'Vlastný odtieň pre každú farbu, aby si ♥ ♦ ♠ ♣ rozlíšil aj bez červenej',
  // Druhý pád, aby « eso sŕdc » alebo « kráľ pikov » dávalo zmysel
  suitNames: { S: 'pikov', H: 'sŕdc', D: 'kár', C: 'krížov' } as Record<string, string>,
  rankNames: { 11: 'dolník', 12: 'dáma', 13: 'kráľ', 14: 'eso' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) =>
    `Tvoje karty: ${plural(n, '1 karta', `${n} karty`, `${n} kariet`)}`,

  language: 'Jazyk',
  languageHint: 'Vyber jazyk aplikácie',

  loading: 'Načítavam…',
  errorTitle: 'Ejha',
  copyright: '© 2026 Clixite SRL',
};

export default sk;
