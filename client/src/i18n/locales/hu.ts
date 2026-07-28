import type { Messages } from '../types';

/**
 * Le hongrois n'accorde pas le nom après un nombre : « 1 lap », « 5 lap ».
 * Aucune fonction de pluriel n'est donc nécessaire — un seul gabarit suffit
 * partout, ce qui garde les libellés courts sur mobile.
 */

export const hu: Messages = {
  appName: 'Rikiki',
  tagline: 'Ütésjáték barátokkal, mindenki a saját telefonján',

  // Kezdőképernyő
  createGame: 'Új játék',
  joinGame: 'Csatlakozás játékhoz',
  resumeGame: 'Játék folytatása',
  myGames: 'Játékaim',

  // Profil
  yourPseudo: 'A beceneved',
  pickAvatar: 'Válassz avatart',
  letsGo: 'Mehet!',
  save: 'Mentés',
  editProfile: 'Profilom',
  changeAvatar: 'Avatar cseréje',

  // Csatlakozás
  enterCode: 'Játék kódja',
  join: 'Csatlakozás',
  gameCode: 'Játék kódja',
  copyLink: 'Link másolása',
  copied: 'Link kimásolva!',

  // Váró
  invite: 'Barátok meghívása',
  players: 'Játékosok',
  host: 'Házigazda',
  you: 'te',
  waitingForHost: 'Várunk, míg a házigazda elindítja…',
  needPlayers: (missing: number) => `Még ${missing} játékos kell a kezdéshez`,
  startGame: 'Játék indítása',
  leave: 'Kilépés',
  kick: 'Kirúgás',
  addBot: 'Robot hozzáadása',
  addBotHint: 'Töltsd fel az asztalt automata játékossal',
  botsFull: 'Az asztal megtelt',
  removeBot: 'Robot eltávolítása',

  // Játék hossza
  gameFormat: 'Játék hossza',
  gameFormatHint: 'Indítás előtt válaszd ki a hosszát',
  formatNames: {
    blitz: 'Villám',
    normal: 'Normál',
    climb: 'Emelkedő',
  },
  formatDescriptions: {
    blitz: 'Fel és le, 5 lapig',
    normal: 'Teljes emelkedés, majd ereszkedés',
    climb: 'Csak felfelé, ereszkedés nélkül',
  },
  formatRounds: (n: number) => `${n} kör`,
  formatDuration: (minutes: number) => `≈ ${minutes} perc`,
  formatLocked: 'A hosszt a házigazda választja',

  // Barème de score
  scoringVariant: 'Pontozás',
  scoringHint: 'Hogyan számoljuk a pontokat',
  scoringNames: {
    classic: 'Klasszikus',
    gentle: 'Engedékeny',
    always: 'Az ütések mindig számítanak',
  },
  scoringDescriptions: {
    classic: 'Bemondás teljesítve: 10 + 2 ütésenként. Elhibázva: −2 minden ütésnyi eltérésért.',
    gentle: 'Bemondás teljesítve: 10 + 1 ütésenként. Elhibázva: 0, nincs büntetés.',
    always: 'Az ütéseid mindig pontot érnek, +10 ha a bemondás sikerül.',
  },
  scoringLocked: 'A pontozást a házigazda választja',

  // Asztal
  round: 'Kör',
  cards: (n: number) => `${n} lap`,
  trump: 'Adu',
  noTrump: 'Adu nélkül',
  dealer: 'Osztó',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Hány ütés?',
  bidsTotal: (sum: number, cards: number) => `Bemondva: ${sum} / ${cards} ütés`,
  hookForbidden: (n: number) => `Tiltott: az összeg pontosan ${n} lenne`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} tiltott: a bemondások összege nem lehet pontosan ${cards} (horogszabály).`,
  bid: 'Bemondás',
  tricks: 'Ütések',

  // A kör bemondásainak összesítése
  bidsAnnounced: 'Bemondva',
  bidsPending: (announced: number, cards: number) =>
    `${announced} / ${cards} — bemondás folyamatban`,
  bidsBalanced: (cards: number) => `Az összeg pontos: ${cards} ütés bemondva`,
  bidsOver: (n: number) => `${n} ütéssel több: valaki bukni fog`,
  bidsUnder: (n: number) => `${n} ütés gazdátlanul marad`,
  noBidYet: 'Még nincs bemondás',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} ütés`,
  yourTurn: 'Te jössz',
  turnOf: (p: string) => `${p} jön`,
  trickWonBy: (p: string) => `${p} viszi az ütést`,
  scoreboard: 'Pontok',
  total: 'Összesen',

  // Összegzés
  roundRecap: 'Kör vége',
  contractKept: 'Bemondás teljesítve',
  contractMissed: 'Bemondás bukva',
  contract: 'Bemondás',
  points: 'Pont',
  nextRound: 'Következő kör',
  seeResults: 'Eredmények',
  waitingNextRound: 'A házigazda indítja a következő kört…',

  // Játék vége
  gameOver: 'Vége a játéknak',
  shareResult: 'Eredmény megosztása',
  shareTitle: 'Rikiki játszma vége 🃏',
  shareSaved: 'Kép elmentve',
  playAgain: 'Visszavágó',
  backHome: 'Főoldal',

  // Hang
  soundOn: 'Hang bekapcsolása',
  soundOff: 'Némítás',

  // Hálózat
  reconnecting: 'Újracsatlakozás…',
  playerDisconnected: (p: string) => `${p} kapcsolata megszakadt`,
  playerReconnected: (p: string) => `${p} visszatért`,
  playerJoined: (p: string) => `${p} csatlakozott a játékhoz`,
  playerLeft: (p: string) => `${p} kilépett a játékból`,
  roomClosed: 'A játék lezárult.',
  roomClosedKicked: 'Kikerültél a játékból.',
  roomClosedExpired: 'A játék lejárt.',

  // Meghívók
  inviteMessage: (code: string, url: string) =>
    `Gyere, játssz velünk Rikikit! 🃏\nJáték kódja: ${code}\nCsatlakozz itt: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Megosztás',

  // Fiók
  saveAccount: 'Haladásom mentése',
  saveAccountHint: 'Linket küldünk e-mailben — nincs megjegyzendő jelszó',
  emailPlaceholder: 'te@email.hu',
  sendMagicLink: 'Kérem a linket',
  magicLinkSent: 'E-mail elküldve! Nyisd meg a linket a megerősítéshez.',
  accountSaved: 'Haladás elmentve',
  verifying: 'Ellenőrzés…',
  verified: 'Fiók megerősítve! A haladásod mentve van.',
  verifyFailed: 'Érvénytelen vagy lejárt link. Kérj újat a profilodból.',

  privacyPolicy: 'Adatvédelem',
  deleteAccount: 'Fiókom törlése',
  deleteAccountHint: 'Törli a profilodat, az előzményeidet és a csoportjaidat.',
  deleteAccountWarning: 'A beceneved, a játszmáid, a statisztikáid és a csoportjaid törlődnek. A művelet nem vonható vissza.',
  deleteAccountAction: 'Igen, törlök mindent',
  deleteAccountDone: 'A fiók törölve.',
  cancel: 'Mégse',
  botTag: 'bot',
  emotes: 'Reakciók',
  close: 'Bezárás',
  leaveGame: 'Kilépés a játszmából',
  leaveGameWarning:
    'A játszma nélküled folytatódik, és a játszmában szerzett pontjaid elvesznek.',
  leaveGameAction: 'Igen, kilépek',
  takePhoto: 'Fénykép készítése',
  removePhoto: 'Fénykép eltávolítása',
  photoError: 'A fénykép túl nagy vagy olvashatatlan.',
  reportPlayer: 'Jelentés',
  reportDone: 'A fénykép elrejtve és jelentve.',

  // Statisztika és előzmények
  stats: 'Statisztika',
  gamesPlayed: 'játék',
  gamesWon: 'győzelem',
  bestRound: 'legjobb kör',
  noHistory: 'Még nincs befejezett játékod.',
  historyTitle: 'Legutóbbi játékaim',
  wonBadge: 'Nyert',
  lostBadge: 'Vesztett',
  playersCount: (n: number) => `${n} játékos`,

  // Baráti csoportok
  groups: 'Csoportjaim',
  groupsTitle: 'Csoportjaim',
  groupsSubtitle: 'Összesített ranglista azoknak, akik mindig együtt játszanak',
  noGroups: 'Még egyetlen csoportnak sem vagy tagja.',
  createGroup: 'Csoport létrehozása',
  createGroupCta: 'Csoport létrehozása',
  groupNamePlaceholder: 'Keddi társaság',
  groupNameLabel: 'Csoport neve',
  groupNameTooShort: 'A névnek 2 és 30 karakter között kell lennie.',
  joinGroup: 'Csatlakozás csoporthoz',
  joinGroupCta: 'Csatlakozás',
  groupCodeLabel: 'Csoport kódja',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 betű, I, L és O nélkül',
  groupCode: 'Csoport kódja',
  groupShareHint: 'Oszd meg ezt a kódot, hogy a barátaid csatlakozhassanak',
  copyGroupCode: 'Kód másolása',
  groupCodeCopied: 'Kód kimásolva!',
  groupMembers: (n: number) => `${n} tag`,
  groupGames: (n: number) => (n > 0 ? `${n} játék` : 'nincs játék'),
  groupRanking: 'Összesített ranglista',
  groupRecentGames: 'A csoport legutóbbi játékai',
  groupNoGames: 'A csoportban még nem játszottatok.',
  groupNoGamesHint: 'Indíts játékot ezzel a csoporttal — az eredmények itt jelennek meg.',
  groupPlay: 'Játék ezzel a csoporttal',
  groupOwner: 'Alapító',
  groupLeave: 'Kilépés a csoportból',
  groupLeaveConfirm: 'Kilépsz a csoportból? A korábbi játékaid a ranglistán maradnak.',
  groupDelete: 'Csoport törlése',
  groupDeleteConfirm: 'Törlöd a csoportot és a teljes ranglistáját? Ez végleges.',
  groupOwnerCannotLeave: 'Te hoztad létre ezt a csoportot: csak törölni tudod.',
  groupNotFound: 'A csoport nem található.',
  groupJoined: (name: string) => `Csatlakoztál a(z) „${name}” csoporthoz!`,
  groupCreated: (name: string) => `„${name}” csoport létrehozva!`,
  groupAttached: (name: string) => `A játék a(z) „${name}” csoporthoz került`,
  groupTotalPoints: 'pont',
  groupRankHeader: '#',
  groupPlayerHeader: 'Játékos',
  groupPointsHeader: 'P',
  groupPlayedHeader: 'J',
  groupWonHeader: 'GY',

  // Játékszabályok
  rules: 'Játékszabályok',
  rulesTitle: 'Hogyan kell játszani',
  rulesSubtitle: 'A Rikiki 2 perc alatt',
  rulesGoalTitle: 'A lényeg',
  rulesGoalText:
    'Minden kör előtt bemondod, hány ütést gondolsz megnyerni. A tét az, hogy pontosan eltaláld: se többet, se kevesebbet. Sok ütés semmit sem ér, ha keveset mondtál be.',
  rulesDealTitle: 'Az osztás',
  rulesDealText:
    'A parti több körből áll. Az elsőben mindenki csak egy lapot kap, aztán kettőt, aztán hármat… majd visszafelé is. Minden körben mindenki ugyanannyi lapot kap.',
  rulesTrumpText: 'Egy lapot felfordítunk: a színe lesz a kör aduja.',
  rulesBidTitle: 'A bemondás',
  rulesBidText:
    'Sorban mindenki bemondja a megcélzott ütésszámot — 0-tól a kézben lévő lapok számáig. A saját lapjaid és az adu alapján döntesz.',
  rulesHookTitle: 'A horogszabály',
  rulesHookText:
    'Az utolsóként bemondó (az osztó) nem választhatja azt a számot, amellyel a bemondások összege pontosan kiadná a kör ütéseinek számát. Így valaki biztosan csalódni fog. A tiltott számot automatikusan áthúzzuk.',
  rulesPlayTitle: 'Az ütések',
  rulesPlayText:
    'Az osztótól balra ülő játékos hív. Mindenki letesz egy lapot, és a legerősebb viszi az ütést. A nyertes hív a következő ütésben.',
  rulesFollowSuit: 'Ha van a hívott színből lapod, azt kell játszanod.',
  rulesNoSuit: 'Ha nincs, azt játszol, amit akarsz: aduval ütsz vagy eldobsz egy lapot.',
  rulesWinTrick: 'A legmagasabb adu nyer; adu nélkül a hívott szín legmagasabb lapja.',
  rulesScoreTitle: 'A pontozás',
  rulesScoreOk: 'Sikeres bemondás',
  rulesScoreOkExample: 'Bemondás 3, ütés 3 → 16 pont',
  rulesScoreKo: 'Bukott bemondás',
  rulesScoreKoExample: 'Bemondás 3, ütés 1 → −4 pont',
  rulesScoreZero:
    'A 0 bemondása és egyetlen ütés nélküli kör 10 pontot ér: nagyon kifizetődő bemondás.',
  rulesScoreVariants: 'A házigazda a váróban más pontozást is választhat:',
  rulesEndTitle: 'A parti vége',
  rulesEndText:
    'Ha minden kört lejátszottatok, a legtöbb pontot gyűjtő játékos nyer. A pontozótáblát a parti alatt bármikor megnézheted.',
  rulesTip:
    'Tipp: rövid körökben egy ász vagy egy magas adu általában elég egy ütéshez. Hosszú körökben óvakodj a hosszú színektől.',
  rulesGotIt: 'Értem',

  // Értesítések: „te jössz”
  notificationsTitle: 'Szólj, ha én jövök',
  notificationsHint:
    'Tedd el a telefont: értesítést küldünk, amint az asztal rád vár. Ideális az egész napra elnyúló partikhoz.',
  notificationsEnable: 'Értesítések bekapcsolása',
  notificationsOn: 'Értesítések bekapcsolva',
  notificationsOff: 'Értesítések kikapcsolva',
  notificationsChecking: 'Ellenőrzés…',
  notificationsUnsupported: 'A böngésződ nem támogatja az értesítéseket.',
  notificationsNeedsInstall:
    'iPhone-on és iPaden előbb add hozzá a Rikikit a kezdőképernyőhöz (Megosztás → „Főképernyőre”), aztán gyere vissza ide.',
  notificationsDenied:
    'Az értesítések tiltva vannak ezen az oldalon. Engedélyezd őket a böngésző beállításaiban.',
  notificationsNoServiceWorker:
    'Itt nem érhetők el az értesítések (telepítsd az alkalmazást vagy frissítsd az oldalt).',
  notificationsServerOff: 'Az értesítések nincsenek beállítva a szerveren.',
  notificationsError: 'Az értesítések módosítása nem sikerült.',

  updateAvailable: 'Új verzió',
  updateReload: 'Frissítés',
  version: (v: string) => `verzió ${v}`,

  // Akadálymentesítés
  accessibility: 'Akadálymentesítés',
  colorblindMode: 'Külön árnyalatok',
  colorblindHint:
    'Színenként külön árnyalat, hogy a ♥ ♦ ♠ ♣ a piros nélkül is megkülönböztethető legyen',
  // Magyarul a szín áll elöl: « kőr ász », « pikk király »
  suitNames: { S: 'pikk', H: 'kőr', D: 'káró', C: 'treff' } as Record<string, string>,
  rankNames: { 11: 'bubi', 12: 'dáma', 13: 'király', 14: 'ász' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${suit} ${rank}`,
  handOf: (n: number) => `A lapjaid: ${n} lap`,

  language: 'Nyelv',
  languageHint: 'Válaszd ki az alkalmazás nyelvét',

  loading: 'Betöltés…',
  errorTitle: 'Hoppá',
  copyright: '© 2026 Clixite SRL',
};

export default hu;
