import type { Messages } from '../types';

/**
 * Pluriel slovène : quatre formes, dont un duel.
 *   n % 100 === 1        → ednina (1 karta)
 *   n % 100 === 2        → dvojina, le duel (2 karti, 102 karti)
 *   n % 100 === 3 ou 4   → množina courte (3 karte)
 *   le reste             → rodilnik množine (5 kart, 101 → ednina, 0 kart)
 */
function plural(n: number, one: string, two: string, few: string, other: string): string {
  const mod100 = n % 100;
  if (mod100 === 1) return one;
  if (mod100 === 2) return two;
  if (mod100 === 3 || mod100 === 4) return few;
  return other;
}

const stihi = (n: number): string =>
  plural(n, '1 štih', `${n} štiha`, `${n} štihi`, `${n} štihov`);

export const sl: Messages = {
  appName: 'Rikiki',
  tagline: 'Igra štihov s prijatelji, vsak na svojem telefonu',

  // Domov
  createGame: 'Ustvari igro',
  joinGame: 'Pridruži se igri',
  resumeGame: 'Nadaljuj igro',
  myGames: 'Moje igre',

  // Profil
  yourPseudo: 'Tvoj vzdevek',
  pickAvatar: 'Izberi avatar',
  letsGo: 'Gremo!',
  save: 'Shrani',
  editProfile: 'Moj profil',
  changeAvatar: 'Zamenjaj avatar',

  // Pridružitev
  enterCode: 'Koda igre',
  join: 'Pridruži se',
  gameCode: 'Koda igre',
  copyLink: 'Kopiraj povezavo',
  copied: 'Povezava kopirana!',

  // Predsoba
  invite: 'Povabi prijatelje',
  players: 'Igralci',
  host: 'Gostitelj',
  you: 'ti',
  waitingForHost: 'Čakamo, da gostitelj začne…',
  waitingForHostNamed: (p: string) => `${p} začne igro, ko bodo vsi tu`,
  needPlayers: (missing: number) =>
    plural(
      missing,
      'Še 1 igralec za začetek',
      `Še ${missing} igralca za začetek`,
      `Še ${missing} igralci za začetek`,
      `Še ${missing} igralcev za začetek`,
    ),
  startGame: 'Začni igro',
  leave: 'Zapusti',
  kick: 'Odstrani',
  addBot: 'Dodaj robota',
  addBotHint: 'Dopolni mizo z avtomatskim igralcem',
  botsFull: 'Miza je polna',
  removeBot: 'Odstrani robota',

  // Format igre (dolžina)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Nastavitve igre',
  gameSettingsHint: 'Gostitelj izbere pred začetkom',
  gameSettingsLocked: 'Nastavitve izbere gostitelj',
  settingsDone: 'Končano',

  gameFormat: 'Format igre',
  gameFormatHint: 'Izberi dolžino pred začetkom',
  formatNames: {
    blitz: 'Bliskovita',
    normal: 'Običajna',
    climb: 'Naraščajoča',
  },
  formatDescriptions: {
    blitz: 'Gor in dol do 5 kart',
    normal: 'Celoten vzpon in spust',
    climb: 'Samo navzgor, brez spusta',
  },
  formatRounds: (n: number) =>
    plural(n, '1 krog', `${n} kroga`, `${n} krogi`, `${n} krogov`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Format izbere gostitelj',

  // Barème de score
  scoringVariant: 'Točkovanje',
  scoringHint: 'Kako se štejejo točke',
  scoringNames: {
    classic: 'Klasično',
    gentle: 'Prizanesljivo',
    always: 'Štihi vedno štejejo',
  },
  scoringDescriptions: {
    classic: 'Napoved dosežena: 10 + 2 na štih. Zgrešena: −2 za vsak štih razlike.',
    gentle: 'Napoved dosežena: 10 + 1 na štih. Zgrešena: 0, brez kazni.',
    always: 'Tvoji štihi vedno prinesejo točke, +10 ob doseženi napovedi.',
  },
  scoringLocked: 'Točkovanje izbere gostitelj',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Ritem',
  gamePaceHint: 'Skupaj ali vsak, ko utegne',
  paceNames: {
    live: 'V živo',
    async: 'V lastnem ritmu',
  },
  paceDescriptions: {
    live: 'Vsi igrajo hkrati; predolga poteza se odigra sama.',
    async: 'Vsak igra, ko utegne, tudi več dni. Nihče ne igra namesto tebe.',
  },
  paceLocked: 'Ritem izbere gostitelj',
  waitingForPlayer: (pseudo: string) => `Čaka se ${pseudo}`,
  waitingToStart: 'Čaka se začetek',

  // Miza
  round: 'Krog',
  cards: (n: number) => plural(n, '1 karta', `${n} karti`, `${n} karte`, `${n} kart`),
  trump: 'Adut',
  noTrump: 'Brez aduta',
  dealer: 'Delivec',
  offline: 'ni povezan',
  thinking: '…',
  yourBid: 'Koliko štihov?',
  bidsTotal: (sum: number, cards: number) => `Napovedano: ${sum} / ${stihi(cards)}`,
  hookForbidden: (n: number) => `Prepovedano: vsota bi bila točno ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} je prepovedan: vsota napovedi ne sme biti enaka ${cards} (pravilo kljuke).`,
  bid: 'Napoved',
  tricks: 'Štihi',
  lastTrick: 'Zadnji štih',
  spreadHand: 'Razgrni karte',
  collapseHand: 'Strni karte',

  // Povzetek napovedi kroga
  bidsAnnounced: 'Napovedano',
  bidsPending: (announced: number, cards: number) =>
    `${announced} od ${cards} — napovedi še tečejo`,
  bidsBalanced: (cards: number) => `Vsota se izide: ${stihi(cards)}`,
  bidsOver: (n: number) =>
    plural(
      n,
      '1 štih preveč: nekdo bo padel',
      `${n} štiha preveč: nekdo bo padel`,
      `${n} štihi preveč: nekdo bo padel`,
      `${n} štihov preveč: nekdo bo padel`,
    ),
  bidsUnder: (n: number) =>
    plural(
      n,
      '1 štih ostane za pobrat',
      `${n} štiha ostaneta za pobrat`,
      `${n} štihi ostanejo za pobrat`,
      `${n} štihov ostane za pobrat`,
    ),
  noBidYet: 'Še brez napovedi',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} štihov`,
  yourTurn: 'Ti si na vrsti',
  turnOf: (p: string) => `Na vrsti: ${p}`,
  trickWonBy: (p: string) => `${p} pobere štih`,
  scoreboard: 'Rezultati',
  total: 'Skupaj',

  // Povzetek
  roundRecap: 'Konec kroga',
  contractKept: 'Obveza izpolnjena',
  contractMissed: 'Obveza zgrešena',
  contract: 'Obveza',
  points: 'Točke',
  nextRound: 'Naslednji krog',
  seeResults: 'Poglej rezultate',
  waitingNextRound: 'Gostitelj bo začel naslednji krog…',

  // Konec igre
  gameOver: 'Konec igre',
  shareResult: 'Deli rezultat',
  shareTitle: 'Partija Rikiki končana 🃏',
  shareSaved: 'Slika shranjena',
  playAgain: 'Še enkrat',
  backHome: 'Domov',

  // Zvok
  soundOn: 'Vklopi zvok',
  soundOff: 'Izklopi zvok',

  // Omrežje
  reconnecting: 'Ponovno povezovanje…',
  playerDisconnected: (p: string) => `${p} je izgubil povezavo`,
  playerReconnected: (p: string) => `${p} je spet tu`,
  playerPaused: (p: string) => `${p} ima odmor`,
  playerResumed: (p: string) => `${p} se vrača v igro`,
  playerJoined: (p: string) => `${p} se pridruži igri`,
  playerLeft: (p: string) => `${p} zapusti igro`,
  roomClosed: 'Igra je bila zaprta.',
  roomClosedKicked: 'Odstranili so te iz igre.',
  roomClosedExpired: 'Igra je potekla.',

  // Povabila
  inviteMessage: (code: string, url: string) =>
    `Pridi igrat Rikiki z nami! 🃏\nKoda igre: ${code}\nPridruži se tukaj: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Deli',

  // Račun
  saveAccount: 'Shrani moj napredek',
  saveAccountHint: 'Povezavo dobiš po e-pošti — nobenega gesla za pomnjenje',
  emailPlaceholder: 'tvoj@email.si',
  sendMagicLink: 'Pošlji mi povezavo',
  magicLinkSent: 'E-pošta poslana! Odpri povezavo za potrditev.',
  accountSaved: 'Napredek shranjen',
  verifying: 'Preverjanje…',
  verified: 'Račun potrjen! Tvoj napredek je shranjen.',
  verifyFailed: 'Povezava ni veljavna ali je potekla. Zaprosi za novo v svojem profilu.',

  privacyPolicy: 'Zasebnost',
  deleteAccount: 'Izbriši moj račun',
  deleteAccountHint: 'Izbriše tvoj profil, zgodovino in skupine.',
  deleteAccountWarning: 'Tvoj vzdevek, igre, statistika in skupine bodo izbrisani. Dejanja ni mogoče razveljaviti.',
  deleteAccountAction: 'Da, izbriši vse',
  deleteAccountDone: 'Račun je izbrisan.',
  cancel: 'Prekliči',
  botTag: 'bot',
  emotes: 'Odzivi',
  phrases: 'Sporočila',
  phraseTexts: {
    nice: 'Lepo odigrano!',
    oops: 'Ojoj…',
    yourTurn: 'Ti si na vrsti!',
    hurry: 'Čakamo te 🙂',
    watchTrump: 'Pazi na adut',
    mine: 'Ta je moja',
    sorry: 'Oprosti!',
    brb: 'Takoj se vrnem',
    goodGame: 'Lepa igra!',
    again: 'Še eno?',
  },
  pauseGame: 'Vzemi odmor',
  resumePlay: 'Vrnil sem se',
  pausedTag: 'na odmoru',
  pauseHint: 'Med odmorom tvoje mesto drži robot.',
  close: 'Zapri',
  leaveGame: 'Zapusti igro',
  leaveGameWarning:
    'Igra se nadaljuje brez tebe, tvoje točke iz te igre pa so izgubljene.',
  leaveGameAction: 'Da, zapusti',
  takePhoto: 'Posnemi fotografijo',
  removePhoto: 'Odstrani fotografijo',
  photoError: 'Fotografija je prevelika ali neberljiva.',
  reportPlayer: 'Prijavi',
  reportDone: 'Fotografija skrita in prijavljena.',

  // Statistika in zgodovina
  stats: 'Statistika',
  gamesPlayed: 'iger',
  gamesWon: 'zmag',
  bestRound: 'najboljši krog',
  contractsKept: 'Izpolnjene napovedi',
  noHistory: 'Zaenkrat še nobene končane igre.',
  historyTitle: 'Moje zadnje igre',
  wonBadge: 'Zmaga',
  lostBadge: 'Poraz',
  playersCount: (n: number) =>
    plural(n, '1 igralec', `${n} igralca`, `${n} igralci`, `${n} igralcev`),

  // Skupine prijateljev
  groups: 'Moje skupine',
  groupsTitle: 'Moje skupine',
  groupsSubtitle: 'Skupna lestvica za tiste, ki vedno igrajo skupaj',
  noGroups: 'Zaenkrat nisi v nobeni skupini.',
  createGroup: 'Ustvari skupino',
  createGroupCta: 'Ustvari skupino',
  groupNamePlaceholder: 'Torkova druščina',
  groupNameLabel: 'Ime skupine',
  groupNameTooShort: 'Ime mora imeti med 2 in 30 znakov.',
  joinGroup: 'Pridruži se skupini',
  joinGroupCta: 'Pridruži se',
  groupCodeLabel: 'Koda skupine',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 črk, brez I, L in O',
  groupCode: 'Koda skupine',
  groupShareHint: 'Deli to kodo, da se prijatelji pridružijo skupini',
  copyGroupCode: 'Kopiraj kodo',
  groupCodeCopied: 'Koda kopirana!',
  groupMembers: (n: number) =>
    plural(n, '1 član', `${n} člana`, `${n} člani`, `${n} članov`),
  groupGames: (n: number) =>
    n === 0
      ? 'brez iger'
      : plural(n, '1 igra', `${n} igri`, `${n} igre`, `${n} iger`),
  groupRanking: 'Skupna lestvica',
  groupRecentGames: 'Zadnje igre skupine',
  groupNoGames: 'V skupini še ni bila odigrana nobena igra.',
  groupNoGamesHint: 'Zaigraj s to skupino — rezultati se bodo pojavili tukaj.',
  groupPlay: 'Igraj s to skupino',
  groupOwner: 'Ustanovitelj',
  groupLeave: 'Zapusti skupino',
  groupLeaveConfirm: 'Zapustiti to skupino? Tvoje odigrane igre ostanejo na lestvici.',
  groupDelete: 'Izbriši skupino',
  groupDeleteConfirm: 'Izbrisati to skupino in vso njeno lestvico? Tega ni mogoče razveljaviti.',
  groupOwnerCannotLeave: 'To je tvoja skupina — lahko jo samo izbrišeš.',
  groupNotFound: 'Skupine ni mogoče najti.',
  groupJoined: (name: string) => `Zdaj si v skupini »${name}«!`,
  groupCreated: (name: string) => `Skupina »${name}« ustvarjena!`,
  groupAttached: (name: string) => `Igra pripisana skupini »${name}«`,
  groupTotalPoints: 'točk',
  groupRankHeader: '#',
  groupPlayerHeader: 'Igralec',
  groupPointsHeader: 'Tč',
  groupPlayedHeader: 'I',
  groupWonHeader: 'Z',

  // Pravila igre
  rules: 'Pravila igre',
  rulesTitle: 'Kako se igra',
  demoTitle: 'Igra v eni minuti',
  demoPlay: 'Predvajaj predstavitev',
  demoPause: 'Premor',
  demoReplay: 'Poglej znova',
  demoPrev: 'Prejšnji korak',
  demoNext: 'Naslednji korak',
  demoDeal: 'Vsak dobi svoje karte. Zadnja obrnjena določi adut: njegova barva premaga vse druge.',
  demoBid: 'Vsak napove, koliko štihov namerava vzeti. Delilec napove zadnji in ne sme pustiti, da bi se vsota izšla natanko.',
  demoFollow: 'Klicano barvo je treba priznati, če jo imaš. Šele sicer igraš, kar hočeš.',
  demoTrump: 'Adut, tudi najnižji, vzame štih pred klicano barvo.',
  demoScore: 'Napoved izpolnjena: 10 točk in 2 na štih. Zgrešena: 2 točki manj za vsak štih razlike.',
  rulesSubtitle: 'Rikiki v 2 minutah',
  rulesGoalTitle: 'Bistvo igre',
  rulesGoalText:
    'Pred vsakim krogom napoveš, koliko štihov misliš pobrati. Vsa umetnost je zadeti točno: ne več, ne manj. Veliko štihov ti nič ne koristi, če je bila napoved nizka.',
  rulesDealTitle: 'Delitev',
  rulesDealText:
    'Igra poteka v več krogih. V prvem dobi vsak samo eno karto, nato dve, nato tri… potem pa se spet spušča. V vsakem krogu imajo vsi enako število kart.',
  rulesTrumpText: 'Ena karta se obrne: njena barva je adut kroga.',
  rulesBidTitle: 'Napoved',
  rulesBidText:
    'Po vrsti napoveš število štihov, ki jih ciljaš — od 0 do števila kart v roki. Odločaš se glede na svoje karte in adut.',
  rulesHookTitle: 'Pravilo kljuke',
  rulesHookText:
    'Zadnji, ki napoveduje (delivec), ne sme izbrati števila, pri katerem bi se vsota napovedi natanko ujemala s številom štihov v krogu. Posledica: nekdo bo zagotovo razočaran. Prepovedano število je samodejno prečrtano.',
  rulesPlayTitle: 'Igranje štihov',
  rulesPlayText:
    'Začne igralec levo od delivca. Vsak položi eno karto, najmočnejša pobere štih. Zmagovalec začne naslednji štih.',
  rulesFollowSuit: 'Če imaš karto zahtevane barve, jo moraš odigrati.',
  rulesNoSuit: 'Sicer igraš, kar hočeš: sekaš z adutom ali odvržeš.',
  rulesWinTrick: 'Zmaga najvišji adut; brez aduta najvišja karta zahtevane barve.',
  rulesScoreTitle: 'Točke',
  rulesScoreOk: 'Obveza izpolnjena',
  rulesScoreOkExample: 'Napoved 3, doseženi 3 → 16 točk',
  rulesScoreKo: 'Obveza zgrešena',
  rulesScoreKoExample: 'Napoved 3, dosežen 1 → −4 točke',
  rulesScoreZero:
    'Napovedati 0 in ne pobrati nobenega štiha prinese 10 točk: zelo donosna obveza.',
  rulesScoreVariants: 'Gostitelj lahko v sobi izbere drugo točkovanje:',
  rulesEndTitle: 'Konec igre',
  rulesEndText:
    'Ko so odigrani vsi krogi, zmaga igralec z največ točkami. Tabelo rezultatov si lahko med igro ogledaš kadar koli.',
  rulesTip:
    'Nasvet: v kratkih krogih as ali visok adut ponavadi zadostuje za štih. V dolgih pazi na dolge barve.',
  rulesGotIt: 'Razumem',

  // Obvestila »ti si na vrsti«
  notificationsTitle: 'Obvesti me, ko sem na vrsti',
  notificationsHint:
    'Pospravi telefon: obvestilo ti pošljemo takoj, ko te miza čaka. Idealno za igre, raztegnjene čez ves dan.',
  notificationsEnable: 'Vklopi obvestila',
  notificationsOn: 'Obvestila vklopljena',
  notificationsOff: 'Obvestila izklopljena',
  notificationsChecking: 'Preverjanje…',
  notificationsUnsupported: 'Tvoj brskalnik ne podpira obvestil.',
  notificationsNeedsInstall:
    'Na iPhonu in iPadu najprej dodaj Rikiki na začetni zaslon (Deli → »Na začetni zaslon«), nato se vrni sem.',
  notificationsDenied:
    'Obvestila so za to stran blokirana. Ponovno jih vklopi v nastavitvah brskalnika.',
  notificationsNoServiceWorker:
    'Obvestila tukaj niso na voljo (namesti aplikacijo ali osveži stran).',
  notificationsServerOff: 'Obvestila na strežniku niso nastavljena.',
  notificationsError: 'Obvestil ni bilo mogoče spremeniti.',

  updateAvailable: 'Nova različica',
  updateReload: 'Posodobi',
  version: (v: string) => `različica ${v}`,

  // Dostopnost
  accessibility: 'Dostopnost',
  colorblindMode: 'Ločeni odtenki',
  colorblindHint:
    'Vsaka barva ima svoj odtenek, da ♥ ♦ ♠ ♣ ločiš tudi brez rdeče',
  // Rodilnik množine, da »as src« ali »kralj pikov« zveni pravilno
  suitNames: { S: 'pikov', H: 'src', D: 'karov', C: 'križev' } as Record<string, string>,
  rankNames: { 11: 'fant', 12: 'dama', 13: 'kralj', 14: 'as' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) =>
    `Tvoja roka: ${plural(n, '1 karta', `${n} karti`, `${n} karte`, `${n} kart`)}`,

  language: 'Jezik',
  languageHint: 'Izberi jezik aplikacije',

  loading: 'Nalaganje…',
  errorTitle: 'Ojoj',
  copyright: '© 2026 Clixite SRL',
};

export default sl;
