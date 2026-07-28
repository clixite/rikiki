import type { Messages } from '../types';

/**
 * Pluriel tchèque : trois formes.
 *   1        → nominatif singulier (1 karta)
 *   2-4      → nominatif pluriel   (3 karty)
 *   0, 5+    → génitif pluriel     (7 karet, 21 karet, 22 karet)
 * Contrairement au polonais, le tchèque ne repart pas à « few » à 22.
 */
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

const zdvihy = (n: number): string =>
  plural(n, '1 zdvih', `${n} zdvihy`, `${n} zdvihů`);

export const cs: Messages = {
  appName: 'Rikiki',
  tagline: 'Zdvihová hra s přáteli, každý na svém telefonu',

  // Úvod
  createGame: 'Založit hru',
  joinGame: 'Připojit se ke hře',
  resumeGame: 'Pokračovat ve hře',
  myGames: 'Moje hry',

  // Profil
  yourPseudo: 'Tvoje přezdívka',
  pickAvatar: 'Vyber si avatara',
  letsGo: 'Jdeme na to!',
  save: 'Uložit',
  editProfile: 'Můj profil',
  changeAvatar: 'Změnit avatara',

  // Připojení
  enterCode: 'Kód hry',
  join: 'Připojit se',
  gameCode: 'Kód hry',
  copyLink: 'Kopírovat odkaz',
  copied: 'Odkaz zkopírován!',

  // Čekárna
  invite: 'Pozvat přátele',
  players: 'Hráči',
  host: 'Hostitel',
  you: 'ty',
  waitingForHost: 'Čekáme, až hostitel spustí hru…',
  needPlayers: (missing: number) =>
    plural(
      missing,
      'Ještě 1 hráč a můžeme začít',
      `Ještě ${missing} hráči a můžeme začít`,
      `Ještě ${missing} hráčů a můžeme začít`,
    ),
  startGame: 'Spustit hru',
  leave: 'Odejít',
  kick: 'Vyhodit',
  addBot: 'Přidat robota',
  addBotHint: 'Doplň stůl automatickým hráčem',
  botsFull: 'Stůl je plný',
  removeBot: 'Odebrat robota',

  // Formát hry (délka)
  gameFormat: 'Formát hry',
  gameFormatHint: 'Vyber délku před spuštěním',
  formatNames: {
    blitz: 'Bleskovka',
    normal: 'Normální',
    climb: 'Stoupavá',
  },
  formatDescriptions: {
    blitz: 'Nahoru a dolů až do 5 karet',
    normal: 'Celý vzestup i sestup',
    climb: 'Jen nahoru, bez sestupu',
  },
  formatRounds: (n: number) => plural(n, '1 kolo', `${n} kola`, `${n} kol`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formát určuje hostitel',

  // Stůl
  round: 'Kolo',
  cards: (n: number) => plural(n, '1 karta', `${n} karty`, `${n} karet`),
  trump: 'Trumf',
  noTrump: 'Bez trumfů',
  dealer: 'Rozdávající',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Kolik zdvihů?',
  bidsTotal: (sum: number, cards: number) => `Hlášky: ${sum} / ${zdvihy(cards)}`,
  hookForbidden: (n: number) => `Zakázáno: součet by byl přesně ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} je zakázáno: součet hlášek se nesmí rovnat ${cards} (pravidlo háčku).`,
  bid: 'Hláška',
  tricks: 'Zdvihy',

  // Přehled hlášek kola
  bidsAnnounced: 'Nahlášeno',
  bidsPending: (announced: number, cards: number) => `${announced} z ${cards} — hlásí se`,
  bidsBalanced: (cards: number) => `Součet sedí: ${zdvihy(cards)}`,
  bidsOver: (n: number) =>
    plural(
      n,
      'O 1 zdvih víc: někdo to schytá',
      `O ${n} zdvihy víc: někdo to schytá`,
      `O ${n} zdvihů víc: někdo to schytá`,
    ),
  bidsUnder: (n: number) =>
    plural(
      n,
      'Zbývá 1 zdvih navíc k posbírání',
      `Zbývají ${n} zdvihy navíc k posbírání`,
      `Zbývá ${n} zdvihů navíc k posbírání`,
    ),
  noBidYet: 'Zatím bez hlášky',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} zdvihů`,
  yourTurn: 'Jsi na tahu',
  turnOf: (p: string) => `Na tahu: ${p}`,
  trickWonBy: (p: string) => `${p} bere zdvih`,
  scoreboard: 'Skóre',
  total: 'Celkem',

  // Shrnutí
  roundRecap: 'Konec kola',
  contractKept: 'Závazek splněn',
  contractMissed: 'Závazek nesplněn',
  contract: 'Závazek',
  points: 'Body',
  nextRound: 'Další kolo',
  seeResults: 'Zobrazit výsledky',
  waitingNextRound: 'Hostitel spustí další kolo…',

  // Konec hry
  gameOver: 'Konec hry',
  shareResult: 'Sdílet výsledek',
  shareTitle: 'Partie Rikiki skončila 🃏',
  shareSaved: 'Obrázek uložen',
  playAgain: 'Odveta',
  backHome: 'Domů',

  // Zvuk
  soundOn: 'Zapnout zvuk',
  soundOff: 'Vypnout zvuk',

  // Síť
  reconnecting: 'Obnovuji spojení…',
  playerDisconnected: (p: string) => `${p} ztrácí spojení`,
  playerReconnected: (p: string) => `${p} je zpátky`,
  playerJoined: (p: string) => `${p} se připojuje ke hře`,
  playerLeft: (p: string) => `${p} opouští hru`,
  roomClosed: 'Hra byla ukončena.',
  roomClosedKicked: 'Vyhodili tě ze hry.',
  roomClosedExpired: 'Hra vypršela.',

  // Pozvánky
  inviteMessage: (code: string, url: string) =>
    `Pojď s námi hrát Rikiki! 🃏\nKód hry: ${code}\nPřipoj se tady: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Sdílet',

  // Účet
  saveAccount: 'Uložit můj postup',
  saveAccountHint: 'Pošleme ti odkaz e-mailem — žádné heslo si nemusíš pamatovat',
  emailPlaceholder: 'tvuj@email.cz',
  sendMagicLink: 'Poslat mi odkaz',
  magicLinkSent: 'E-mail odeslán! Otevři odkaz a potvrď.',
  accountSaved: 'Postup uložen',
  verifying: 'Ověřuji…',
  verified: 'Účet potvrzen! Tvůj postup je uložený.',
  verifyFailed: 'Odkaz je neplatný nebo vypršel. Vyžádej si nový ve svém profilu.',

  privacyPolicy: 'Soukromí',
  deleteAccount: 'Smazat můj účet',
  deleteAccountHint: 'Smaže tvůj profil, historii a skupiny.',
  deleteAccountWarning: 'Tvoje přezdívka, hry, statistiky a skupiny budou smazány. Tuto akci nelze vrátit zpět.',
  deleteAccountAction: 'Ano, smazat vše',
  deleteAccountDone: 'Účet byl smazán.',
  cancel: 'Zrušit',
  botTag: 'robot',
  emotes: 'Reakce',
  close: 'Zavřít',
  leaveGame: 'Opustit hru',
  leaveGameWarning:
    'Hra pokračuje bez tebe a tvoje body z této hry propadnou.',
  leaveGameAction: 'Ano, opustit',
  takePhoto: 'Vyfotit se',
  removePhoto: 'Odebrat fotku',
  photoError: 'Fotka je příliš velká nebo nečitelná.',
  reportPlayer: 'Nahlásit',
  reportDone: 'Fotka skryta a nahlášena.',

  // Statistiky a historie
  stats: 'Statistiky',
  gamesPlayed: 'her',
  gamesWon: 'výher',
  bestRound: 'nejlepší kolo',
  noHistory: 'Zatím žádná dohraná hra.',
  historyTitle: 'Moje poslední hry',
  wonBadge: 'Výhra',
  lostBadge: 'Prohra',
  playersCount: (n: number) => plural(n, '1 hráč', `${n} hráči`, `${n} hráčů`),

  // Skupiny přátel
  groups: 'Moje skupiny',
  groupsTitle: 'Moje skupiny',
  groupsSubtitle: 'Průběžné pořadí pro ty, kdo hrají pořád spolu',
  noGroups: 'Zatím nejsi v žádné skupině.',
  createGroup: 'Vytvořit skupinu',
  createGroupCta: 'Vytvořit skupinu',
  groupNamePlaceholder: 'Úterní parta',
  groupNameLabel: 'Název skupiny',
  groupNameTooShort: 'Název musí mít 2 až 30 znaků.',
  joinGroup: 'Připojit se ke skupině',
  joinGroupCta: 'Připojit se',
  groupCodeLabel: 'Kód skupiny',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 písmen, bez I, L a O',
  groupCode: 'Kód skupiny',
  groupShareHint: 'Sdílej tenhle kód, ať se přátelé přidají do skupiny',
  copyGroupCode: 'Kopírovat kód',
  groupCodeCopied: 'Kód zkopírován!',
  groupMembers: (n: number) => plural(n, '1 člen', `${n} členové`, `${n} členů`),
  groupGames: (n: number) =>
    n === 0 ? 'žádná hra' : plural(n, '1 hra', `${n} hry`, `${n} her`),
  groupRanking: 'Celkové pořadí',
  groupRecentGames: 'Poslední hry skupiny',
  groupNoGames: 'Ve skupině se zatím nehrálo.',
  groupNoGamesHint: 'Zahraj si s touhle skupinou — výsledky se objeví tady.',
  groupPlay: 'Hrát s touhle skupinou',
  groupOwner: 'Zakladatel',
  groupLeave: 'Opustit skupinu',
  groupLeaveConfirm: 'Opustit tuhle skupinu? Tvoje odehrané hry v pořadí zůstanou.',
  groupDelete: 'Smazat skupinu',
  groupDeleteConfirm: 'Smazat tuhle skupinu i celé její pořadí? Nejde to vrátit.',
  groupOwnerCannotLeave: 'Tohle je tvoje skupina — můžeš ji jen smazat.',
  groupNotFound: 'Skupina nenalezena.',
  groupJoined: (name: string) => `Jsi ve skupině „${name}“!`,
  groupCreated: (name: string) => `Skupina „${name}“ vytvořena!`,
  groupAttached: (name: string) => `Hra přiřazena ke skupině „${name}“`,
  groupTotalPoints: 'bodů',
  groupRankHeader: '#',
  groupPlayerHeader: 'Hráč',
  groupPointsHeader: 'B',
  groupPlayedHeader: 'H',
  groupWonHeader: 'V',

  // Pravidla hry
  rules: 'Pravidla hry',
  rulesTitle: 'Jak se hraje',
  rulesSubtitle: 'Rikiki za 2 minuty',
  rulesGoalTitle: 'O co jde',
  rulesGoalText:
    'Před každým kolem nahlásíš, kolik zdvihů podle sebe uděláš. Celé umění je trefit se přesně: ani víc, ani míň. Spousta zdvihů je k ničemu, když byla hláška nízká.',
  rulesDealTitle: 'Rozdávání',
  rulesDealText:
    'Hra má několik kol. V prvním dostane každý jen jednu kartu, pak dvě, pak tři… a potom se zase klesá. V každém kole mají všichni stejný počet karet.',
  rulesTrumpText: 'Jedna karta se otočí: její barva je trumfem kola.',
  rulesBidTitle: 'Hláška',
  rulesBidText:
    'Postupně každý nahlásí počet zdvihů, o které usiluje — od 0 po počet karet v ruce. Rozhoduješ se podle svých karet a trumfu.',
  rulesHookTitle: 'Pravidlo háčku',
  rulesHookText:
    'Poslední hlásící (rozdávající) si nesmí vybrat číslo, po kterém by součet hlášek přesně odpovídal počtu zdvihů v kole. Výsledek: někdo bude určitě zklamaný. Zakázané číslo je automaticky přeškrtnuté.',
  rulesPlayTitle: 'Hra o zdvihy',
  rulesPlayText:
    'Vynáší hráč po levici rozdávajícího. Každý přiloží jednu kartu a nejsilnější bere zdvih. Vítěz vynáší do dalšího zdvihu.',
  rulesFollowSuit: 'Musíš přiznat barvu, pokud ji máš.',
  rulesNoSuit: 'Jinak hraješ, co chceš: přebiješ trumfem, nebo odhodíš.',
  rulesWinTrick: 'Vyhrává nejvyšší trumf; bez trumfu nejvyšší karta vynesené barvy.',
  rulesScoreTitle: 'Body',
  rulesScoreOk: 'Závazek splněn',
  rulesScoreOkExample: 'Hláška 3, uděláno 3 → 16 bodů',
  rulesScoreKo: 'Závazek nesplněn',
  rulesScoreKoExample: 'Hláška 3, uděláno 1 → −4 body',
  rulesScoreZero:
    'Nahlásit 0 a žádný zdvih neudělat dá 10 bodů: hodně výnosný závazek.',
  rulesEndTitle: 'Konec hry',
  rulesEndText:
    'Až se odehrají všechna kola, vyhrává hráč s nejvyšším součtem bodů. Tabulku skóre si můžeš během hry kdykoli otevřít.',
  rulesTip:
    'Tip: v krátkých kolech stačí na zdvih obvykle eso nebo vysoký trumf. V dlouhých si dej pozor na dlouhé barvy.',
  rulesGotIt: 'Rozumím',

  // Upozornění „jsi na tahu“
  notificationsTitle: 'Upozornit mě, až budu na tahu',
  notificationsHint:
    'Odlož telefon: pošleme ti upozornění, jakmile na tebe stůl čeká. Ideální na hry roztažené přes celý den.',
  notificationsEnable: 'Zapnout upozornění',
  notificationsOn: 'Upozornění zapnuta',
  notificationsOff: 'Upozornění vypnuta',
  notificationsChecking: 'Ověřuji…',
  notificationsUnsupported: 'Tvůj prohlížeč upozornění nepodporuje.',
  notificationsNeedsInstall:
    'Na iPhonu a iPadu nejdřív přidej Rikiki na plochu (Sdílet → „Přidat na plochu“) a pak se sem vrať.',
  notificationsDenied:
    'Upozornění jsou pro tenhle web zablokovaná. Povol je znovu v nastavení prohlížeče.',
  notificationsNoServiceWorker:
    'Upozornění tu nejsou dostupná (nainstaluj aplikaci nebo obnov stránku).',
  notificationsServerOff: 'Upozornění nejsou na serveru nastavená.',
  notificationsError: 'Upozornění se nepodařilo změnit.',

  updateAvailable: 'Nová verze',
  updateReload: 'Aktualizovat',
  version: (v: string) => `verze ${v}`,

  // Přístupnost
  accessibility: 'Přístupnost',
  colorblindMode: 'Odlišené barvy',
  colorblindHint:
    'Vlastní odstín pro každou barvu, ať ♥ ♦ ♠ ♣ rozlišíš i bez spoléhání na červenou',
  // Druhý pád, aby « eso srdcí » nebo « král piků » dávalo smysl
  suitNames: { S: 'piků', H: 'srdcí', D: 'kár', C: 'křížů' } as Record<string, string>,
  rankNames: { 11: 'kluk', 12: 'dáma', 13: 'král', 14: 'eso' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) =>
    `Tvoje karty: ${plural(n, '1 karta', `${n} karty`, `${n} karet`)}`,

  language: 'Jazyk',
  languageHint: 'Vyber jazyk aplikace',

  loading: 'Načítám…',
  errorTitle: 'Jejda',
  copyright: '© 2026 Clixite SRL',
};

export default cs;
