import type { Messages } from '../types';

/**
 * Malti — ħames forom (CLDR: one/two/few/many/other) :
 *   1        → singular            « karta waħda »
 *   2        → dual/plural         « 2 karti »
 *   0, 3–10  → plural              « 5 karti »
 *   11–19    → « -il » + singular  « 11-il karta »
 *   20+      → singular            « 20 karta »
 */
type MtForm = 'one' | 'two' | 'few' | 'many' | 'other';

const mtForm = (n: number): MtForm => {
  if (n === 1) return 'one';
  if (n === 2) return 'two';
  const rest = n % 100;
  if (n === 0 || (rest >= 3 && rest <= 10)) return 'few';
  if (rest >= 11 && rest <= 19) return 'many';
  return 'other';
};

/** `sing` : is-singular, `plur` : il-plural. */
const mt1 = (n: number, sing: string, plur: string) => {
  const form = mtForm(n);
  if (form === 'two' || form === 'few') return `${n} ${plur}`;
  if (form === 'many') return `${n}-il ${sing}`;
  return `${n} ${sing}`;
};

const karti = (n: number) => mt1(n, 'karta', 'karti');
const daqqiet = (n: number) => mt1(n, 'daqqa', 'daqqiet');
const plejers = (n: number) => mt1(n, 'plejer', 'plejers');
const rawnds = (n: number) => mt1(n, 'rawnd', 'rawnds');
const loghbiet = (n: number) => mt1(n, 'logħba', 'logħbiet');
const membri = (n: number) => mt1(n, 'membru', 'membri');

export const mt: Messages = {
  appName: 'Rikiki',
  tagline: 'Il-logħba tad-daqqiet mal-ħbieb, kulħadd fuq it-telefon tiegħu',

  // Il-bidu
  createGame: 'Oħloq logħba',
  joinGame: "Idħol f'logħba",
  resumeGame: 'Kompli l-logħba',
  myGames: 'Il-logħbiet tiegħi',

  // Profil
  yourPseudo: 'Il-laqam tiegħek',
  pickAvatar: 'Agħżel l-avatar tiegħek',
  letsGo: 'Ħa nibdew!',
  save: 'Issejvja',
  editProfile: 'Il-profil tiegħi',
  changeAvatar: 'Ibdel l-avatar',

  // Dħul
  enterCode: 'Kodiċi tal-logħba',
  join: 'Idħol',
  gameCode: 'Kodiċi tal-logħba',
  copyLink: 'Ikkupja l-link',
  copied: 'Link ikkupjat!',

  // Sala
  invite: 'Stieden lil sħabek',
  players: 'Plejers',
  host: 'Ospitu',
  you: 'int',
  waitingForHost: 'Nistennew lill-ospitu jibda…',
  needPlayers: (missing: number) =>
    missing === 1 ? 'Plejer ieħor biex nibdew' : `${plejers(missing)} oħra biex nibdew`,
  startGame: 'Ibda l-logħba',
  leave: 'Oħroġ',
  kick: 'Neħħi',
  addBot: 'Żid robot',
  addBotHint: 'Imla l-mejda bi plejer awtomatiku',
  botsFull: 'Il-mejda hija mimlija',
  removeBot: 'Neħħi r-robot',

  // Format tal-logħba (tul)
  gameFormat: 'Format tal-logħba',
  gameFormatHint: 'Agħżel it-tul qabel tibda',
  formatNames: {
    blitz: 'Berqa',
    normal: 'Normali',
    climb: 'Tlugħ',
  },
  formatDescriptions: {
    blitz: 'Tlugħ u nżul sa 5 karti',
    normal: 'Tlugħ u nżul sħaħ',
    climb: 'Tlugħ biss, bla nżul',
  },
  formatRounds: (n: number) => rawnds(n),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Format magħżul mill-ospitu',

  // Il-mejda
  round: 'Rawnd',
  cards: (n: number) => karti(n),
  trump: 'Briscla',
  noTrump: 'Bla briscla',
  dealer: 'Qassiem',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Kemm-il daqqa?',
  bidsTotal: (sum: number, cards: number) => `Imħabbra: ${sum} / ${cards} daqqiet`,
  hookForbidden: (n: number) => `Ipprojbit: it-total ikun eżattament ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} huwa pprojbit: it-total tat-tħabbiriet ma jistax ikun daqs ${cards} (ir-regola tal-ganċ).`,
  bid: 'Tħabbira',
  tricks: 'Daqqiet',

  // Sommarju tat-tħabbiriet tar-rawnd
  bidsAnnounced: 'Imħabbar',
  bidsPending: (announced: number, cards: number) =>
    `${announced} minn ${cards} — it-tħabbiriet għaddejjin`,
  bidsBalanced: (cards: number) => `Total eżatt: ${daqqiet(cards)} imħabbra`,
  bidsOver: (n: number) =>
    n === 1
      ? "Daqqa waħda żejda: xi ħadd se jaqa'"
      : `${daqqiet(n)} żejda: xi ħadd se jaqa'`,
  bidsUnder: (n: number) =>
    n === 1 ? "Daqqa waħda ħielsa x'tinġabar" : `${daqqiet(n)} ħielsa x'jinġabru`,
  noBidYet: 'Għadu ma ħabbarx',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} daqqiet`,
  yourTurn: 'Imissek int',
  turnOf: (p: string) => `Imiss lil ${p}`,
  trickWonBy: (p: string) => `${p} rebaħ id-daqqa`,
  scoreboard: 'Punteġġi',
  total: 'Total',

  // Sommarju
  roundRecap: 'Tmiem ir-rawnd',
  contractKept: 'Kuntratt milħuq',
  contractMissed: 'Kuntratt mitluf',
  contract: 'Kuntratt',
  points: 'Punti',
  nextRound: 'Rawnd li jmiss',
  seeResults: 'Ara r-riżultati',
  waitingNextRound: 'L-ospitu se jibda r-rawnd li jmiss…',

  // Tmiem il-logħba
  gameOver: 'Il-logħba spiċċat',
  shareResult: 'Aqsam ir-riżultat',
  shareTitle: 'Il-logħba Rikiki spiċċat 🃏',
  shareSaved: 'Ritratt salvat',
  playAgain: "Erġa' ilgħab",
  backHome: 'Il-bidu',

  // Ħoss
  soundOn: 'Ixgħel il-ħoss',
  soundOff: 'Itfi l-ħoss',

  // Netwerk
  reconnecting: 'Qed nerġgħu ningħaqdu…',
  playerDisconnected: (p: string) => `${p} qata' l-konnessjoni`,
  playerReconnected: (p: string) => `${p} reġa' daħal`,
  playerJoined: (p: string) => `${p} ingħaqad mal-logħba`,
  playerLeft: (p: string) => `${p} ħalla l-logħba`,
  roomClosed: 'Il-logħba ngħalqet.',
  roomClosedKicked: 'Tneħħejt mil-logħba.',
  roomClosedExpired: 'Il-logħba skadiet.',

  // Stediniet
  inviteMessage: (code: string, url: string) =>
    `Ejja tilgħab ir-Rikiki magħna! 🃏\nKodiċi tal-logħba: ${code}\nIdħol minn hawn: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Aqsam',

  // Kont
  saveAccount: 'Aħżen il-progress tiegħi',
  saveAccountHint: "Tirċievi link bl-email — l-ebda password x'tiftakar",
  emailPlaceholder: 'inti@email.mt',
  sendMagicLink: 'Ibgħatli l-link',
  magicLinkSent: 'Email mibgħut! Iftaħ il-link biex tikkonferma.',
  accountSaved: 'Progress maħżun',
  verifying: 'Qed nivverifikaw…',
  verified: 'Kont ikkonfermat! Il-progress tiegħek huwa maħżun.',
  verifyFailed: 'Link invalidu jew skadut. Itlob ieħor mill-profil tiegħek.',

  privacyPolicy: 'Privatezza',
  deleteAccount: 'Ħassar il-kont tiegħi',
  deleteAccountHint: 'Iħassar il-profil, l-istorja u l-gruppi tiegħek.',
  deleteAccountWarning: 'Il-laqam, il-logħbiet, l-istatistika u l-gruppi tiegħek jitħassru. Din l-azzjoni ma tistax titreġġa’ lura.',
  deleteAccountAction: 'Iva, ħassar kollox',
  deleteAccountDone: 'Il-kont tħassar.',
  cancel: 'Ikkanċella',
  botTag: 'bot',

  // Statistika u storja
  stats: 'Statistika',
  gamesPlayed: 'logħbiet',
  gamesWon: 'rebħiet',
  bestRound: 'l-aħjar rawnd',
  noHistory: 'Għadek ma temmejt l-ebda logħba.',
  historyTitle: 'L-aħħar logħbiet tiegħi',
  wonBadge: 'Rebħa',
  lostBadge: 'Telfa',
  playersCount: (n: number) => plejers(n),

  // Gruppi ta' ħbieb
  groups: 'Il-gruppi tiegħi',
  groupsTitle: 'Il-gruppi tiegħi',
  groupsSubtitle: 'Klassifika kumulattiva għal min dejjem jilgħab flimkien',
  noGroups: "Bħalissa m'intix f'ebda grupp.",
  createGroup: 'Oħloq grupp',
  createGroupCta: 'Oħloq il-grupp',
  groupNamePlaceholder: 'Il-ħbieb tat-Tlieta',
  groupNameLabel: 'Isem il-grupp',
  groupNameTooShort: 'L-isem irid ikun bejn 2 u 30 karattru.',
  joinGroup: 'Idħol fi grupp',
  joinGroupCta: 'Idħol',
  groupCodeLabel: 'Kodiċi tal-grupp',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 ittri, bla I, L u O',
  groupCode: 'Kodiċi tal-grupp',
  groupShareHint: 'Aqsam dan il-kodiċi biex sħabek jidħlu fil-grupp',
  copyGroupCode: 'Ikkupja l-kodiċi',
  groupCodeCopied: 'Kodiċi ikkupjat!',
  groupMembers: (n: number) => membri(n),
  groupGames: (n: number) => (n === 0 ? 'l-ebda logħba' : loghbiet(n)),
  groupRanking: 'Klassifika kumulattiva',
  groupRecentGames: 'L-aħħar logħbiet tal-grupp',
  groupNoGames: 'Għadha ma ntlagħbet l-ebda logħba fil-grupp.',
  groupNoGamesHint: "Ibda logħba ma' dan il-grupp: ir-riżultati jidhru hawn.",
  groupPlay: "Ilgħab ma' dan il-grupp",
  groupOwner: 'Fundatur',
  groupLeave: 'Oħroġ mill-grupp',
  groupLeaveConfirm: 'Toħroġ minn dan il-grupp? Il-logħbiet li lgħabt jibqgħu fil-klassifika.',
  groupDelete: 'Ħassar il-grupp',
  groupDeleteConfirm: 'Tħassar dan il-grupp u l-klassifika kollha tiegħu? Dan huwa finali.',
  groupOwnerCannotLeave: "Int ħloqt dan il-grupp: tista' biss tħassru.",
  groupNotFound: 'Grupp ma nstabx.',
  groupJoined: (name: string) => `Dħalt fi ‘${name}’!`,
  groupCreated: (name: string) => `Il-grupp ‘${name}’ inħoloq!`,
  groupAttached: (name: string) => `Logħba marbuta ma' ‘${name}’`,
  groupTotalPoints: 'punti',
  groupRankHeader: '#',
  groupPlayerHeader: 'Plejer',
  groupPointsHeader: 'Pti',
  groupPlayedHeader: 'L',
  groupWonHeader: 'R',

  // Ir-regoli tal-logħba
  rules: 'Ir-regoli',
  rulesTitle: 'Kif tilgħab',
  rulesSubtitle: "Ir-Rikiki f'2 minuti",
  rulesGoalTitle: 'Il-prinċipju',
  rulesGoalText:
    'Qabel kull rawnd, tħabbru kemm-il daqqa taħsbu li se tirbħu. Il-kwistjoni kollha hi li tolqtu eżatt: la aktar u lanqas inqas. Ma jiswa xejn tirbaħ ħafna daqqiet jekk ħabbart ftit.',
  rulesDealTitle: 'It-tqassim',
  rulesDealText:
    "Il-logħba tintlagħab f'diversi rawnds. Fl-ewwel wieħed titqassam karta waħda biss lil kull plejer, imbagħad tnejn, imbagħad tlieta… qabel ma terġa' tinżel. F'kull rawnd kulħadd jieħu l-istess numru ta' karti.",
  rulesTrumpText: 'Tinqaleb karta: il-kulur tagħha huwa l-briscla tar-rawnd.',
  rulesBidTitle: 'It-tħabbira',
  rulesBidText:
    "Wieħed wara l-ieħor, tħabbru kemm-il daqqa qed timmiraw — minn 0 san-numru ta' karti f'idejkom. Tara l-karti tiegħek u l-briscla qabel tiddeċiedi.",
  rulesHookTitle: 'Ir-regola tal-ganċ',
  rulesHookText:
    "L-aħħar wieħed li jħabbar (il-qassiem) ma jistax jagħżel in-numru li jġib it-total tat-tħabbiriet eżatt daqs in-numru ta' daqqiet tar-rawnd. Riżultat: xi ħadd żgur se jibqa' diżappuntat. In-numru pprojbit jinqata' awtomatikament.",
  rulesPlayTitle: 'Il-logħob tad-daqqiet',
  rulesPlayText:
    "Il-plejer fuq ix-xellug tal-qassiem jibda. Kulħadd ipoġġi karta, u l-iqwa waħda tirbaħ id-daqqa. Ir-rebbieħ jiftaħ id-daqqa ta' wara.",
  rulesFollowSuit: 'Trid issegwi l-kulur mitlub jekk għandek wieħed.',
  rulesNoSuit: "Inkella tilgħab li trid: taqta' bil-briscla jew tarmi karta.",
  rulesWinTrick: 'L-ogħla briscla tirbaħ; bla briscla, l-ogħla karta tal-kulur mitlub.',
  rulesScoreTitle: 'Il-punti',
  rulesScoreOk: 'Kuntratt milħuq',
  rulesScoreOkExample: 'Ħabbart 3, għamilt 3 → 16-il punt',
  rulesScoreKo: 'Kuntratt mitluf',
  rulesScoreKoExample: 'Ħabbart 3, għamilt 1 → −4 punti',
  rulesScoreZero:
    'Tħabbar 0 u ma tagħmel l-ebda daqqa jġib 10 punti: kuntratt profittabbli ħafna.',
  rulesEndTitle: 'Tmiem il-logħba',
  rulesEndText:
    'Meta jintlagħbu r-rawnds kollha, jirbaħ il-plejer bl-aktar punti. It-tabella tal-punteġġi tista’ tarraha meta trid matul il-logħba.',
  rulesTip:
    'Parir: fir-rawnds żgħar, ass jew briscla għolja ħafna drabi jkunu biżżejjed biex tiżgura daqqa. Fil-kbar, oqgħod attent għall-kuluri twal.',
  rulesGotIt: 'Fhimt',

  // Notifiki ‘imissek int’
  notificationsTitle: 'Avżani meta jmissni',
  notificationsHint:
    'Poġġi t-telefon fil-ġenb: nibagħtulek notifika hekk kif il-mejda tkun qed tistenniek. Ideali għal logħbiet mifruxa fuq il-jum kollu.',
  notificationsEnable: 'Ixgħel in-notifiki',
  notificationsOn: 'Notifiki mixgħula',
  notificationsOff: 'Notifiki mitfija',
  notificationsChecking: 'Qed niċċekkjaw…',
  notificationsUnsupported: 'Il-browser tiegħek ma jimmaniġġjax notifiki.',
  notificationsNeedsInstall:
    "Fuq iPhone u iPad, l-ewwel żid ir-Rikiki mal-iskrin tal-bidu (Aqsam → ‘Fuq l-Iskrin tal-Bidu’), imbagħad erġa' ejja hawn.",
  notificationsDenied:
    "In-notifiki huma mblukkati għal dan is-sit. Erġa' ixgħelhom mis-settings tal-browser.",
  notificationsNoServiceWorker:
    "In-notifiki mhumiex disponibbli hawn (installa l-app jew erġa' agħbba l-paġna).",
  notificationsServerOff: 'In-notifiki mhumiex ikkonfigurati fuq is-server.',
  notificationsError: 'Ma nistgħux nibdlu n-notifiki.',

  updateAvailable: 'Verżjoni ġdida',
  updateReload: 'Aġġorna',
  version: (v: string) => `verżjoni ${v}`,

  // Aċċessibbiltà
  accessibility: 'Aċċessibbiltà',
  colorblindMode: 'Kuluri distinti',
  colorblindHint:
    'Tint għal kull kulur, biex tagħżel ♥ ♦ ♠ ♣ bla ma toqgħod fuq l-aħmar',
  suitNames: { S: 'spadi', H: 'koppi', D: 'kwart', C: 'bastuni' },
  rankNames: { 11: 'fanti', 12: 'reġina', 13: 're', 14: 'ass' },
  cardOf: (rank: string, suit: string) => `${rank} ta' ${suit}`,
  handOf: (n: number) => `Il-karti tiegħek: ${karti(n)}`,

  language: 'Lingwa',
  languageHint: 'Agħżel il-lingwa tal-app',

  loading: 'Qed jitgħabba…',
  errorTitle: 'Oops',
  copyright: '© 2026 Nicolas Simon',
};

export default mt;
