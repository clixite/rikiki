import type { Messages } from '../types';

/**
 * Eesti keeles on arvsõna 1 järel nimetav ja kõigi teiste (ka nulli) järel
 * osastav kääne — «1 kaart», «2 kaarti», «0 kaarti».
 */
const etN = (count: number, nominative: string, partitive: string): string =>
  `${count} ${count === 1 ? nominative : partitive}`;

export const et: Messages = {
  appName: 'Rikiki',
  tagline: 'Tihimäng sõpradega, igaüks oma telefonis',

  // Avaleht
  createGame: 'Loo mäng',
  joinGame: 'Liitu mänguga',
  resumeGame: 'Jätka mängu',
  myGames: 'Minu mängud',

  // Profiil
  yourPseudo: 'Sinu hüüdnimi',
  pickAvatar: 'Vali oma avatar',
  letsGo: 'Läks!',
  save: 'Salvesta',
  editProfile: 'Minu profiil',
  changeAvatar: 'Vaheta avatari',

  // Liitumine
  enterCode: 'Mängu kood',
  join: 'Liitu',
  gameCode: 'Mängu kood',
  copyLink: 'Kopeeri link',
  copied: 'Link kopeeritud!',

  // Ooteruum
  invite: 'Kutsu sõpru',
  players: 'Mängijad',
  host: 'Peremees',
  you: 'sina',
  waitingForHost: 'Ootame, kuni peremees alustab…',
  needPlayers: (missing: number) =>
    missing === 1
      ? 'Alustamiseks veel 1 mängija'
      : `Alustamiseks veel ${missing} mängijat`,
  startGame: 'Alusta mängu',
  leave: 'Lahku',
  kick: 'Eemalda',
  addBot: 'Lisa robot',
  addBotHint: 'Täida laud automaatmängijaga',
  botsFull: 'Laud on täis',
  removeBot: 'Eemalda robot',

  // Mängu formaat (pikkus)
  gameFormat: 'Mängu formaat',
  gameFormatHint: 'Vali pikkus enne alustamist',
  formatNames: {
    blitz: 'Välk',
    normal: 'Tavaline',
    climb: 'Tõusev',
  },
  formatDescriptions: {
    blitz: 'Tõus ja langus viie kaardini',
    normal: 'Täielik tõus ja täielik langus',
    climb: 'Ainult tõus, langust ei tule',
  },
  formatRounds: (n: number) => etN(n, 'voor', 'vooru'),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formaadi valis peremees',

  // Mängulaud
  round: 'Voor',
  cards: (n: number) => etN(n, 'kaart', 'kaarti'),
  trump: 'Trump',
  noTrump: 'Trumbita',
  dealer: 'Jagaja',
  offline: 'eemal',
  thinking: '…',
  yourBid: 'Mitu tihi?',
  bidsTotal: (sum: number, cards: number) => `Lubatud: ${sum} / ${cards} tihi`,
  hookForbidden: (n: number) => `Keelatud: summa tuleks täpselt ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} on keelatud: pakkumiste summa ei tohi olla täpselt ${cards} (konksureegel).`,
  bid: 'Pakkumine',
  tricks: 'Tihid',

  // Vooru pakkumised
  bidsAnnounced: 'Lubatud',
  bidsPending: (announced: number, cards: number) =>
    `${announced} / ${cards} — pakkumised käivad`,
  bidsBalanced: (cards: number) => `Täpselt paras: lubatud ${cards} tihi`,
  bidsOver: (n: number) => `${n} tihi liiga palju: keegi kukub läbi`,
  bidsUnder: (n: number) => `${n} tihi jääb üle korjata`,
  noBidYet: 'Pole veel pakkunud',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} tihi`,
  yourTurn: 'Sinu kord',
  turnOf: (p: string) => `Käib ${p}`,
  trickWonBy: (p: string) => `${p} võtab tihi`,
  scoreboard: 'Punktitabel',
  total: 'Kokku',

  // Kokkuvõte
  roundRecap: 'Voor läbi',
  contractKept: 'Lubadus peetud',
  contractMissed: 'Lubadus luhtus',
  contract: 'Lubadus',
  points: 'Punktid',
  nextRound: 'Järgmine voor',
  seeResults: 'Vaata tulemusi',
  waitingNextRound: 'Peremees alustab järgmist vooru…',

  // Mängu lõpp
  gameOver: 'Mäng läbi',
  shareResult: 'Jaga tulemust',
  shareTitle: 'Rikiki mäng läbi 🃏',
  shareSaved: 'Pilt salvestatud',
  playAgain: 'Mängi uuesti',
  backHome: 'Avalehele',

  // Heli
  soundOn: 'Lülita heli sisse',
  soundOff: 'Lülita heli välja',

  // Võrk
  reconnecting: 'Taasühendan…',
  playerDisconnected: (p: string) => `${p} kaotas ühenduse`,
  playerReconnected: (p: string) => `${p} on tagasi`,
  playerJoined: (p: string) => `${p} liitus mänguga`,
  playerLeft: (p: string) => `${p} lahkus mängust`,
  roomClosed: 'Mäng on suletud.',
  roomClosedKicked: 'Sind eemaldati mängust.',
  roomClosedExpired: 'Mäng on aegunud.',

  // Kutsed
  inviteMessage: (code: string, url: string) =>
    `Tule mängi meiega Rikikit! 🃏\nMängu kood: ${code}\nLiitu siin: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Jaga',

  // Konto
  saveAccount: 'Salvesta minu edenemine',
  saveAccountHint: 'Saad lingi e-postiga — parooli pole vaja meelde jätta',
  emailPlaceholder: 'sinu@epost.ee',
  sendMagicLink: 'Saada mulle link',
  magicLinkSent: 'E-kiri saadetud! Kinnitamiseks ava link.',
  accountSaved: 'Edenemine salvestatud',
  verifying: 'Kontrollin…',
  verified: 'Konto kinnitatud! Sinu edenemine on salvestatud.',
  verifyFailed: 'Link on vigane või aegunud. Küsi profiililt uus link.',

  privacyPolicy: 'Privaatsus',
  deleteAccount: 'Kustuta minu konto',
  deleteAccountHint: 'Kustutab sinu profiili, ajaloo ja rühmad.',
  deleteAccountWarning: 'Sinu hüüdnimi, mängud, statistika ja rühmad kustutatakse. Toimingut ei saa tagasi võtta.',
  deleteAccountAction: 'Jah, kustuta kõik',
  deleteAccountDone: 'Konto on kustutatud.',
  cancel: 'Loobu',
  botTag: 'robot',

  // Statistika ja ajalugu
  stats: 'Statistika',
  gamesPlayed: 'mängu',
  gamesWon: 'võitu',
  bestRound: 'parim voor',
  noHistory: 'Ühtegi lõpetatud mängu veel pole.',
  historyTitle: 'Minu viimased mängud',
  wonBadge: 'Võit',
  lostBadge: 'Kaotus',
  playersCount: (n: number) => etN(n, 'mängija', 'mängijat'),

  // Sõpruskonnad
  groups: 'Minu grupid',
  groupsTitle: 'Minu grupid',
  groupsSubtitle: 'Ühine edetabel neile, kes alati koos mängivad',
  noGroups: 'Sa ei kuulu veel ühtegi gruppi.',
  createGroup: 'Loo grupp',
  createGroupCta: 'Loo grupp',
  groupNamePlaceholder: 'Teisipäevane seltskond',
  groupNameLabel: 'Grupi nimi',
  groupNameTooShort: 'Nimi peab olema 2–30 tähemärki.',
  joinGroup: 'Liitu grupiga',
  joinGroupCta: 'Liitu',
  groupCodeLabel: 'Grupi kood',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 tähte, ilma I, L ja O-ta',
  groupCode: 'Grupi kood',
  groupShareHint: 'Jaga koodi, et sõbrad saaksid grupiga liituda',
  copyGroupCode: 'Kopeeri kood',
  groupCodeCopied: 'Kood kopeeritud!',
  groupMembers: (n: number) => etN(n, 'liige', 'liiget'),
  groupGames: (n: number) => (n === 0 ? 'mänge pole' : etN(n, 'mäng', 'mängu')),
  groupRanking: 'Ühine edetabel',
  groupRecentGames: 'Grupi viimased mängud',
  groupNoGames: 'Grupis pole veel mängitud.',
  groupNoGamesHint: 'Alusta selle grupiga mängu — tulemused ilmuvad siia.',
  groupPlay: 'Mängi selle grupiga',
  groupOwner: 'Looja',
  groupLeave: 'Lahku grupist',
  groupLeaveConfirm: 'Kas lahkuda grupist? Sinu varasemad mängud jäävad edetabelisse.',
  groupDelete: 'Kustuta grupp',
  groupDeleteConfirm: 'Kas kustutada grupp ja kogu selle edetabel? Seda ei saa tagasi võtta.',
  groupOwnerCannotLeave: 'Sina lõid selle grupi: saad selle ainult kustutada.',
  groupNotFound: 'Gruppi ei leitud.',
  groupJoined: (name: string) => `Liitusid grupiga „${name}“!`,
  groupCreated: (name: string) => `Grupp „${name}“ on loodud!`,
  groupAttached: (name: string) => `Mäng seoti grupiga „${name}“`,
  groupTotalPoints: 'punkti',
  groupRankHeader: '#',
  groupPlayerHeader: 'Mängija',
  groupPointsHeader: 'Pkt',
  groupPlayedHeader: 'M',
  groupWonHeader: 'V',

  // Mängureeglid
  rules: 'Mängureeglid',
  rulesTitle: 'Kuidas mängida',
  rulesSubtitle: 'Rikiki kahe minutiga',
  rulesGoalTitle: 'Mõte',
  rulesGoalText:
    'Enne iga vooru lubad, mitu tihi arvad võtvat. Kogu mõte on tabada täpselt: ei rohkem ega vähem. Paljudest tihidest pole kasu, kui lubasid vähe.',
  rulesDealTitle: 'Jagamine',
  rulesDealText:
    'Mäng koosneb mitmest voorust. Esimeses jagatakse igale mängijale vaid üks kaart, siis kaks, siis kolm… ja seejärel tullakse tagasi alla. Igas voorus saavad kõik ühepalju kaarte.',
  rulesTrumpText: 'Üks kaart keeratakse lahti: selle mast on vooru trump.',
  rulesBidTitle: 'Pakkumine',
  rulesBidText:
    'Kordamööda ütlete, mitut tihi te sihite — nullist kuni käes olevate kaartide arvuni. Enne otsust näete oma kaarte ja trumpi.',
  rulesHookTitle: 'Konksureegel',
  rulesHookText:
    'Viimasena pakkuja (jagaja) ei tohi valida arvu, millega pakkumiste summa võrduks täpselt vooru tihide arvuga. Nii jääb keegi paratamatult pettuma. Keelatud arv kriipsutatakse automaatselt läbi.',
  rulesPlayTitle: 'Tihide mängimine',
  rulesPlayText:
    'Jagajast vasakul istuv mängija käib välja. Igaüks paneb ühe kaardi ja tugevaim võtab tihi. Võitja alustab järgmist tihi.',
  rulesFollowSuit: 'Sa pead käima välja käidud masti, kui see on sul käes.',
  rulesNoSuit: 'Muidu mängid mida tahad: tapad trumbiga või viskad kaardi maha.',
  rulesWinTrick: 'Võidab kõrgeim trump; trumbita kõrgeim kaart väljakäidud mastis.',
  rulesScoreTitle: 'Punktid',
  rulesScoreOk: 'Lubadus peetud',
  rulesScoreOkExample: 'Lubatud 3, saadud 3 → 16 punkti',
  rulesScoreKo: 'Lubadus luhtus',
  rulesScoreKoExample: 'Lubatud 3, saadud 1 → −4 punkti',
  rulesScoreZero:
    'Nulli lubamine ja ühegi tihi võtmata jätmine annab 10 punkti: väga tulus lubadus.',
  rulesEndTitle: 'Mängu lõpp',
  rulesEndText:
    'Kui kõik voorud on mängitud, võidab kõige rohkem punkte kogunud mängija. Punktitabelit saab mängu ajal igal hetkel vaadata.',
  rulesTip:
    'Nipp: väikestes voorudes piisab tihi võtmiseks sageli ässast või kõrgest trumbist. Suurtes voorudes hoia pikkadel mastidel silm peal.',
  rulesGotIt: 'Selge',

  // Teated „nüüd on sinu kord“
  notificationsTitle: 'Anna teada, kui on minu kord',
  notificationsHint:
    'Pane telefon ära: saadame teate kohe, kui laud sind ootab. Ideaalne mängudeks, mis venivad üle terve päeva.',
  notificationsEnable: 'Luba teated',
  notificationsOn: 'Teated sees',
  notificationsOff: 'Teated väljas',
  notificationsChecking: 'Kontrollin…',
  notificationsUnsupported: 'Sinu brauser ei toeta teateid.',
  notificationsNeedsInstall:
    'iPhone’is ja iPadis lisa Rikiki kõigepealt avaekraanile (Jaga → „Lisa avaekraanile“) ja tule siis siia tagasi.',
  notificationsDenied:
    'Teated on selle saidi jaoks blokeeritud. Luba need brauseri seadetes uuesti.',
  notificationsNoServiceWorker:
    'Teated pole siin saadaval (paigalda rakendus või laadi leht uuesti).',
  notificationsServerOff: 'Teated pole serveris seadistatud.',
  notificationsError: 'Teadete muutmine ebaõnnestus.',

  updateAvailable: 'Uus versioon',
  updateReload: 'Uuenda',
  version: (v: string) => `versioon ${v}`,

  // Accessibilité
  accessibility: 'Ligipääsetavus',
  colorblindMode: 'Eristuvad värvid',
  colorblindHint: 'Igal masti oma värv, et ♥ ♦ ♠ ♣ eristuksid ka punaseta',
  suitNames: { S: 'poti', H: 'ärtu', D: 'ruutu', C: 'risti' } as Record<string, string>,
  rankNames: { 11: 'soldat', 12: 'emand', 13: 'kuningas', 14: 'äss' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${suit} ${rank}`,
  handOf: (n: number) => (n > 1 ? `Sinu käsi: ${n} kaarti` : 'Sinu käsi: 1 kaart'),

  language: 'Keel',
  languageHint: 'Vali rakenduse keel',

  loading: 'Laen…',
  errorTitle: 'Oih',
  copyright: '© 2026 Nicolas Simon',
};

export default et;
