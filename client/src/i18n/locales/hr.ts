import type { Messages } from '../types';

/**
 * Pluriel croate : trois formes.
 *   n % 10 === 1, sauf 11              → jednina (1 karta, 21 karta)
 *   n % 10 = 2-4, sauf 12-14           → paukal  (3 karte, 22 karte)
 *   le reste                           → genitiv množine (5 karata, 11 karata)
 */
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const stihovi = (n: number): string =>
  plural(n, `${n} štih`, `${n} štiha`, `${n} štihova`);

export const hr: Messages = {
  appName: 'Rikiki',
  tagline: 'Igra štihova s prijateljima, svatko na svom mobitelu',

  // Početna
  createGame: 'Nova igra',
  joinGame: 'Pridruži se igri',
  resumeGame: 'Nastavi igru',
  myGames: 'Moje igre',

  // Profil
  yourPseudo: 'Tvoj nadimak',
  pickAvatar: 'Odaberi avatar',
  letsGo: 'Idemo!',
  save: 'Spremi',
  editProfile: 'Moj profil',
  changeAvatar: 'Promijeni avatar',

  // Pridruživanje
  enterCode: 'Kod igre',
  join: 'Pridruži se',
  gameCode: 'Kod igre',
  copyLink: 'Kopiraj poveznicu',
  copied: 'Poveznica kopirana!',

  // Predsoblje
  invite: 'Pozovi prijatelje',
  players: 'Igrači',
  host: 'Domaćin',
  you: 'ti',
  waitingForHost: 'Čekamo da domaćin pokrene igru…',
  waitingForHostNamed: (p: string) => `${p} započinje igru kad svi budu tu`,
  needPlayers: (missing: number) =>
    plural(
      missing,
      `Još ${missing} igrač za početak`,
      `Još ${missing} igrača za početak`,
      `Još ${missing} igrača za početak`,
    ),
  startGame: 'Pokreni igru',
  leave: 'Izađi',
  kick: 'Izbaci',
  addBot: 'Dodaj robota',
  addBotHint: 'Popuni stol automatskim igračem',
  botsFull: 'Stol je pun',
  removeBot: 'Ukloni robota',

  // Format igre (trajanje)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Postavke igre',
  gameSettingsHint: 'Domaćin bira prije početka',
  gameSettingsLocked: 'Postavke bira domaćin',
  settingsDone: 'Gotovo',

  gameFormat: 'Format igre',
  gameFormatHint: 'Odaberi trajanje prije početka',
  formatNames: {
    blitz: 'Munjevita',
    normal: 'Normalna',
    climb: 'Rastuća',
  },
  formatDescriptions: {
    blitz: 'Gore i dolje do 5 karata',
    normal: 'Puni uspon pa spust',
    climb: 'Samo uzlazno, bez spusta',
  },
  formatRounds: (n: number) => plural(n, `${n} runda`, `${n} runde`, `${n} rundi`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Format bira domaćin',

  // Barème de score
  scoringVariant: 'Bodovanje',
  scoringHint: 'Kako se broje bodovi',
  scoringNames: {
    classic: 'Klasično',
    gentle: 'Blago',
    always: 'Štihovi se broje',
  },
  scoringDescriptions: {
    classic: 'Najava pogođena: 10 + 2 po štihu. Promašena: −2 po štihu razlike.',
    gentle: 'Najava pogođena: 10 + 1 po štihu. Promašena: 0, bez kazne.',
    always: 'Tvoji štihovi uvijek nose bodove, +10 ako je najava pogođena.',
  },
  scoringLocked: 'Bodovanje bira domaćin',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Ritam',
  gamePaceHint: 'Zajedno ili svatko kad može',
  paceNames: {
    live: 'Uživo',
    async: 'Vlastitim ritmom',
  },
  paceDescriptions: {
    live: 'Svi igraju istovremeno; predug potez odigra se sam.',
    async: 'Svatko igra kad može, danima. Nitko ne igra umjesto tebe.',
  },
  paceLocked: 'Ritam bira domaćin',
  waitingForPlayer: (pseudo: string) => `Čeka se ${pseudo}`,
  waitingToStart: 'Čeka se početak',

  // Stol
  round: 'Runda',
  cards: (n: number) => plural(n, `${n} karta`, `${n} karte`, `${n} karata`),
  trump: 'Adut',
  noTrump: 'Bez aduta',
  dealer: 'Djelitelj',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Koliko štihova?',
  bidsTotal: (sum: number, cards: number) => `Najave: ${sum} / ${stihovi(cards)}`,
  hookForbidden: (n: number) => `Zabranjeno: zbroj bi bio točno ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} je zabranjen: zbroj najava ne smije biti jednak ${cards} (pravilo kuke).`,
  bid: 'Najava',
  tricks: 'Štihovi',
  lastTrick: 'Zadnji štih',
  spreadHand: 'Raširi karte',
  collapseHand: 'Skupi karte',

  // Pregled najava runde
  bidsAnnounced: 'Najavljeno',
  bidsPending: (announced: number, cards: number) =>
    `${announced} od ${cards} — najave u tijeku`,
  bidsBalanced: (cards: number) => `Zbroj se poklapa: ${stihovi(cards)}`,
  bidsOver: (n: number) =>
    plural(
      n,
      `${n} štih viška: netko će pasti`,
      `${n} štiha viška: netko će pasti`,
      `${n} štihova viška: netko će pasti`,
    ),
  bidsUnder: (n: number) =>
    plural(
      n,
      `Ostaje ${n} štih za pokupiti`,
      `Ostaju ${n} štiha za pokupiti`,
      `Ostaje ${n} štihova za pokupiti`,
    ),
  noBidYet: 'Još bez najave',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} štihova`,
  yourTurn: 'Ti si na redu',
  turnOf: (p: string) => `Na redu: ${p}`,
  trickWonBy: (p: string) => `${p} nosi štih`,
  scoreboard: 'Rezultati',
  total: 'Ukupno',

  // Sažetak
  roundRecap: 'Kraj runde',
  contractKept: 'Obveza ispunjena',
  contractMissed: 'Obveza promašena',
  contract: 'Obveza',
  points: 'Bodovi',
  nextRound: 'Sljedeća runda',
  seeResults: 'Pogledaj rezultate',
  waitingNextRound: 'Domaćin će pokrenuti sljedeću rundu…',

  // Kraj igre
  gameOver: 'Kraj igre',
  shareResult: 'Podijeli rezultat',
  shareTitle: 'Partija Rikikija završena 🃏',
  shareSaved: 'Slika spremljena',
  playAgain: 'Revanš',
  backHome: 'Početna',

  // Zvuk
  soundOn: 'Uključi zvuk',
  soundOff: 'Isključi zvuk',

  // Mreža
  reconnecting: 'Ponovno spajanje…',
  playerDisconnected: (p: string) => `${p} — veza prekinuta`,
  playerReconnected: (p: string) => `${p} je opet tu`,
  playerPaused: (p: string) => `${p} je na pauzi`,
  playerResumed: (p: string) => `${p} se vraća u igru`,
  playerJoined: (p: string) => `${p} ulazi u igru`,
  playerLeft: (p: string) => `${p} napušta igru`,
  roomClosed: 'Igra je zatvorena.',
  roomClosedKicked: 'Izbačen si iz igre.',
  roomClosedExpired: 'Igra je istekla.',

  // Pozivnice
  inviteMessage: (code: string, url: string) =>
    `Dođi igrati Rikiki s nama! 🃏\nKod igre: ${code}\nPridruži se ovdje: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Podijeli',

  // Račun
  saveAccount: 'Spremi moj napredak',
  saveAccountHint: 'Poveznicu dobivaš e-poštom — bez lozinke za pamćenje',
  emailPlaceholder: 'tvoj@email.hr',
  sendMagicLink: 'Pošalji mi poveznicu',
  magicLinkSent: 'E-pošta poslana! Otvori poveznicu za potvrdu.',
  accountSaved: 'Napredak spremljen',
  verifying: 'Provjera…',
  verified: 'Račun potvrđen! Tvoj napredak je spremljen.',
  verifyFailed: 'Poveznica nije valjana ili je istekla. Zatraži novu u svom profilu.',

  privacyPolicy: 'Privatnost',
  deleteAccount: 'Izbriši moj račun',
  deleteAccountHint: 'Briše tvoj profil, povijest i grupe.',
  deleteAccountWarning: 'Tvoj nadimak, partije, statistika i grupe bit će izbrisani. Radnju nije moguće poništiti.',
  deleteAccountAction: 'Da, izbriši sve',
  deleteAccountDone: 'Račun je izbrisan.',
  cancel: 'Odustani',
  botTag: 'bot',
  emotes: 'Reakcije',
  phrases: 'Poruke',
  phraseTexts: {
    nice: 'Lijepo odigrano!',
    oops: 'Ajoj…',
    yourTurn: 'Ti si na redu!',
    hurry: 'Čekamo te 🙂',
    watchTrump: 'Pazi na adut',
    mine: 'Ova je moja',
    sorry: 'Oprosti!',
    brb: 'Odmah se vraćam',
    goodGame: 'Dobra igra!',
    again: 'Još jednu?',
  },
  pauseGame: 'Uzmi pauzu',
  resumePlay: 'Vratio sam se',
  pausedTag: 'na pauzi',
  pauseHint: 'Dok te nema, tvoje mjesto drži robot.',
  close: 'Zatvori',
  leaveGame: 'Napusti partiju',
  leaveGameWarning:
    'Partija se nastavlja bez tebe, a tvoji bodovi iz ove partije su izgubljeni.',
  leaveGameAction: 'Da, napusti',
  takePhoto: 'Snimi fotografiju',
  removePhoto: 'Ukloni fotografiju',
  photoError: 'Fotografija je prevelika ili nečitljiva.',
  reportPlayer: 'Prijavi',
  reportDone: 'Fotografija skrivena i prijavljena.',

  // Statistika i povijest
  stats: 'Statistika',
  gamesPlayed: 'igara',
  gamesWon: 'pobjeda',
  bestRound: 'najbolja runda',
  noHistory: 'Zasad nema odigranih igara.',
  historyTitle: 'Moje zadnje igre',
  wonBadge: 'Pobjeda',
  lostBadge: 'Poraz',
  playersCount: (n: number) =>
    plural(n, `${n} igrač`, `${n} igrača`, `${n} igrača`),

  // Grupe prijatelja
  groups: 'Moje grupe',
  groupsTitle: 'Moje grupe',
  groupsSubtitle: 'Zajednička ljestvica za one koji uvijek igraju skupa',
  noGroups: 'Zasad nisi ni u jednoj grupi.',
  createGroup: 'Stvori grupu',
  createGroupCta: 'Stvori grupu',
  groupNamePlaceholder: 'Utorkova ekipa',
  groupNameLabel: 'Naziv grupe',
  groupNameTooShort: 'Naziv mora imati između 2 i 30 znakova.',
  joinGroup: 'Pridruži se grupi',
  joinGroupCta: 'Pridruži se',
  groupCodeLabel: 'Kod grupe',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 slova, bez I, L i O',
  groupCode: 'Kod grupe',
  groupShareHint: 'Podijeli ovaj kod da ti se prijatelji pridruže grupi',
  copyGroupCode: 'Kopiraj kod',
  groupCodeCopied: 'Kod kopiran!',
  groupMembers: (n: number) =>
    plural(n, `${n} član`, `${n} člana`, `${n} članova`),
  groupGames: (n: number) =>
    n === 0 ? 'nijedna igra' : plural(n, `${n} igra`, `${n} igre`, `${n} igara`),
  groupRanking: 'Ukupna ljestvica',
  groupRecentGames: 'Zadnje igre grupe',
  groupNoGames: 'U grupi još nije odigrana nijedna igra.',
  groupNoGamesHint: 'Zaigraj s ovom grupom — rezultati će se pojaviti ovdje.',
  groupPlay: 'Igraj s ovom grupom',
  groupOwner: 'Osnivač',
  groupLeave: 'Napusti grupu',
  groupLeaveConfirm: 'Napustiti ovu grupu? Tvoje odigrane igre ostaju na ljestvici.',
  groupDelete: 'Obriši grupu',
  groupDeleteConfirm: 'Obrisati ovu grupu i cijelu njezinu ljestvicu? To se ne može poništiti.',
  groupOwnerCannotLeave: 'Ovo je tvoja grupa — možeš je samo obrisati.',
  groupNotFound: 'Grupa nije pronađena.',
  groupJoined: (name: string) => `Sad si u grupi „${name}”!`,
  groupCreated: (name: string) => `Grupa „${name}” stvorena!`,
  groupAttached: (name: string) => `Igra pripisana grupi „${name}”`,
  groupTotalPoints: 'bodova',
  groupRankHeader: '#',
  groupPlayerHeader: 'Igrač',
  groupPointsHeader: 'B',
  groupPlayedHeader: 'O',
  groupWonHeader: 'P',

  // Pravila igre
  rules: 'Pravila igre',
  rulesTitle: 'Kako se igra',
  rulesSubtitle: 'Rikiki u 2 minute',
  rulesGoalTitle: 'Bit igre',
  rulesGoalText:
    'Prije svake runde najaviš koliko štihova misliš odnijeti. Sva je vještina pogoditi točno: ni više, ni manje. Puno štihova ne vrijedi ništa ako je najava bila mala.',
  rulesDealTitle: 'Dijeljenje',
  rulesDealText:
    'Igra se igra u više rundi. U prvoj svatko dobiva samo jednu kartu, pa dvije, pa tri… a zatim se opet spušta. U svakoj rundi svi imaju jednak broj karata.',
  rulesTrumpText: 'Jedna se karta okrene: njezina boja je adut runde.',
  rulesBidTitle: 'Najava',
  rulesBidText:
    'Redom najavljuješ broj štihova koji ciljaš — od 0 do broja karata u ruci. Odlučuješ gledajući svoje karte i adut.',
  rulesHookTitle: 'Pravilo kuke',
  rulesHookText:
    'Zadnji koji najavljuje (djelitelj) ne smije odabrati broj s kojim bi zbroj najava točno odgovarao broju štihova u rundi. Rezultat: netko će sigurno ostati razočaran. Zabranjeni je broj automatski precrtan.',
  rulesPlayTitle: 'Igranje štihova',
  rulesPlayText:
    'Izlazi igrač lijevo od djelitelja. Svatko polaže jednu kartu, a najjača nosi štih. Pobjednik izlazi u sljedeći štih.',
  rulesFollowSuit: 'Moraš poštovati traženu boju ako je imaš.',
  rulesNoSuit: 'Inače igraš što želiš: sječeš adutom ili bacaš.',
  rulesWinTrick: 'Pobjeđuje najviši adut; bez aduta najviša karta tražene boje.',
  rulesScoreTitle: 'Bodovi',
  rulesScoreOk: 'Obveza ispunjena',
  rulesScoreOkExample: 'Najava 3, odneseno 3 → 16 bodova',
  rulesScoreKo: 'Obveza promašena',
  rulesScoreKoExample: 'Najava 3, odneseno 1 → −4 boda',
  rulesScoreZero:
    'Najaviti 0 i ne odnijeti nijedan štih donosi 10 bodova: vrlo isplativa obveza.',
  rulesScoreVariants: 'Domaćin u sobi može odabrati drugo bodovanje:',
  rulesEndTitle: 'Kraj igre',
  rulesEndText:
    'Kad se odigraju sve runde, pobjeđuje igrač s najviše bodova. Tablicu rezultata možeš pogledati bilo kada tijekom igre.',
  rulesTip:
    'Savjet: u kratkim rundama as ili visok adut obično je dovoljan za štih. U dugima pazi na duge boje.',
  rulesGotIt: 'Razumijem',

  // Obavijesti „ti si na redu”
  notificationsTitle: 'Javi mi kad sam na redu',
  notificationsHint:
    'Spremi mobitel: šaljemo ti obavijest čim te stol čeka. Idealno za igre razvučene kroz cijeli dan.',
  notificationsEnable: 'Uključi obavijesti',
  notificationsOn: 'Obavijesti uključene',
  notificationsOff: 'Obavijesti isključene',
  notificationsChecking: 'Provjera…',
  notificationsUnsupported: 'Tvoj preglednik ne podržava obavijesti.',
  notificationsNeedsInstall:
    'Na iPhoneu i iPadu prvo dodaj Rikiki na početni zaslon (Podijeli → „Na početni zaslon”), pa se vrati ovamo.',
  notificationsDenied:
    'Obavijesti su blokirane za ovu stranicu. Ponovno ih uključi u postavkama preglednika.',
  notificationsNoServiceWorker:
    'Obavijesti ovdje nisu dostupne (instaliraj aplikaciju ili osvježi stranicu).',
  notificationsServerOff: 'Obavijesti nisu postavljene na poslužitelju.',
  notificationsError: 'Obavijesti nije moguće promijeniti.',

  updateAvailable: 'Nova verzija',
  updateReload: 'Ažuriraj',
  version: (v: string) => `verzija ${v}`,

  // Pristupačnost
  accessibility: 'Pristupačnost',
  colorblindMode: 'Odvojene nijanse',
  colorblindHint:
    'Svaka boja ima svoju nijansu, da ♥ ♦ ♠ ♣ razlikuješ i bez oslanjanja na crvenu',
  // Genitiv, da „as herca” ili „kralj pika” zvuči ispravno
  suitNames: { S: 'pika', H: 'herca', D: 'kara', C: 'trefa' } as Record<string, string>,
  rankNames: { 11: 'dečko', 12: 'dama', 13: 'kralj', 14: 'as' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) =>
    `Tvoje karte: ${plural(n, `${n} karta`, `${n} karte`, `${n} karata`)}`,

  language: 'Jezik',
  languageHint: 'Odaberi jezik aplikacije',

  loading: 'Učitavanje…',
  errorTitle: 'Ups',
  copyright: '© 2026 Clixite SRL',
};

export default hr;
