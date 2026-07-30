import type { Messages } from '../types';

/**
 * Română — trei forme de plural (CLDR) :
 *   one   : n = 1                              → « 1 carte »
 *   few   : n = 0 sau n % 100 între 1 și 19     → « 3 cărți », « 0 cărți »
 *   other : restul                              → « 20 de cărți » (cu « de »)
 */
type RoForm = 'one' | 'few' | 'other';

const roForm = (n: number): RoForm => {
  if (n === 1) return 'one';
  const rest = n % 100;
  if (n === 0 || (rest >= 1 && rest <= 19)) return 'few';
  return 'other';
};

/** Aplică forma potrivită : singular / plural / « de » + plural. */
const ro1 = (n: number, one: string, many: string) => {
  const form = roForm(n);
  if (form === 'one') return `${n} ${one}`;
  if (form === 'few') return `${n} ${many}`;
  return `${n} de ${many}`;
};

const carti = (n: number) => ro1(n, 'carte', 'cărți');
const levate = (n: number) => ro1(n, 'levată', 'levate');
const jucatori = (n: number) => ro1(n, 'jucător', 'jucători');
const runde = (n: number) => ro1(n, 'rundă', 'runde');
const partide = (n: number) => ro1(n, 'partidă', 'partide');
const membri = (n: number) => ro1(n, 'membru', 'membri');

export const ro: Messages = {
  appName: 'Rikiki',
  tagline: 'Jocul de levate cu prietenii, fiecare pe telefonul lui',

  // Acasă
  createGame: 'Creează o partidă',
  joinGame: 'Intră într-o partidă',
  resumeGame: 'Reia partida',
  myGames: 'Partidele mele',

  // Profil
  yourPseudo: 'Porecla ta',
  pickAvatar: 'Alege-ți avatarul',
  letsGo: 'Să-i dăm drumul!',
  save: 'Salvează',
  editProfile: 'Profilul meu',
  changeAvatar: 'Schimbă avatarul',

  // Intrare
  enterCode: 'Codul partidei',
  join: 'Intră',
  gameCode: 'Codul partidei',
  copyLink: 'Copiază linkul',
  copied: 'Link copiat!',

  // Salon
  invite: 'Invită prieteni',
  players: 'Jucători',
  host: 'Gazdă',
  you: 'tu',
  waitingForHost: 'Așteptăm gazda să pornească partida…',
  waitingForHostNamed: (p: string) => `${p} începe partida când sunt toți`,
  needPlayers: (missing: number) =>
    missing === 1 ? 'Încă 1 jucător ca să începem' : `Încă ${jucatori(missing)} ca să începem`,
  startGame: 'Pornește partida',
  leave: 'Ieși',
  kick: 'Elimină',
  addBot: 'Adaugă un robot',
  addBotHint: 'Completează masa cu un jucător automat',
  botsFull: 'Masa e plină',
  removeBot: 'Scoate robotul',

  // Formatul partidei (durata)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Setările jocului',
  gameSettingsHint: 'Gazda alege înainte de start',
  gameSettingsLocked: 'Setările sunt alese de gazdă',
  settingsDone: 'Gata',

  gameFormat: 'Formatul partidei',
  gameFormatHint: 'Alege durata înainte de start',
  formatNames: {
    blitz: 'Fulger',
    normal: 'Normală',
    climb: 'Urcare',
  },
  formatDescriptions: {
    blitz: 'Urcare și coborâre până la 5 cărți',
    normal: 'Urcare și coborâre complete',
    climb: 'Doar urcare, fără coborâre',
  },
  formatRounds: (n: number) => runde(n),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Format ales de gazdă',

  // Barème de score
  scoringVariant: 'Punctaj',
  scoringHint: 'Cum se numără punctele',
  scoringNames: {
    classic: 'Clasic',
    gentle: 'Blând',
    always: 'Levatele contează mereu',
  },
  scoringDescriptions: {
    classic: 'Contract îndeplinit: 10 + 2 pe levată. Ratat: −2 pentru fiecare levată diferență.',
    gentle: 'Contract îndeplinit: 10 + 1 pe levată. Ratat: 0, fără penalizare.',
    always: 'Levatele tale punctează mereu, +10 dacă îndeplinești contractul.',
  },
  scoringLocked: 'Punctajul este ales de gazdă',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Ritm',
  gamePaceHint: 'Împreună sau fiecare când poate',
  paceNames: {
    live: 'În direct',
    async: 'În ritmul tău',
  },
  paceDescriptions: {
    live: 'Toți joacă în același timp; un tur prea lung se joacă singur.',
    async: 'Fiecare joacă atunci când poate, chiar zile la rând. Nimeni nu joacă în locul tău.',
  },
  paceLocked: 'Ritmul este ales de gazdă',
  waitingForPlayer: (pseudo: string) => `Se așteaptă ${pseudo}`,
  waitingToStart: 'Se așteaptă startul',

  // Masa de joc
  round: 'Runda',
  cards: (n: number) => carti(n),
  trump: 'Atu',
  noTrump: 'Fără atu',
  dealer: 'Împărțitor',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Câte levate?',
  bidsTotal: (sum: number, cards: number) => `Pariat: ${sum} / ${cards} levate`,
  hookForbidden: (n: number) => `Interzis: totalul ar fi exact ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} e interzis: totalul pariurilor nu poate fi egal cu ${cards} (regula cârligului).`,
  bid: 'Pariu',
  tricks: 'Levate',
  lastTrick: 'Ultima levată',
  spreadHand: 'Desfă cărțile',
  collapseHand: 'Strânge cărțile',

  // Recapitulare pariuri
  bidsAnnounced: 'Pariat',
  bidsPending: (announced: number, cards: number) => `${announced} din ${cards} — se pariază`,
  bidsBalanced: (cards: number) => `Total exact: ${levate(cards)} pariate`,
  bidsOver: (n: number) =>
    n === 1 ? '1 levată în plus: cineva pică' : `${levate(n)} în plus: cineva pică`,
  bidsUnder: (n: number) =>
    n === 1 ? '1 levată liberă de luat' : `${levate(n)} libere de luat`,
  noBidYet: 'Încă n-a pariat',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} levate`,
  yourTurn: 'E rândul tău',
  turnOf: (p: string) => `E rândul lui ${p}`,
  trickWonBy: (p: string) => `${p} ia levata`,
  scoreboard: 'Scoruri',
  total: 'Total',

  // Recapitulare
  roundRecap: 'Final de rundă',
  contractKept: 'Contract respectat',
  contractMissed: 'Contract ratat',
  contract: 'Contract',
  points: 'Puncte',
  nextRound: 'Runda următoare',
  seeResults: 'Vezi rezultatele',
  waitingNextRound: 'Gazda va porni runda următoare…',

  // Final de partidă
  gameOver: 'Partidă încheiată',
  shareResult: 'Distribuie rezultatul',
  shareTitle: 'Partidă de Rikiki încheiată 🃏',
  shareSaved: 'Imagine salvată',
  playAgain: 'Încă o partidă',
  backHome: 'Acasă',

  // Sunet
  soundOn: 'Pornește sunetul',
  soundOff: 'Oprește sunetul',

  // Rețea
  reconnecting: 'Reconectare…',
  playerDisconnected: (p: string) => `${p} s-a deconectat`,
  playerReconnected: (p: string) => `${p} s-a întors`,
  playerPaused: (p: string) => `${p} ia o pauză`,
  playerResumed: (p: string) => `${p} revine în joc`,
  playerJoined: (p: string) => `${p} a intrat în partidă`,
  playerLeft: (p: string) => `${p} a părăsit partida`,
  roomClosed: 'Partida a fost închisă.',
  roomClosedKicked: 'Ai fost scos din partidă.',
  roomClosedExpired: 'Partida a expirat.',

  // Invitații
  inviteMessage: (code: string, url: string) =>
    `Hai să jucăm Rikiki împreună! 🃏\nCodul partidei: ${code}\nIntră aici: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Partajează',

  // Cont
  saveAccount: 'Salvează-mi progresul',
  saveAccountHint: 'Primești un link pe e-mail — nicio parolă de ținut minte',
  emailPlaceholder: 'tu@email.ro',
  sendMagicLink: 'Trimite-mi linkul',
  magicLinkSent: 'E-mail trimis! Deschide linkul ca să confirmi.',
  accountSaved: 'Progres salvat',
  verifying: 'Se verifică…',
  verified: 'Cont confirmat! Progresul tău e salvat.',
  verifyFailed: 'Link invalid sau expirat. Cere altul din profilul tău.',

  privacyPolicy: 'Confidențialitate',
  deleteAccount: 'Șterge contul meu',
  deleteAccountHint: 'Îți șterge profilul, istoricul și grupurile.',
  deleteAccountWarning: 'Porecla, partidele, statisticile și grupurile tale vor fi șterse. Acțiunea este definitivă.',
  deleteAccountAction: 'Da, șterge tot',
  deleteAccountDone: 'Cont șters.',
  cancel: 'Anulează',
  botTag: 'robot',
  emotes: 'Reacții',
  phrases: 'Mesaje',
  phraseTexts: {
    nice: 'Bine jucat!',
    oops: 'Of…',
    yourTurn: 'E rândul tău!',
    hurry: 'Te așteptăm 🙂',
    watchTrump: 'Atenție la atu',
    mine: 'Asta e a mea',
    sorry: 'Îmi pare rău!',
    brb: 'Revin imediat',
    goodGame: 'Partidă frumoasă!',
    again: 'Mai facem una?',
  },
  pauseGame: 'Iau o pauză',
  resumePlay: 'M-am întors',
  pausedTag: 'în pauză',
  pauseHint: 'Un robot îți ține locul cât ești plecat.',
  close: 'Închide',
  leaveGame: 'Părăsește partida',
  leaveGameWarning:
    'Partida continuă fără tine, iar punctele tale din această partidă se pierd.',
  leaveGameAction: 'Da, părăsesc',
  takePhoto: 'Fă o poză',
  removePhoto: 'Elimină poza',
  photoError: 'Poza este prea mare sau ilizibilă.',
  reportPlayer: 'Raportează',
  reportDone: 'Poza a fost ascunsă și raportată.',

  // Statistici și istoric
  stats: 'Statistici',
  gamesPlayed: 'partide',
  gamesWon: 'victorii',
  bestRound: 'cea mai bună rundă',
  noHistory: 'Nicio partidă încheiată deocamdată.',
  historyTitle: 'Ultimele mele partide',
  wonBadge: 'Câștigat',
  lostBadge: 'Pierdut',
  playersCount: (n: number) => jucatori(n),

  // Grupuri de prieteni
  groups: 'Grupurile mele',
  groupsTitle: 'Grupurile mele',
  groupsSubtitle: 'Un clasament cumulat pentru cei care joacă mereu împreună',
  noGroups: 'Deocamdată nu faci parte din niciun grup.',
  createGroup: 'Creează un grup',
  createGroupCta: 'Creează grupul',
  groupNamePlaceholder: 'Gașca de marți',
  groupNameLabel: 'Numele grupului',
  groupNameTooShort: 'Numele trebuie să aibă între 2 și 30 de caractere.',
  joinGroup: 'Intră într-un grup',
  joinGroupCta: 'Intră',
  groupCodeLabel: 'Codul grupului',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 litere, fără I, L sau O',
  groupCode: 'Codul grupului',
  groupShareHint: 'Trimite codul ăsta ca să intre prietenii tăi în grup',
  copyGroupCode: 'Copiază codul',
  groupCodeCopied: 'Cod copiat!',
  groupMembers: (n: number) => membri(n),
  groupGames: (n: number) => (n === 0 ? 'nicio partidă' : partide(n)),
  groupRanking: 'Clasament cumulat',
  groupRecentGames: 'Ultimele partide ale grupului',
  groupNoGames: 'Nicio partidă jucată în grup deocamdată.',
  groupNoGamesHint: 'Pornește o partidă cu grupul ăsta: rezultatele vor apărea aici.',
  groupPlay: 'Joacă cu grupul ăsta',
  groupOwner: 'Fondator',
  groupLeave: 'Ieși din grup',
  groupLeaveConfirm: 'Ieși din grupul ăsta? Partidele tale trecute rămân în clasament.',
  groupDelete: 'Șterge grupul',
  groupDeleteConfirm: 'Ștergi grupul ăsta și tot clasamentul lui? E definitiv.',
  groupOwnerCannotLeave: 'Tu ai creat grupul ăsta: poți doar să-l ștergi.',
  groupNotFound: 'Grup negăsit.',
  groupJoined: (name: string) => `Ai intrat în „${name}”!`,
  groupCreated: (name: string) => `Grupul „${name}” a fost creat!`,
  groupAttached: (name: string) => `Partidă atașată la „${name}”`,
  groupTotalPoints: 'puncte',
  groupRankHeader: '#',
  groupPlayerHeader: 'Jucător',
  groupPointsHeader: 'Pct',
  groupPlayedHeader: 'J',
  groupWonHeader: 'V',

  // Regulile jocului
  rules: 'Regulile jocului',
  rulesTitle: 'Cum se joacă',
  rulesSubtitle: 'Rikiki în 2 minute',
  rulesGoalTitle: 'Ideea',
  rulesGoalText:
    'Înainte de fiecare rundă pariați câte levate credeți că luați. Toată miza e să nimeriți exact: nici mai mult, nici mai puțin. Degeaba faci multe levate dacă ai pariat puține.',
  rulesDealTitle: 'Împărțirea',
  rulesDealText:
    'Partida se joacă în mai multe runde. La prima se dă o singură carte de jucător, apoi două, apoi trei… iar după aceea se coboară la loc. În fiecare rundă toată lumea primește același număr de cărți.',
  rulesTrumpText: 'Se întoarce o carte: culoarea ei este atuul rundei.',
  rulesBidTitle: 'Pariul',
  rulesBidText:
    'Pe rând, pariați câte levate țintiți — de la 0 până la numărul de cărți din mână. Îți vezi cărțile și atuul înainte să decizi.',
  rulesHookTitle: 'Regula cârligului',
  rulesHookText:
    'Ultimul care pariază (împărțitorul) nu poate alege cifra care ar face ca totalul pariurilor să fie exact numărul de levate din rundă. Deci cineva o să rămână sigur dezamăgit. Cifra interzisă e tăiată automat.',
  rulesPlayTitle: 'Jocul levatelor',
  rulesPlayText:
    'Începe jucătorul din stânga împărțitorului. Fiecare pune o carte, iar cea mai tare ia levata. Câștigătorul deschide levata următoare.',
  rulesFollowSuit: 'Trebuie să răspunzi la culoarea cerută, dacă ai.',
  rulesNoSuit: 'Altfel joci ce vrei: tai cu atu sau te descarci.',
  rulesWinTrick: 'Câștigă cel mai mare atu; fără atu, cea mai mare carte din culoarea cerută.',
  rulesScoreTitle: 'Punctele',
  rulesScoreOk: 'Contract reușit',
  rulesScoreOkExample: 'Pariat 3, făcut 3 → 16 puncte',
  rulesScoreKo: 'Contract ratat',
  rulesScoreKoExample: 'Pariat 3, făcut 1 → −4 puncte',
  rulesScoreZero:
    'Pariezi 0 și nu iei nicio levată: 10 puncte, un contract foarte rentabil.',
  rulesScoreVariants: 'Gazda poate alege alt punctaj în sală:',
  rulesEndTitle: 'Finalul partidei',
  rulesEndText:
    'După ce s-au jucat toate rundele, câștigă jucătorul cu cele mai multe puncte. Tabelul de scoruri poate fi consultat oricând în timpul partidei.',
  rulesTip:
    'Pont: în rundele mici, un as sau un atu mare ajunge de obicei pentru o levată. În cele mari, ai grijă la culorile lungi.',
  rulesGotIt: 'Am înțeles',

  // Notificări „e rândul tău”
  notificationsTitle: 'Anunță-mă când e rândul meu',
  notificationsHint:
    'Pune telefonul deoparte: îți trimitem o notificare imediat ce masa te așteaptă. Ideal pentru partidele întinse pe toată ziua.',
  notificationsEnable: 'Activează notificările',
  notificationsOn: 'Notificări activate',
  notificationsOff: 'Notificări dezactivate',
  notificationsChecking: 'Se verifică…',
  notificationsUnsupported: 'Browserul tău nu acceptă notificări.',
  notificationsNeedsInstall:
    'Pe iPhone și iPad, adaugă întâi Rikiki pe ecranul principal (Partajează → „Adaugă la ecranul principal”), apoi revino aici.',
  notificationsDenied:
    'Notificările sunt blocate pentru acest site. Reactivează-le din setările browserului.',
  notificationsNoServiceWorker:
    'Notificările nu sunt disponibile aici (instalează aplicația sau reîncarcă pagina).',
  notificationsServerOff: 'Notificările nu sunt configurate pe server.',
  notificationsError: 'Nu putem modifica notificările.',

  updateAvailable: 'Versiune nouă',
  updateReload: 'Actualizează',
  version: (v: string) => `versiunea ${v}`,

  // Accesibilitate
  accessibility: 'Accesibilitate',
  colorblindMode: 'Culori distincte',
  colorblindHint:
    'O nuanță pentru fiecare culoare, ca să deosebești ♥ ♦ ♠ ♣ fără să te bazezi pe roșu',
  suitNames: { S: 'pică', H: 'cupă', D: 'caro', C: 'treflă' },
  rankNames: { 11: 'valet', 12: 'damă', 13: 'rege', 14: 'as' },
  cardOf: (rank: string, suit: string) => `${rank} de ${suit}`,
  handOf: (n: number) => `Mâna ta: ${carti(n)}`,

  language: 'Limbă',
  languageHint: 'Alege limba aplicației',

  loading: 'Se încarcă…',
  errorTitle: 'Hopa',
  copyright: '© 2026 Clixite SRL',
};

export default ro;
