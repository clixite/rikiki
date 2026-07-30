import type { Messages } from '../types';

/** Ελληνικά. Πληθυντικός: 1 → ενικός, οτιδήποτε άλλο → πληθυντικός. */
const fylla = (n: number) => (n === 1 ? '1 φύλλο' : `${n} φύλλα`);
const mpazes = (n: number) => (n === 1 ? '1 μπάζα' : `${n} μπάζες`);
const paiktes = (n: number) => (n === 1 ? '1 παίκτης' : `${n} παίκτες`);
const gyroi = (n: number) => (n === 1 ? '1 γύρος' : `${n} γύροι`);
const paichnidia = (n: number) => (n === 1 ? '1 παιχνίδι' : `${n} παιχνίδια`);
const meli = (n: number) => (n === 1 ? '1 μέλος' : `${n} μέλη`);

export const el: Messages = {
  appName: 'Rikiki',
  tagline: 'Το παιχνίδι με τις μπάζες, παρέα, ο καθένας στο κινητό του',

  // Αρχική
  createGame: 'Νέο παιχνίδι',
  joinGame: 'Μπες σε παιχνίδι',
  resumeGame: 'Συνέχισε το παιχνίδι',
  myGames: 'Τα παιχνίδια μου',

  // Προφίλ
  yourPseudo: 'Το ψευδώνυμό σου',
  pickAvatar: 'Διάλεξε άβαταρ',
  letsGo: 'Πάμε!',
  save: 'Αποθήκευση',
  editProfile: 'Το προφίλ μου',
  changeAvatar: 'Αλλαγή άβαταρ',

  // Είσοδος
  enterCode: 'Κωδικός παιχνιδιού',
  join: 'Είσοδος',
  gameCode: 'Κωδικός παιχνιδιού',
  copyLink: 'Αντιγραφή συνδέσμου',
  copied: 'Ο σύνδεσμος αντιγράφηκε!',

  // Σαλόνι
  invite: 'Κάλεσε φίλους',
  players: 'Παίκτες',
  host: 'Αρχηγός',
  you: 'εσύ',
  waitingForHost: 'Περιμένουμε τον αρχηγό να ξεκινήσει…',
  waitingForHostNamed: (p: string) => `${p} ξεκινά το παιχνίδι όταν έρθουν όλοι`,
  needPlayers: (missing: number) =>
    missing === 1
      ? 'Ακόμη 1 παίκτης για να ξεκινήσουμε'
      : `Ακόμη ${missing} παίκτες για να ξεκινήσουμε`,
  startGame: 'Ξεκίνα το παιχνίδι',
  leave: 'Έξοδος',
  kick: 'Αποβολή',
  addBot: 'Πρόσθεσε ρομπότ',
  addBotHint: 'Συμπλήρωσε το τραπέζι με αυτόματο παίκτη',
  botsFull: 'Το τραπέζι είναι γεμάτο',
  removeBot: 'Αφαίρεσε το ρομπότ',

  // Μορφή παιχνιδιού (διάρκεια)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Ρυθμίσεις παιχνιδιού',
  gameSettingsHint: 'Ο οικοδεσπότης επιλέγει πριν την έναρξη',
  gameSettingsLocked: 'Οι ρυθμίσεις ορίζονται από τον οικοδεσπότη',
  settingsDone: 'Έτοιμο',

  gameFormat: 'Μορφή παιχνιδιού',
  gameFormatHint: 'Διάλεξε διάρκεια πριν ξεκινήσεις',
  formatNames: {
    blitz: 'Αστραπή',
    normal: 'Κανονική',
    climb: 'Ανοδική',
  },
  formatDescriptions: {
    blitz: 'Άνοδος και κάθοδος ως τα 5 φύλλα',
    normal: 'Πλήρης άνοδος και κάθοδος',
    climb: 'Μόνο άνοδος, χωρίς κάθοδο',
  },
  formatRounds: (n: number) => gyroi(n),
  formatDuration: (minutes: number) => `≈ ${minutes} λεπτά`,
  formatLocked: 'Η μορφή ορίστηκε από τον αρχηγό',

  // Barème de score
  scoringVariant: 'Βαθμολογία',
  scoringHint: 'Πώς μετρώνται οι πόντοι',
  scoringNames: {
    classic: 'Κλασική',
    gentle: 'Ήπια',
    always: 'Οι μπάζες μετράνε',
  },
  scoringDescriptions: {
    classic: 'Σωστή δήλωση: 10 + 2 ανά μπάζα. Λάθος: −2 ανά μπάζα διαφοράς.',
    gentle: 'Σωστή δήλωση: 10 + 1 ανά μπάζα. Λάθος: 0, καμία ποινή.',
    always: 'Οι μπάζες σου μετράνε πάντα, +10 αν πετύχεις τη δήλωση.',
  },
  scoringLocked: 'Η βαθμολογία ορίζεται από τον οικοδεσπότη',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Ρυθμός',
  gamePaceHint: 'Μαζί ή ο καθένας όποτε μπορεί',
  paceNames: {
    live: 'Ζωντανά',
    async: 'Με τον ρυθμό σου',
  },
  paceDescriptions: {
    live: 'Όλοι παίζουν ταυτόχρονα· μια πολύ αργή σειρά παίζεται μόνη της.',
    async: 'Ο καθένας παίζει όποτε μπορεί, για μέρες. Κανείς δεν παίζει στη θέση σου.',
  },
  paceLocked: 'Ο ρυθμός ορίζεται από τον οικοδεσπότη',
  waitingForPlayer: (pseudo: string) => `Αναμονή για ${pseudo}`,
  waitingToStart: 'Αναμονή για εκκίνηση',

  // Τραπέζι
  round: 'Γύρος',
  cards: (n: number) => fylla(n),
  trump: 'Ατού',
  noTrump: 'Χωρίς ατού',
  dealer: 'Μοιραστής',
  offline: 'εκτός σύνδεσης',
  thinking: '…',
  yourBid: 'Πόσες μπάζες;',
  bidsTotal: (sum: number, cards: number) => `Δηλώθηκαν: ${sum} / ${cards} μπάζες`,
  hookForbidden: (n: number) => `Απαγορεύεται: το σύνολο θα γινόταν ακριβώς ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `Το ${forbidden} απαγορεύεται: το σύνολο των δηλώσεων δεν μπορεί να ισούται με ${cards} (κανόνας του άγκιστρου).`,
  bid: 'Δήλωση',
  tricks: 'Μπάζες',
  lastTrick: 'Τελευταία μπάζα',
  spreadHand: 'Άπλωσε τα φύλλα',
  collapseHand: 'Μάζεψε τα φύλλα',

  // Σύνοψη δηλώσεων του γύρου
  bidsAnnounced: 'Δηλωμένες',
  bidsPending: (announced: number, cards: number) =>
    `${announced} από ${cards} — δηλώσεις σε εξέλιξη`,
  bidsBalanced: (cards: number) => `Ακριβές σύνολο: ${mpazes(cards)}`,
  bidsOver: (n: number) =>
    n === 1 ? '1 μπάζα παραπάνω: κάποιος θα πέσει' : `${n} μπάζες παραπάνω: κάποιος θα πέσει`,
  bidsUnder: (n: number) =>
    n === 1 ? '1 μπάζα αζήτητη για μάζεμα' : `${n} μπάζες αζήτητες για μάζεμα`,
  noBidYet: 'Χωρίς δήλωση ακόμη',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} μπάζες`,
  yourTurn: 'Σειρά σου',
  turnOf: (p: string) => `Παίζει ο/η ${p}`,
  trickWonBy: (p: string) => `${p} παίρνει τη μπάζα`,
  scoreboard: 'Σκορ',
  total: 'Σύνολο',

  // Σύνοψη
  roundRecap: 'Τέλος γύρου',
  contractKept: 'Επιτυχές συμβόλαιο',
  contractMissed: 'Χαμένο συμβόλαιο',
  contract: 'Συμβόλαιο',
  points: 'Πόντοι',
  nextRound: 'Επόμενος γύρος',
  seeResults: 'Δες τα αποτελέσματα',
  waitingNextRound: 'Ο αρχηγός θα ξεκινήσει τον επόμενο γύρο…',

  // Τέλος παιχνιδιού
  gameOver: 'Το παιχνίδι τελείωσε',
  shareResult: 'Μοιράσου το αποτέλεσμα',
  shareTitle: 'Η παρτίδα Rikiki τελείωσε 🃏',
  shareSaved: 'Η εικόνα αποθηκεύτηκε',
  playAgain: 'Ξανά',
  backHome: 'Αρχική',

  // Ήχος
  soundOn: 'Ενεργοποίηση ήχου',
  soundOff: 'Σίγαση',

  // Δίκτυο
  reconnecting: 'Επανασύνδεση…',
  playerDisconnected: (p: string) => `${p} αποσυνδέθηκε`,
  playerReconnected: (p: string) => `${p} επέστρεψε`,
  playerPaused: (p: string) => `${p} κάνει διάλειμμα`,
  playerResumed: (p: string) => `${p} επέστρεψε στο παιχνίδι`,
  playerJoined: (p: string) => `${p} μπήκε στο παιχνίδι`,
  playerLeft: (p: string) => `${p} έφυγε από το παιχνίδι`,
  roomClosed: 'Το παιχνίδι έκλεισε.',
  roomClosedKicked: 'Σε απέβαλαν από το παιχνίδι.',
  roomClosedExpired: 'Το παιχνίδι έληξε.',

  // Προσκλήσεις
  inviteMessage: (code: string, url: string) =>
    `Έλα να παίξουμε Rikiki μαζί! 🃏\nΚωδικός παιχνιδιού: ${code}\nΜπες εδώ: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Κοινοποίηση',

  // Λογαριασμός
  saveAccount: 'Αποθήκευσε την πρόοδό μου',
  saveAccountHint: 'Λαμβάνεις έναν σύνδεσμο με e-mail — κανένας κωδικός για απομνημόνευση',
  emailPlaceholder: 'to@email.gr',
  sendMagicLink: 'Στείλε μου τον σύνδεσμο',
  magicLinkSent: 'Το e-mail στάλθηκε! Άνοιξε τον σύνδεσμο για επιβεβαίωση.',
  accountSaved: 'Η πρόοδος αποθηκεύτηκε',
  verifying: 'Επαλήθευση…',
  verified: 'Ο λογαριασμός επιβεβαιώθηκε! Η πρόοδός σου είναι αποθηκευμένη.',
  verifyFailed: 'Άκυρος ή ληγμένος σύνδεσμος. Ζήτα νέον από το προφίλ σου.',

  privacyPolicy: 'Απόρρητο',
  deleteAccount: 'Διαγραφή του λογαριασμού μου',
  deleteAccountHint: 'Διαγράφει το προφίλ, το ιστορικό και τις ομάδες σου.',
  deleteAccountWarning: 'Το ψευδώνυμο, οι παρτίδες, τα στατιστικά και οι ομάδες σου θα διαγραφούν. Η ενέργεια είναι οριστική.',
  deleteAccountAction: 'Ναι, να διαγραφούν όλα',
  deleteAccountDone: 'Ο λογαριασμός διαγράφηκε.',
  cancel: 'Άκυρο',
  botTag: 'μποτ',
  emotes: 'Αντιδράσεις',
  phrases: 'Μηνύματα',
  phraseTexts: {
    nice: 'Μπράβο!',
    oops: 'Ωχ…',
    yourTurn: 'Σειρά σου!',
    hurry: 'Σε περιμένουμε 🙂',
    watchTrump: 'Πρόσεχε τα ατού',
    mine: 'Αυτή είναι δική μου',
    sorry: 'Συγγνώμη!',
    brb: 'Επιστρέφω αμέσως',
    goodGame: 'Ωραία παρτίδα!',
    again: 'Άλλη μία;',
  },
  pauseGame: 'Κάνε ένα διάλειμμα',
  resumePlay: 'Επέστρεψα',
  pausedTag: 'σε παύση',
  pauseHint: 'Ένα ρομπότ κρατά τη θέση σου όσο λείπεις.',
  close: 'Κλείσιμο',
  leaveGame: 'Αποχώρηση από την παρτίδα',
  leaveGameWarning:
    'Η παρτίδα συνεχίζεται χωρίς εσένα και οι πόντοι σου από αυτήν χάνονται.',
  leaveGameAction: 'Ναι, αποχώρηση',
  takePhoto: 'Τράβα φωτογραφία',
  removePhoto: 'Αφαίρεση φωτογραφίας',
  photoError: 'Η φωτογραφία είναι πολύ μεγάλη ή μη αναγνώσιμη.',
  reportPlayer: 'Αναφορά',
  reportDone: 'Η φωτογραφία αποκρύφθηκε και αναφέρθηκε.',

  // Στατιστικά και ιστορικό
  stats: 'Στατιστικά',
  gamesPlayed: 'παιχνίδια',
  gamesWon: 'νίκες',
  bestRound: 'καλύτερος γύρος',
  noHistory: 'Δεν έχεις ολοκληρώσει κανένα παιχνίδι ακόμη.',
  historyTitle: 'Τα τελευταία μου παιχνίδια',
  wonBadge: 'Νίκη',
  lostBadge: 'Ήττα',
  playersCount: (n: number) => paiktes(n),

  // Παρέες
  groups: 'Οι παρέες μου',
  groupsTitle: 'Οι παρέες μου',
  groupsSubtitle: 'Συγκεντρωτική κατάταξη για όσους παίζουν πάντα μαζί',
  noGroups: 'Δεν ανήκεις σε καμία παρέα ακόμη.',
  createGroup: 'Δημιούργησε παρέα',
  createGroupCta: 'Δημιουργία παρέας',
  groupNamePlaceholder: 'Η παρέα της Τρίτης',
  groupNameLabel: 'Όνομα παρέας',
  groupNameTooShort: 'Το όνομα πρέπει να έχει 2 έως 30 χαρακτήρες.',
  joinGroup: 'Μπες σε παρέα',
  joinGroupCta: 'Είσοδος',
  groupCodeLabel: 'Κωδικός παρέας',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 γράμματα, χωρίς I, L και O',
  groupCode: 'Κωδικός παρέας',
  groupShareHint: 'Μοίρασε αυτόν τον κωδικό για να μπουν οι φίλοι σου στην παρέα',
  copyGroupCode: 'Αντιγραφή κωδικού',
  groupCodeCopied: 'Ο κωδικός αντιγράφηκε!',
  groupMembers: (n: number) => meli(n),
  groupGames: (n: number) => (n === 0 ? 'κανένα παιχνίδι' : paichnidia(n)),
  groupRanking: 'Συγκεντρωτική κατάταξη',
  groupRecentGames: 'Τελευταία παιχνίδια της παρέας',
  groupNoGames: 'Δεν έχει παιχτεί κανένα παιχνίδι στην παρέα ακόμη.',
  groupNoGamesHint: 'Ξεκίνα ένα παιχνίδι με αυτή την παρέα: τα αποτελέσματα θα εμφανιστούν εδώ.',
  groupPlay: 'Παίξε με αυτή την παρέα',
  groupOwner: 'Ιδρυτής',
  groupLeave: 'Αποχώρηση',
  groupLeaveConfirm: 'Να φύγεις από την παρέα; Τα παλιά σου παιχνίδια μένουν στην κατάταξη.',
  groupDelete: 'Διαγραφή παρέας',
  groupDeleteConfirm: 'Να διαγραφεί η παρέα και όλη η κατάταξή της; Είναι οριστικό.',
  groupOwnerCannotLeave: 'Εσύ δημιούργησες την παρέα: μπορείς μόνο να τη διαγράψεις.',
  groupNotFound: 'Η παρέα δεν βρέθηκε.',
  groupJoined: (name: string) => `Μπήκες στην παρέα «${name}»!`,
  groupCreated: (name: string) => `Η παρέα «${name}» δημιουργήθηκε!`,
  groupAttached: (name: string) => `Το παιχνίδι καταχωρήθηκε στην «${name}»`,
  groupTotalPoints: 'πόντοι',
  groupRankHeader: '#',
  groupPlayerHeader: 'Παίκτης',
  groupPointsHeader: 'Πόν.',
  groupPlayedHeader: 'Π',
  groupWonHeader: 'Ν',

  // Κανόνες
  rules: 'Κανόνες',
  rulesTitle: 'Πώς παίζεται',
  demoTitle: 'Το παιχνίδι σε ένα λεπτό',
  demoPlay: 'Αναπαραγωγή της επίδειξης',
  demoPause: 'Παύση',
  demoReplay: 'Δες το ξανά',
  demoPrev: 'Προηγούμενο βήμα',
  demoNext: 'Επόμενο βήμα',
  demoDeal: 'Ο καθένας παίρνει τα φύλλα του. Το τελευταίο που γυρίζει ορίζει τα ατού: το χρώμα του κερδίζει όλα τα άλλα.',
  demoBid: 'Ο καθένας δηλώνει πόσες μπάζες σκοπεύει να πάρει. Ο μοιραστής δηλώνει τελευταίος και δεν μπορεί να βγει ακριβώς το σύνολο.',
  demoFollow: 'Ακολουθείς το χρώμα που παίχτηκε αν το έχεις. Μόνο αλλιώς παίζεις ό,τι θέλεις.',
  demoTrump: 'Ένα ατού, ακόμη και το μικρότερο, παίρνει τη μπάζα από το χρώμα που παίχτηκε.',
  demoScore: 'Δήλωση που τηρήθηκε: 10 πόντοι συν 2 ανά μπάζα. Αποτυχία: 2 πόντοι λιγότεροι για κάθε μπάζα διαφοράς.',
  rulesSubtitle: 'Το Rikiki σε 2 λεπτά',
  rulesGoalTitle: 'Η ιδέα',
  rulesGoalText:
    'Πριν από κάθε γύρο δηλώνετε πόσες μπάζες πιστεύετε ότι θα πάρετε. Το ζητούμενο είναι να πέσετε ακριβώς μέσα: ούτε παραπάνω, ούτε λιγότερες. Πολλές μπάζες δεν ωφελούν αν είχατε δηλώσει λίγες.',
  rulesDealTitle: 'Το μοίρασμα',
  rulesDealText:
    'Το παιχνίδι παίζεται σε πολλούς γύρους. Στον πρώτο μοιράζεται ένα μόνο φύλλο σε καθέναν, μετά δύο, μετά τρία… και ύστερα κατεβαίνει πάλι. Σε κάθε γύρο όλοι παίρνουν τον ίδιο αριθμό φύλλων.',
  rulesTrumpText: 'Γυρίζεται ένα φύλλο: το χρώμα του είναι το ατού του γύρου.',
  rulesBidTitle: 'Η δήλωση',
  rulesBidText:
    'Με τη σειρά, δηλώνετε πόσες μπάζες στοχεύετε — από 0 έως τον αριθμό των φύλλων σας. Βλέπεις το χέρι σου και το ατού πριν αποφασίσεις.',
  rulesHookTitle: 'Ο κανόνας του άγκιστρου',
  rulesHookText:
    'Ο τελευταίος που δηλώνει (ο μοιραστής) δεν μπορεί να διαλέξει τον αριθμό που θα έκανε το σύνολο των δηλώσεων ίσο με τις μπάζες του γύρου. Άρα κάποιος θα απογοητευτεί σίγουρα. Ο απαγορευμένος αριθμός διαγράφεται αυτόματα.',
  rulesPlayTitle: 'Το παίξιμο',
  rulesPlayText:
    'Ξεκινά ο παίκτης αριστερά από τον μοιραστή. Ο καθένας ρίχνει ένα φύλλο και το δυνατότερο παίρνει τη μπάζα. Ο νικητής ανοίγει την επόμενη.',
  rulesFollowSuit: 'Πρέπει να ακολουθήσεις το χρώμα που ζητήθηκε, αν έχεις.',
  rulesNoSuit: 'Αλλιώς παίζεις ό,τι θέλεις: κόβεις με ατού ή ξεφορτώνεσαι ένα φύλλο.',
  rulesWinTrick:
    'Κερδίζει το ψηλότερο ατού· χωρίς ατού, το ψηλότερο φύλλο του χρώματος που ζητήθηκε.',
  rulesScoreTitle: 'Οι πόντοι',
  rulesScoreOk: 'Επιτυχές συμβόλαιο',
  rulesScoreOkExample: 'Δήλωσες 3, πήρες 3 → 16 πόντοι',
  rulesScoreKo: 'Χαμένο συμβόλαιο',
  rulesScoreKoExample: 'Δήλωσες 3, πήρες 1 → −4 πόντοι',
  rulesScoreZero:
    'Αν δηλώσεις 0 και δεν πάρεις καμία, κερδίζεις 10 πόντους: πολύ συμφέρον συμβόλαιο.',
  rulesScoreVariants: 'Ο οικοδεσπότης μπορεί να επιλέξει άλλη βαθμολογία στην αίθουσα:',
  rulesEndTitle: 'Τέλος παιχνιδιού',
  rulesEndText:
    'Όταν παιχτούν όλοι οι γύροι, νικά ο παίκτης με τους περισσότερους πόντους. Ο πίνακας σκορ είναι διαθέσιμος ανά πάσα στιγμή στη διάρκεια του παιχνιδιού.',
  rulesTip:
    'Συμβουλή: στους μικρούς γύρους ένας άσος ή ένα ψηλό ατού αρκεί συνήθως για μια μπάζα. Στους μεγάλους, πρόσεχε τα μακριά χρώματα.',
  rulesGotIt: 'Το κατάλαβα',

  // Ειδοποιήσεις «είναι η σειρά σου»
  notificationsTitle: 'Ειδοποίησέ με όταν είναι η σειρά μου',
  notificationsHint:
    'Βάλε το κινητό στην άκρη: σου στέλνουμε ειδοποίηση μόλις σε περιμένει το τραπέζι. Ιδανικό για παιχνίδια που κρατούν όλη μέρα.',
  notificationsEnable: 'Ενεργοποίηση ειδοποιήσεων',
  notificationsOn: 'Οι ειδοποιήσεις είναι ενεργές',
  notificationsOff: 'Οι ειδοποιήσεις είναι ανενεργές',
  notificationsChecking: 'Έλεγχος…',
  notificationsUnsupported: 'Ο browser σου δεν υποστηρίζει ειδοποιήσεις.',
  notificationsNeedsInstall:
    'Σε iPhone και iPad, πρόσθεσε πρώτα το Rikiki στην αρχική οθόνη (Κοινοποίηση → «Στην αρχική οθόνη») και ξαναγύρνα εδώ.',
  notificationsDenied:
    'Οι ειδοποιήσεις είναι μπλοκαρισμένες για αυτόν τον ιστότοπο. Ενεργοποίησέ τες ξανά από τις ρυθμίσεις του browser.',
  notificationsNoServiceWorker:
    'Οι ειδοποιήσεις δεν είναι διαθέσιμες εδώ (εγκατέστησε την εφαρμογή ή ανανέωσε τη σελίδα).',
  notificationsServerOff: 'Οι ειδοποιήσεις δεν έχουν ρυθμιστεί στον διακομιστή.',
  notificationsError: 'Δεν ήταν δυνατή η αλλαγή των ειδοποιήσεων.',

  updateAvailable: 'Νέα έκδοση',
  updateReload: 'Ενημέρωση',
  version: (v: string) => `έκδοση ${v}`,

  // Προσβασιμότητα
  accessibility: 'Προσβασιμότητα',
  colorblindMode: 'Διακριτά χρώματα',
  colorblindHint:
    'Μια απόχρωση ανά χρώμα, για να ξεχωρίζεις ♥ ♦ ♠ ♣ χωρίς να βασίζεσαι στο κόκκινο',
  suitNames: {
    S: 'μπαστούνι',
    H: 'κούπα',
    D: 'καρό',
    C: 'σπαθί',
  },
  rankNames: {
    11: 'βαλές',
    12: 'ντάμα',
    13: 'ρήγας',
    14: 'άσος',
  },
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) => `Το χέρι σου: ${fylla(n)}`,

  language: 'Γλώσσα',
  languageHint: 'Διάλεξε τη γλώσσα της εφαρμογής',

  loading: 'Φόρτωση…',
  errorTitle: 'Ωχ',
  copyright: '© 2026 Clixite SRL',
};

export default el;
