import type { Messages } from '../types';

/**
 * Lietuvių kalbos skaitvardžio derinimas — trys formos:
 *  - vienaskaita, kai skaičius baigiasi 1 (išskyrus 11–19): 1, 21, 31…
 *  - daugiskaitos vardininkas, kai baigiasi 2–9 (išskyrus 12–19): 2…9, 22…29…
 *  - daugiskaitos kilmininkas, kai baigiasi 0 arba yra 10–20: 0, 10, 11…19, 20, 30…
 */
const ltW = (n: number, one: string, few: string, many: string): string => {
  const d = n % 10;
  const c = n % 100;
  if (c >= 11 && c <= 19) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 9) return few;
  return many;
};

const ltN = (n: number, one: string, few: string, many: string): string =>
  `${n} ${ltW(n, one, few, many)}`;

export const lt: Messages = {
  appName: 'Rikiki',
  tagline: 'Kirčių žaidimas su draugais, kiekvienas savo telefone',

  // Pradžia
  createGame: 'Sukurti partiją',
  joinGame: 'Prisijungti prie partijos',
  resumeGame: 'Tęsti partiją',
  myGames: 'Mano partijos',

  // Profilis
  yourPseudo: 'Tavo slapyvardis',
  pickAvatar: 'Pasirink avatarą',
  letsGo: 'Pirmyn!',
  save: 'Išsaugoti',
  editProfile: 'Mano profilis',
  changeAvatar: 'Keisti avatarą',

  // Prisijungimas
  enterCode: 'Partijos kodas',
  join: 'Prisijungti',
  gameCode: 'Partijos kodas',
  copyLink: 'Kopijuoti nuorodą',
  copied: 'Nuoroda nukopijuota!',

  // Laukiamasis
  invite: 'Pakviesti draugų',
  players: 'Žaidėjai',
  host: 'Šeimininkas',
  you: 'tu',
  waitingForHost: 'Laukiame, kol šeimininkas pradės…',
  needPlayers: (missing: number) =>
    `Iki pradžios dar ${ltN(missing, 'žaidėjas', 'žaidėjai', 'žaidėjų')}`,
  startGame: 'Pradėti partiją',
  leave: 'Išeiti',
  kick: 'Pašalinti',
  addBot: 'Pridėti robotą',
  addBotHint: 'Užpildyk stalą automatiniu žaidėju',
  botsFull: 'Stalas pilnas',
  removeBot: 'Pašalinti robotą',

  // Partijos formatas (trukmė)
  gameFormat: 'Partijos formatas',
  gameFormatHint: 'Pasirink trukmę prieš pradedant',
  formatNames: {
    blitz: 'Žaibas',
    normal: 'Įprasta',
    climb: 'Kylanti',
  },
  formatDescriptions: {
    blitz: 'Kilimas ir leidimasis iki 5 kortų',
    normal: 'Pilnas kilimas ir pilnas leidimasis',
    climb: 'Tik kilimas, be leidimosi',
  },
  formatRounds: (n: number) => ltN(n, 'ratas', 'ratai', 'ratų'),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formatą pasirinko šeimininkas',

  // Žaidimo stalas
  round: 'Ratas',
  cards: (n: number) => ltN(n, 'korta', 'kortos', 'kortų'),
  trump: 'Koziris',
  noTrump: 'Be kozirio',
  dealer: 'Dalytojas',
  offline: 'atsijungęs',
  thinking: '…',
  yourBid: 'Kiek kirčių?',
  bidsTotal: (sum: number, cards: number) =>
    `Užsakyta: ${sum} / ${ltN(cards, 'kirtis', 'kirčiai', 'kirčių')}`,
  hookForbidden: (n: number) => `Draudžiama: suma būtų lygiai ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} draudžiamas: užsakymų suma negali būti lygiai ${cards} (kabliuko taisyklė).`,
  bid: 'Užsakymas',
  tricks: 'Kirčiai',

  // Rato užsakymai
  bidsAnnounced: 'Užsakyta',
  bidsPending: (announced: number, cards: number) =>
    `${announced} iš ${cards} — užsakymai vyksta`,
  bidsBalanced: (cards: number) =>
    `Tiksliai: užsakyta ${ltN(cards, 'kirtis', 'kirčiai', 'kirčių')}`,
  bidsOver: (n: number) =>
    `${ltN(n, 'kirtis', 'kirčiai', 'kirčių')} per daug: kažkas nepataikys`,
  bidsUnder: (n: number) =>
    `${ltN(n, 'kirtis', 'kirčiai', 'kirčių')} per mažai: bus laisvų`,
  noBidYet: 'Dar neužsakė',
  tricksOfContract: (tricks: number, bid: number) =>
    `${tricks}/${bid} ${ltW(bid, 'kirtis', 'kirčiai', 'kirčių')}`,
  yourTurn: 'Tavo eilė',
  turnOf: (p: string) => `Eilė: ${p}`,
  trickWonBy: (p: string) => `${p} paima kirtį`,
  scoreboard: 'Rezultatai',
  total: 'Iš viso',

  // Santrauka
  roundRecap: 'Ratas baigtas',
  contractKept: 'Sutartis įvykdyta',
  contractMissed: 'Sutartis neįvykdyta',
  contract: 'Sutartis',
  points: 'Taškai',
  nextRound: 'Kitas ratas',
  seeResults: 'Žiūrėti rezultatus',
  waitingNextRound: 'Šeimininkas pradės kitą ratą…',

  // Partijos pabaiga
  gameOver: 'Partija baigta',
  playAgain: 'Žaisti dar kartą',
  backHome: 'Pradžia',

  // Garsas
  soundOn: 'Įjungti garsą',
  soundOff: 'Išjungti garsą',

  // Tinklas
  reconnecting: 'Jungiamasi iš naujo…',
  playerDisconnected: (p: string) => `${p} prarado ryšį`,
  playerReconnected: (p: string) => `${p} sugrįžo`,
  playerJoined: (p: string) => `${p} prisijungė prie partijos`,
  playerLeft: (p: string) => `${p} paliko partiją`,
  roomClosed: 'Partija uždaryta.',
  roomClosedKicked: 'Tu buvai pašalintas iš partijos.',
  roomClosedExpired: 'Partijos galiojimas baigėsi.',

  // Kvietimai
  inviteMessage: (code: string, url: string) =>
    `Ateik žaisti Rikiki su mumis! 🃏\nPartijos kodas: ${code}\nPrisijunk čia: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Dalytis',

  // Paskyra
  saveAccount: 'Išsaugoti mano pažangą',
  saveAccountHint: 'Gausi nuorodą el. paštu — jokių slaptažodžių',
  emailPlaceholder: 'tavo@pastas.lt',
  sendMagicLink: 'Atsiųsti nuorodą',
  magicLinkSent: 'Laiškas išsiųstas! Atidaryk nuorodą, kad patvirtintum.',
  accountSaved: 'Pažanga išsaugota',
  verifying: 'Tikrinama…',
  verified: 'Paskyra patvirtinta! Tavo pažanga išsaugota.',
  verifyFailed: 'Nuoroda netinkama arba nebegalioja. Paprašyk naujos savo profilyje.',

  // Statistika ir istorija
  stats: 'Statistika',
  gamesPlayed: 'partijos',
  gamesWon: 'pergalės',
  bestRound: 'geriausias ratas',
  noHistory: 'Kol kas nėra baigtų partijų.',
  historyTitle: 'Paskutinės mano partijos',
  wonBadge: 'Laimėta',
  lostBadge: 'Pralaimėta',
  playersCount: (n: number) => ltN(n, 'žaidėjas', 'žaidėjai', 'žaidėjų'),

  // Draugų grupės
  groups: 'Mano grupės',
  groupsTitle: 'Mano grupės',
  groupsSubtitle: 'Bendra įskaita tiems, kurie visada žaidžia kartu',
  noGroups: 'Kol kas nepriklausai jokiai grupei.',
  createGroup: 'Sukurti grupę',
  createGroupCta: 'Sukurti grupę',
  groupNamePlaceholder: 'Antradienio draugai',
  groupNameLabel: 'Grupės pavadinimas',
  groupNameTooShort: 'Pavadinimą turi sudaryti 2–30 simbolių.',
  joinGroup: 'Prisijungti prie grupės',
  joinGroupCta: 'Prisijungti',
  groupCodeLabel: 'Grupės kodas',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 raidės, be I, L ir O',
  groupCode: 'Grupės kodas',
  groupShareHint: 'Pasidalyk kodu, kad draugai galėtų prisijungti prie grupės',
  copyGroupCode: 'Kopijuoti kodą',
  groupCodeCopied: 'Kodas nukopijuotas!',
  groupMembers: (n: number) => ltN(n, 'narys', 'nariai', 'narių'),
  groupGames: (n: number) =>
    n === 0 ? 'partijų nėra' : ltN(n, 'partija', 'partijos', 'partijų'),
  groupRanking: 'Bendra įskaita',
  groupRecentGames: 'Paskutinės grupės partijos',
  groupNoGames: 'Grupėje kol kas nežaista.',
  groupNoGamesHint: 'Pradėk partiją su šia grupe — rezultatai atsiras čia.',
  groupPlay: 'Žaisti su šia grupe',
  groupOwner: 'Kūrėjas',
  groupLeave: 'Palikti grupę',
  groupLeaveConfirm: 'Palikti šią grupę? Ankstesnės tavo partijos liks įskaitoje.',
  groupDelete: 'Ištrinti grupę',
  groupDeleteConfirm: 'Ištrinti šią grupę ir visą jos įskaitą? To atšaukti nebus galima.',
  groupOwnerCannotLeave: 'Tu sukūrei šią grupę: gali ją tik ištrinti.',
  groupNotFound: 'Grupė nerasta.',
  groupJoined: (name: string) => `Prisijungei prie grupės „${name}“!`,
  groupCreated: (name: string) => `Grupė „${name}“ sukurta!`,
  groupAttached: (name: string) => `Partija priskirta grupei „${name}“`,
  groupTotalPoints: 'taškai',
  groupRankHeader: '#',
  groupPlayerHeader: 'Žaidėjas',
  groupPointsHeader: 'Tšk',
  groupPlayedHeader: 'P',
  groupWonHeader: 'L',

  // Žaidimo taisyklės
  rules: 'Žaidimo taisyklės',
  rulesTitle: 'Kaip žaisti',
  rulesSubtitle: 'Rikiki per dvi minutes',
  rulesGoalTitle: 'Esmė',
  rulesGoalText:
    'Prieš kiekvieną ratą užsakote, kiek kirčių tikitės paimti. Visa esmė — pataikyti tiksliai: nei daugiau, nei mažiau. Daug kirčių nepadės, jei užsakėte mažai.',
  rulesDealTitle: 'Dalijimas',
  rulesDealText:
    'Partija žaidžiama keliais ratais. Pirmajame kiekvienam dalijama tik po vieną kortą, paskui po dvi, po tris… o vėliau vėl leidžiamasi žemyn. Kiekviename rate visi gauna po lygiai kortų.',
  rulesTrumpText: 'Viena korta atverčiama: jos rūšis yra rato koziris.',
  rulesBidTitle: 'Užsakymas',
  rulesBidText:
    'Iš eilės kiekvienas skelbia, kiek kirčių taikosi paimti — nuo 0 iki kortų skaičiaus rankoje. Prieš apsispręsdamas matai savo kortas ir kozirį.',
  rulesHookTitle: 'Kabliuko taisyklė',
  rulesHookText:
    'Paskutinis užsakantis (dalytojas) negali pasirinkti skaičiaus, su kuriuo užsakymų suma tiksliai sutaptų su rato kirčių skaičiumi. Vadinasi, kas nors būtinai nusivils. Draudžiamas skaičius perbraukiamas automatiškai.',
  rulesPlayTitle: 'Kirčių žaidimas',
  rulesPlayText:
    'Pirmas eina žaidėjas kairėje nuo dalytojo. Kiekvienas padeda po kortą, o stipriausia paima kirtį. Laimėtojas pradeda kitą kirtį.',
  rulesFollowSuit: 'Privalai mesti tos pačios rūšies kortą, jei ją turi.',
  rulesNoSuit: 'Jei neturi — žaidi ką nori: kerti koziriu arba nusimeti kortą.',
  rulesWinTrick: 'Laimi aukščiausias koziris; be kozirio — aukščiausia išėjusios rūšies korta.',
  rulesScoreTitle: 'Taškai',
  rulesScoreOk: 'Sutartis įvykdyta',
  rulesScoreOkExample: 'Užsakyta 3, paimta 3 → 16 taškų',
  rulesScoreKo: 'Sutartis neįvykdyta',
  rulesScoreKoExample: 'Užsakyta 3, paimta 1 → −4 taškai',
  rulesScoreZero:
    'Užsakyti 0 ir nepaimti nė vieno kirčio duoda 10 taškų: labai pelninga sutartis.',
  rulesEndTitle: 'Partijos pabaiga',
  rulesEndText:
    'Kai sužaidžiami visi ratai, laimi daugiausia taškų surinkęs žaidėjas. Rezultatų lentelę galima atsiversti bet kada partijos metu.',
  rulesTip:
    'Patarimas: mažuose ratuose kirčiui dažnai užtenka tūzo arba aukšto kozirio. Dideliuose saugokis ilgų rūšių.',
  rulesGotIt: 'Supratau',

  // Pranešimai „tavo eilė“
  notificationsTitle: 'Pranešti, kai ateis mano eilė',
  notificationsHint:
    'Padėk telefoną: atsiųsime pranešimą, vos tik stalas tavęs lauks. Puikiai tinka partijoms, nusitęsiančioms visai dienai.',
  notificationsEnable: 'Įjungti pranešimus',
  notificationsOn: 'Pranešimai įjungti',
  notificationsOff: 'Pranešimai išjungti',
  notificationsChecking: 'Tikrinama…',
  notificationsUnsupported: 'Tavo naršyklė nepalaiko pranešimų.',
  notificationsNeedsInstall:
    '„iPhone“ ir „iPad“ įrenginiuose pirmiausia įtrauk Rikiki į pradžios ekraną (Bendrinti → „Įtraukti į pradžios ekraną“), tada grįžk čia.',
  notificationsDenied:
    'Pranešimai šiai svetainei užblokuoti. Vėl juos leisk naršyklės nustatymuose.',
  notificationsNoServiceWorker:
    'Pranešimai čia neprieinami (įdiek programėlę arba perkrauk puslapį).',
  notificationsServerOff: 'Pranešimai serveryje nesukonfigūruoti.',
  notificationsError: 'Nepavyko pakeisti pranešimų.',

  updateAvailable: 'Nauja versija',
  updateReload: 'Atnaujinti',
  version: (v: string) => `versija ${v}`,

  // Prieinamumas
  accessibility: 'Prieinamumas',
  colorblindMode: 'Atskiros spalvos',
  colorblindHint: 'Kiekvienai rūšiai sava spalva, kad ♥ ♦ ♠ ♣ skirtųsi ir be raudonos',
  suitNames: { S: 'pikų', H: 'širdžių', D: 'būgnų', C: 'kryžių' } as Record<string, string>,
  rankNames: { 11: 'valetas', 12: 'dama', 13: 'karalius', 14: 'tūzas' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${suit} ${rank}`,
  handOf: (n: number) => `Tavo ranka: ${ltN(n, 'korta', 'kortos', 'kortų')}`,

  language: 'Kalba',
  languageHint: 'Pasirink programėlės kalbą',

  loading: 'Įkeliama…',
  errorTitle: 'Ups',
  copyright: '© 2026 Nicolas Simon',
};

export default lt;
