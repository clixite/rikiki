import type { Messages } from '../types';

/**
 * Latviešu valodas skaitļa vārda saskaņojums:
 *  - vienskaitlis, ja skaitlis beidzas ar 1 (izņemot 11): 1, 21, 31…
 *  - daudzskaitļa ģenitīvs, ja skaitlis beidzas ar 0 vai ir 11–19: 0, 10, 11…19, 20…
 *  - citādi daudzskaitļa nominatīvs: 2–9, 22–29…
 */
const lvW = (n: number, one: string, other: string, genitive: string): string => {
  const d = n % 10;
  const c = n % 100;
  if (d === 0 || (c >= 11 && c <= 19)) return genitive;
  if (d === 1) return one;
  return other;
};

const lvN = (n: number, one: string, other: string, genitive: string): string =>
  `${n} ${lvW(n, one, other, genitive)}`;

export const lv: Messages = {
  appName: 'Rikiki',
  tagline: 'Stiķu spēle draugu lokā, katrs savā telefonā',

  // Sākums
  createGame: 'Izveidot spēli',
  joinGame: 'Pievienoties spēlei',
  resumeGame: 'Turpināt spēli',
  myGames: 'Manas spēles',

  // Profils
  yourPseudo: 'Tavs segvārds',
  pickAvatar: 'Izvēlies avatāru',
  letsGo: 'Sākam!',
  save: 'Saglabāt',
  editProfile: 'Mans profils',
  changeAvatar: 'Mainīt avatāru',

  // Pievienošanās
  enterCode: 'Spēles kods',
  join: 'Pievienoties',
  gameCode: 'Spēles kods',
  copyLink: 'Kopēt saiti',
  copied: 'Saite nokopēta!',

  // Uzgaidāmā telpa
  invite: 'Uzaicināt draugus',
  players: 'Spēlētāji',
  host: 'Saimnieks',
  you: 'tu',
  waitingForHost: 'Gaidām, kad saimnieks sāks…',
  waitingForHostNamed: (p: string) => `${p} sāks spēli, kad visi būs klāt`,
  needPlayers: (missing: number) =>
    `Vēl ${lvN(missing, 'spēlētājs', 'spēlētāji', 'spēlētāju')}, lai sāktu`,
  startGame: 'Sākt spēli',
  leave: 'Iziet',
  kick: 'Izņemt',
  addBot: 'Pievienot robotu',
  addBotHint: 'Papildini galdu ar automātisku spēlētāju',
  botsFull: 'Galds ir pilns',
  removeBot: 'Noņemt robotu',

  // Spēles formāts (garums)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Spēles iestatījumi',
  gameSettingsHint: 'Rīkotājs izvēlas pirms sākuma',
  gameSettingsLocked: 'Iestatījumus izvēlas rīkotājs',
  settingsDone: 'Gatavs',

  gameFormat: 'Spēles formāts',
  gameFormatHint: 'Izvēlies garumu pirms sākuma',
  formatNames: {
    blitz: 'Zibens',
    normal: 'Parasts',
    climb: 'Augošs',
  },
  formatDescriptions: {
    blitz: 'Kāpums un kritums līdz 5 kārtīm',
    normal: 'Pilns kāpums un pilns kritums',
    climb: 'Tikai kāpums, bez krituma',
  },
  formatRounds: (n: number) => lvN(n, 'kārta', 'kārtas', 'kārtu'),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formātu izvēlējās saimnieks',

  // Barème de score
  scoringVariant: 'Punktu skaitīšana',
  scoringHint: 'Kā tiek skaitīti punkti',
  scoringNames: {
    classic: 'Klasiskā',
    gentle: 'Saudzīgā',
    always: 'Stiķi vienmēr skaitās',
  },
  scoringDescriptions: {
    classic: 'Solījums izpildīts: 10 + 2 par stiķi. Neizpildīts: −2 par katru stiķa starpību.',
    gentle: 'Solījums izpildīts: 10 + 1 par stiķi. Neizpildīts: 0, bez soda.',
    always: 'Tavi stiķi vienmēr dod punktus, +10 par izpildītu solījumu.',
  },
  scoringLocked: 'Skaitīšanu izvēlas rīkotājs',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Temps',
  gamePaceHint: 'Kopā vai katrs, kad var',
  paceNames: {
    live: 'Tiešraidē',
    async: 'Savā tempā',
  },
  paceDescriptions: {
    live: 'Visi spēlē vienlaikus; pārāk ilgs gājiens tiek nospēlēts automātiski.',
    async: 'Katrs spēlē, kad var, pat vairākas dienas. Neviens nespēlē tavā vietā.',
  },
  paceLocked: 'Tempu izvēlas rīkotājs',
  waitingForPlayer: (pseudo: string) => `Gaida ${pseudo}`,
  waitingToStart: 'Gaida sākumu',

  // Spēles galds
  round: 'Kārta',
  cards: (n: number) => lvN(n, 'kārts', 'kārtis', 'kāršu'),
  trump: 'Trumpis',
  noTrump: 'Bez trumpja',
  dealer: 'Dalītājs',
  offline: 'bezsaistē',
  thinking: '…',
  yourBid: 'Cik stiķu?',
  bidsTotal: (sum: number, cards: number) =>
    `Pieteikts: ${sum} / ${lvN(cards, 'stiķis', 'stiķi', 'stiķu')}`,
  hookForbidden: (n: number) => `Aizliegts: kopsumma būtu tieši ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} ir aizliegts: pieteikumu summa nedrīkst būt tieši ${cards} (āķa noteikums).`,
  bid: 'Pieteikums',
  tricks: 'Stiķi',
  lastTrick: 'Pēdējais stiķis',
  spreadHand: 'Izklāt kārtis',
  collapseHand: 'Savākt kārtis',

  // Kārtas pieteikumi
  bidsAnnounced: 'Pieteikts',
  bidsPending: (announced: number, cards: number) =>
    `${announced} no ${cards} — pieteikumi turpinās`,
  bidsBalanced: (cards: number) =>
    `Tieši līdzsvarā: ${lvN(cards, 'stiķis', 'stiķi', 'stiķu')}`,
  bidsOver: (n: number) =>
    `${lvN(n, 'stiķis', 'stiķi', 'stiķu')} par daudz: kāds kritīs`,
  bidsUnder: (n: number) => `Pāri paliek ${lvN(n, 'stiķis', 'stiķi', 'stiķu')}`,
  noBidYet: 'Vēl nav pieteicis',
  tricksOfContract: (tricks: number, bid: number) =>
    `${tricks}/${bid} ${lvW(bid, 'stiķis', 'stiķi', 'stiķu')}`,
  yourTurn: 'Tavs gājiens',
  turnOf: (p: string) => `Gājiens: ${p}`,
  trickWonBy: (p: string) => `${p} paņem stiķi`,
  scoreboard: 'Rezultāti',
  total: 'Kopā',

  // Kopsavilkums
  roundRecap: 'Kārta beigusies',
  contractKept: 'Līgums izpildīts',
  contractMissed: 'Līgums izgāzts',
  contract: 'Līgums',
  points: 'Punkti',
  nextRound: 'Nākamā kārta',
  seeResults: 'Skatīt rezultātus',
  waitingNextRound: 'Saimnieks sāks nākamo kārtu…',

  // Spēles beigas
  gameOver: 'Spēle beigusies',
  shareResult: 'Dalīties ar rezultātu',
  shareTitle: 'Rikiki spēle beigusies 🃏',
  shareSaved: 'Attēls saglabāts',
  playAgain: 'Spēlēt vēlreiz',
  backHome: 'Sākums',

  // Skaņa
  soundOn: 'Ieslēgt skaņu',
  soundOff: 'Izslēgt skaņu',

  // Tīkls
  reconnecting: 'Atjauno savienojumu…',
  playerDisconnected: (p: string) => `${p} zaudēja savienojumu`,
  playerReconnected: (p: string) => `${p} ir atpakaļ`,
  playerPaused: (p: string) => `${p} paņem pauzi`,
  playerResumed: (p: string) => `${p} atgriežas spēlē`,
  playerJoined: (p: string) => `${p} pievienojās spēlei`,
  playerLeft: (p: string) => `${p} pameta spēli`,
  roomClosed: 'Spēle ir slēgta.',
  roomClosedKicked: 'Tu tiki izņemts no spēles.',
  roomClosedExpired: 'Spēles termiņš ir beidzies.',

  // Ielūgumi
  inviteMessage: (code: string, url: string) =>
    `Nāc spēlēt Rikiki kopā ar mums! 🃏\nSpēles kods: ${code}\nPievienojies šeit: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Kopīgot',

  // Konts
  saveAccount: 'Saglabāt manu progresu',
  saveAccountHint: 'Saņem saiti e-pastā — nekādu paroļu, ko atcerēties',
  emailPlaceholder: 'tavs@pasts.lv',
  sendMagicLink: 'Nosūtīt saiti',
  magicLinkSent: 'E-pasts nosūtīts! Atver saiti, lai apstiprinātu.',
  accountSaved: 'Progress saglabāts',
  verifying: 'Pārbaudām…',
  verified: 'Konts apstiprināts! Tavs progress ir saglabāts.',
  verifyFailed: 'Saite nederīga vai novecojusi. Pieprasi jaunu savā profilā.',

  privacyPolicy: 'Privātums',
  deleteAccount: 'Dzēst manu kontu',
  deleteAccountHint: 'Dzēš tavu profilu, vēsturi un grupas.',
  deleteAccountWarning: 'Tavs segvārds, spēles, statistika un grupas tiks dzēstas. Šo darbību nevar atsaukt.',
  deleteAccountAction: 'Jā, dzēst visu',
  deleteAccountDone: 'Konts ir dzēsts.',
  cancel: 'Atcelt',
  botTag: 'bots',
  emotes: 'Reakcijas',
  phrases: 'Ziņas',
  phraseTexts: {
    nice: 'Labi nospēlēts!',
    oops: 'Ai…',
    yourTurn: 'Tava kārta!',
    hurry: 'Mēs gaidām 🙂',
    watchTrump: 'Uzmanies no trumpja',
    mine: 'Šī ir mana',
    sorry: 'Atvaino!',
    brb: 'Tūlīt būšu atpakaļ',
    goodGame: 'Laba spēle!',
    again: 'Vēl vienu?',
  },
  pauseGame: 'Paņemt pauzi',
  resumePlay: 'Esmu atpakaļ',
  pausedTag: 'pauzē',
  pauseHint: 'Kamēr tevis nav, tavu vietu tur robots.',
  close: 'Aizvērt',
  leaveGame: 'Pamest spēli',
  leaveGameWarning:
    'Spēle turpinās bez tevis, un tavi šīs spēles punkti tiek zaudēti.',
  leaveGameAction: 'Jā, pamest',
  takePhoto: 'Uzņemt fotoattēlu',
  removePhoto: 'Noņemt fotoattēlu',
  photoError: 'Fotoattēls ir pārāk liels vai nesalasāms.',
  reportPlayer: 'Ziņot',
  reportDone: 'Fotoattēls paslēpts un ziņots.',

  // Statistika un vēsture
  stats: 'Statistika',
  gamesPlayed: 'spēles',
  gamesWon: 'uzvaras',
  bestRound: 'labākā kārta',
  contractsKept: 'Izpildītie solījumi',
  noHistory: 'Pagaidām nav nevienas pabeigtas spēles.',
  historyTitle: 'Manas pēdējās spēles',
  wonBadge: 'Uzvara',
  lostBadge: 'Zaudējums',
  playersCount: (n: number) => lvN(n, 'spēlētājs', 'spēlētāji', 'spēlētāju'),

  // Draugu grupas
  groups: 'Manas grupas',
  groupsTitle: 'Manas grupas',
  groupsSubtitle: 'Kopvērtējums tiem, kas vienmēr spēlē kopā',
  noGroups: 'Pagaidām tu neesi nevienā grupā.',
  createGroup: 'Izveidot grupu',
  createGroupCta: 'Izveidot grupu',
  groupNamePlaceholder: 'Otrdienas draugi',
  groupNameLabel: 'Grupas nosaukums',
  groupNameTooShort: 'Nosaukumam jābūt no 2 līdz 30 rakstzīmēm.',
  joinGroup: 'Pievienoties grupai',
  joinGroupCta: 'Pievienoties',
  groupCodeLabel: 'Grupas kods',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 burti, bez I, L un O',
  groupCode: 'Grupas kods',
  groupShareHint: 'Padalies ar kodu, lai draugi var pievienoties grupai',
  copyGroupCode: 'Kopēt kodu',
  groupCodeCopied: 'Kods nokopēts!',
  groupMembers: (n: number) => lvN(n, 'dalībnieks', 'dalībnieki', 'dalībnieku'),
  groupGames: (n: number) =>
    n === 0 ? 'nav spēļu' : lvN(n, 'spēle', 'spēles', 'spēļu'),
  groupRanking: 'Kopvērtējums',
  groupRecentGames: 'Grupas pēdējās spēles',
  groupNoGames: 'Grupā pagaidām nav spēlēts.',
  groupNoGamesHint: 'Sāc spēli ar šo grupu — rezultāti parādīsies šeit.',
  groupPlay: 'Spēlēt ar šo grupu',
  groupOwner: 'Izveidotājs',
  groupLeave: 'Pamest grupu',
  groupLeaveConfirm: 'Pamest šo grupu? Tavas iepriekšējās spēles paliks kopvērtējumā.',
  groupDelete: 'Dzēst grupu',
  groupDeleteConfirm: 'Dzēst šo grupu un visu tās kopvērtējumu? To nevar atsaukt.',
  groupOwnerCannotLeave: 'Tu izveidoji šo grupu: tu vari to tikai dzēst.',
  groupNotFound: 'Grupa nav atrasta.',
  groupJoined: (name: string) => `Tu pievienojies grupai „${name}“!`,
  groupCreated: (name: string) => `Grupa „${name}“ izveidota!`,
  groupAttached: (name: string) => `Spēle piesaistīta grupai „${name}“`,
  groupTotalPoints: 'punkti',
  groupRankHeader: '#',
  groupPlayerHeader: 'Spēlētājs',
  groupPointsHeader: 'P',
  groupPlayedHeader: 'S',
  groupWonHeader: 'U',

  // Spēles noteikumi
  rules: 'Spēles noteikumi',
  rulesTitle: 'Kā spēlēt',
  demoTitle: 'Spēle vienā minūtē',
  demoPlay: 'Sākt demonstrāciju',
  demoPause: 'Apturēt',
  demoReplay: 'Skatīties vēlreiz',
  demoPrev: 'Iepriekšējais solis',
  demoNext: 'Nākamais solis',
  demoDeal: 'Katrs saņem savas kārtis. Pēdējā atklātā nosaka trumpi: tā masts pārspēj visus pārējos.',
  demoBid: 'Katrs pasaka, cik stiķus grasās ņemt. Dalītājs saka pēdējais un nedrīkst likt summai sanākt tieši.',
  demoFollow: 'Izspēlētais masts jāpiemet, ja tāds ir. Tikai citādi spēlē, ko gribi.',
  demoTrump: 'Trumpis, pat viszemākais, paņem stiķi no izspēlētā masta.',
  demoScore: 'Solījums izpildīts: 10 punkti plus 2 par stiķi. Neizpildīts: 2 punkti nost par katru stiķa starpību.',
  rulesSubtitle: 'Rikiki divās minūtēs',
  rulesGoalTitle: 'Būtība',
  rulesGoalText:
    'Pirms katras kārtas jūs piesakāt, cik stiķu domājat paņemt. Viss būtiskais ir trāpīt precīzi: ne vairāk, ne mazāk. Daudz stiķu nelīdz, ja pieteicāt maz.',
  rulesDealTitle: 'Dalīšana',
  rulesDealText:
    'Spēle notiek vairākās kārtās. Pirmajā katram izdala tikai vienu kārti, tad divas, tad trīs… un pēc tam atkal uz leju. Katrā kārtā visi saņem vienādu kāršu skaitu.',
  rulesTrumpText: 'Viena kārts tiek atklāta: tās masts ir kārtas trumpis.',
  rulesBidTitle: 'Pieteikums',
  rulesBidText:
    'Pēc kārtas katrs piesaka iecerēto stiķu skaitu — no 0 līdz kāršu skaitam rokā. Pirms lemšanas tu redzi savas kārtis un trumpi.',
  rulesHookTitle: 'Āķa noteikums',
  rulesHookText:
    'Pēdējais pieteicējs (dalītājs) nedrīkst izvēlēties skaitli, ar kuru pieteikumu summa būtu tieši vienāda ar kārtas stiķu skaitu. Tātad kāds noteikti paliks vīlies. Aizliegtais skaitlis tiek automātiski nosvītrots.',
  rulesPlayTitle: 'Stiķu izspēle',
  rulesPlayText:
    'Pirmais iet spēlētājs pa kreisi no dalītāja. Katrs uzliek vienu kārti, un stiprākā paņem stiķi. Uzvarētājs sāk nākamo stiķi.',
  rulesFollowSuit: 'Tev jāpiemet prasītais masts, ja tāds ir rokā.',
  rulesNoSuit: 'Ja nav — spēlē, ko vēlies: cērt ar trumpi vai atmet kārti.',
  rulesWinTrick: 'Uzvar augstākais trumpis; bez trumpja — augstākā izspēlētā masta kārts.',
  rulesScoreTitle: 'Punkti',
  rulesScoreOk: 'Līgums izpildīts',
  rulesScoreOkExample: 'Pieteikts 3, paņemts 3 → 16 punkti',
  rulesScoreKo: 'Līgums izgāzts',
  rulesScoreKoExample: 'Pieteikts 3, paņemts 1 → −4 punkti',
  rulesScoreZero:
    'Pieteikt 0 un nepaņemt nevienu stiķi dod 10 punktus: ļoti izdevīgs līgums.',
  rulesScoreVariants: 'Rīkotājs telpā var izvēlēties citu punktu skaitīšanu:',
  rulesEndTitle: 'Spēles beigas',
  rulesEndText:
    'Kad visas kārtas nospēlētas, uzvar spēlētājs ar vislielāko punktu skaitu. Rezultātu tabulu var apskatīt jebkurā spēles brīdī.',
  rulesTip:
    'Padoms: mazajās kārtās stiķim bieži pietiek ar dūzi vai augstu trumpi. Lielajās uzmanies no gariem mastiem.',
  rulesGotIt: 'Sapratu',

  // Paziņojumi „tava kārta“
  notificationsTitle: 'Paziņot, kad pienāk mana kārta',
  notificationsHint:
    'Noliec telefonu: mēs paziņosim, tiklīdz galds tevi gaidīs. Ideāli spēlēm, kas velkas visu dienu.',
  notificationsEnable: 'Ieslēgt paziņojumus',
  notificationsOn: 'Paziņojumi ieslēgti',
  notificationsOff: 'Paziņojumi izslēgti',
  notificationsChecking: 'Pārbaudām…',
  notificationsUnsupported: 'Tava pārlūkprogramma neatbalsta paziņojumus.',
  notificationsNeedsInstall:
    'iPhone un iPad ierīcēs vispirms pievieno Rikiki sākuma ekrānam (Kopīgot → „Pievienot sākuma ekrānam“) un tad atgriezies šeit.',
  notificationsDenied:
    'Paziņojumi šai vietnei ir bloķēti. Atļauj tos pārlūka iestatījumos.',
  notificationsNoServiceWorker:
    'Paziņojumi šeit nav pieejami (instalē lietotni vai pārlādē lapu).',
  notificationsServerOff: 'Paziņojumi serverī nav konfigurēti.',
  notificationsError: 'Neizdevās mainīt paziņojumus.',

  updateAvailable: 'Jauna versija',
  updateReload: 'Atjaunināt',
  version: (v: string) => `versija ${v}`,

  // Accessibilité
  accessibility: 'Pieejamība',
  colorblindMode: 'Atšķirīgas krāsas',
  colorblindHint: 'Katrai mastai sava krāsa, lai ♥ ♦ ♠ ♣ atšķirtos arī bez sarkanās',
  suitNames: { S: 'pīķa', H: 'ercena', D: 'kāravas', C: 'kreiča' } as Record<string, string>,
  rankNames: { 11: 'kalps', 12: 'dāma', 13: 'kungs', 14: 'dūzis' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${suit} ${rank}`,
  handOf: (n: number) => `Tava roka: ${lvN(n, 'kārts', 'kārtis', 'kāršu')}`,

  language: 'Valoda',
  languageHint: 'Izvēlies lietotnes valodu',

  loading: 'Ielādē…',
  errorTitle: 'Ups',
  copyright: '© 2026 Clixite SRL',
};

export default lv;
