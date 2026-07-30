import type { Messages } from '../types';

export const it: Messages = {
  appName: 'Rikiki',
  tagline: 'Il gioco di prese tra amici, ognuno sul suo telefono',

  // Home
  createGame: 'Crea una partita',
  joinGame: 'Entra in una partita',
  resumeGame: 'Riprendi la partita',
  myGames: 'Le mie partite',

  // Profilo
  yourPseudo: 'Il tuo nome',
  pickAvatar: 'Scegli il tuo avatar',
  letsGo: 'Si parte!',
  save: 'Salva',
  editProfile: 'Il mio profilo',
  changeAvatar: 'Cambia avatar',

  // Entrare
  enterCode: 'Codice della partita',
  join: 'Entra',
  gameCode: 'Codice della partita',
  copyLink: 'Copia il link',
  copied: 'Link copiato!',

  // Sala
  invite: 'Invita gli amici',
  players: 'Giocatori',
  host: 'Host',
  you: 'tu',
  waitingForHost: 'In attesa che l’host avvii la partita…',
  waitingForHostNamed: (p: string) => `${p} avvia la partita quando ci sono tutti`,
  needPlayers: (missing: number) =>
    missing === 1 ? 'Manca 1 giocatore per iniziare' : `Mancano ${missing} giocatori per iniziare`,
  startGame: 'Avvia la partita',
  leave: 'Esci',
  kick: 'Rimuovi',
  addBot: 'Aggiungi un bot',
  addBotHint: 'Completa la partita con un giocatore automatico',
  botsFull: 'Il tavolo è al completo',
  removeBot: 'Rimuovi il bot',

  // Formato della partita (durata)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Impostazioni della partita',
  gameSettingsHint: 'L’ospite sceglie prima di iniziare',
  gameSettingsLocked: 'Impostazioni scelte dall’ospite',
  settingsDone: 'Fatto',

  gameFormat: 'Formato della partita',
  gameFormatHint: 'Scegli la durata prima di iniziare',
  formatNames: {
    blitz: 'Lampo',
    normal: 'Normale',
    climb: 'Salita',
  },
  formatDescriptions: {
    blitz: 'Salita e discesa fino a 5 carte',
    normal: 'Salita e discesa complete',
    climb: 'Solo salita, senza discesa',
  },
  formatRounds: (n: number) => (n === 1 ? '1 mano' : `${n} mani`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formato scelto dall’host',

  // Barème de score
  scoringVariant: 'Punteggio',
  scoringHint: 'Come si contano i punti',
  scoringNames: {
    classic: 'Classico',
    gentle: 'Indulgente',
    always: 'Le prese contano',
  },
  scoringDescriptions: {
    classic: 'Contratto rispettato: 10 + 2 per presa. Mancato: −2 per presa di scarto.',
    gentle: 'Contratto rispettato: 10 + 1 per presa. Mancato: 0, nessuna penalità.',
    always: 'Le tue prese contano sempre, +10 se il contratto è rispettato.',
  },
  scoringLocked: 'Punteggio scelto dall’ospite',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Ritmo',
  gamePaceHint: 'Insieme, o ciascuno quando può',
  paceNames: {
    live: 'In diretta',
    async: 'Al proprio ritmo',
  },
  paceDescriptions: {
    live: 'Tutti giocano insieme; un turno troppo lungo si gioca da solo.',
    async: 'Ognuno gioca quando può, anche su più giorni. Nessuno gioca al posto tuo.',
  },
  paceLocked: 'Ritmo scelto dall’ospite',
  waitingForPlayer: (pseudo: string) => `In attesa di ${pseudo}`,
  waitingToStart: 'In attesa dell’avvio',

  // Tavolo da gioco
  round: 'Mano',
  cards: (n: number) => (n === 1 ? '1 carta' : `${n} carte`),
  trump: 'Briscola',
  noTrump: 'Senza briscola',
  dealer: 'Mazziere',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Quante prese?',
  bidsTotal: (sum: number, cards: number) => `Dichiarate: ${sum} / ${cards} prese`,
  hookForbidden: (n: number) => `Vietato: il totale farebbe esattamente ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} è vietato: il totale delle dichiarazioni non può essere ${cards} (regola del gancio).`,
  bid: 'Dichiarazione',
  tricks: 'Prese',
  lastTrick: 'Ultima presa',
  spreadHand: 'Allarga le carte',
  collapseHand: 'Raggruppa le carte',

  // Riepilogo delle dichiarazioni della mano
  bidsAnnounced: 'Dichiarate',
  bidsPending: (announced: number, cards: number) =>
    `${announced} su ${cards} — dichiarazioni in corso`,
  bidsBalanced: (cards: number) => `Totale esatto: ${cards} prese dichiarate`,
  bidsOver: (n: number) =>
    n === 1 ? '1 presa di troppo: qualcuno cade' : `${n} prese di troppo: qualcuno cade`,
  bidsUnder: (n: number) =>
    n === 1 ? '1 presa in più da raccogliere' : `${n} prese in più da raccogliere`,
  noBidYet: 'Non ha ancora dichiarato',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} prese`,
  yourTurn: 'Tocca a te',
  turnOf: (p: string) => `Tocca a ${p}`,
  trickWonBy: (p: string) => `${p} vince la presa`,
  scoreboard: 'Punteggi',
  total: 'Totale',

  // Riepilogo
  roundRecap: 'Fine della mano',
  contractKept: 'Contratto rispettato',
  contractMissed: 'Contratto mancato',
  contract: 'Contratto',
  points: 'Punti',
  nextRound: 'Mano successiva',
  seeResults: 'Vedi i risultati',
  waitingNextRound: 'L’host sta per avviare la mano successiva…',

  // Fine partita
  gameOver: 'Partita finita',
  shareResult: 'Condividi il risultato',
  shareTitle: 'Partita di Rikiki finita 🃏',
  shareSaved: 'Immagine salvata',
  playAgain: 'Gioca ancora',
  backHome: 'Home',

  // Audio
  soundOn: 'Attiva l’audio',
  soundOff: 'Disattiva l’audio',

  // Rete
  reconnecting: 'Riconnessione…',
  playerDisconnected: (p: string) => `${p} si è disconnesso`,
  playerReconnected: (p: string) => `${p} è tornato`,
  playerPaused: (p: string) => `${p} fa una pausa`,
  playerResumed: (p: string) => `${p} torna in partita`,
  playerJoined: (p: string) => `${p} è entrato nella partita`,
  playerLeft: (p: string) => `${p} ha lasciato la partita`,
  roomClosed: 'La partita è stata chiusa.',
  roomClosedKicked: 'Sei stato rimosso dalla partita.',
  roomClosedExpired: 'La partita è scaduta.',

  // Inviti
  inviteMessage: (code: string, url: string) =>
    `Vieni a giocare a Rikiki con noi! 🃏\nCodice della partita: ${code}\nEntra qui: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Condividi',

  // Account
  saveAccount: 'Salva i miei progressi',
  saveAccountHint: 'Ricevi un link via e-mail — nessuna password da ricordare',
  emailPlaceholder: 'tu@email.it',
  sendMagicLink: 'Ricevi il link',
  magicLinkSent: 'E-mail inviata! Apri il link per confermare.',
  accountSaved: 'Progressi salvati',
  verifying: 'Verifica…',
  verified: 'Account confermato! I tuoi progressi sono salvati.',
  verifyFailed: 'Link non valido o scaduto. Chiedine un altro dal tuo profilo.',

  privacyPolicy: 'Privacy',
  deleteAccount: 'Elimina il mio account',
  deleteAccountHint: 'Cancella il tuo profilo, la cronologia e i gruppi.',
  deleteAccountWarning: 'Il tuo soprannome, le partite, le statistiche e i gruppi saranno cancellati. L’operazione è definitiva.',
  deleteAccountAction: 'Sì, elimina tutto',
  deleteAccountDone: 'Account eliminato.',
  cancel: 'Annulla',
  botTag: 'bot',
  emotes: 'Reazioni',
  phrases: 'Messaggi',
  phraseTexts: {
    nice: 'Ben giocato!',
    oops: 'Ahi…',
    yourTurn: 'Tocca a te!',
    hurry: 'Ti aspettiamo 🙂',
    watchTrump: 'Attento alla briscola',
    mine: 'Quella è mia',
    sorry: 'Scusa!',
    brb: 'Torno subito',
    goodGame: 'Bella partita!',
    again: 'Un’altra?',
  },
  pauseGame: 'Fare una pausa',
  resumePlay: 'Sono tornato',
  pausedTag: 'in pausa',
  pauseHint: 'Un robot tiene il tuo posto mentre sei via.',
  close: 'Chiudi',
  leaveGame: 'Abbandona la partita',
  leaveGameWarning:
    'La partita continua senza di te e i punti di questa partita sono persi.',
  leaveGameAction: 'Sì, abbandona',
  takePhoto: 'Scatta una foto',
  removePhoto: 'Rimuovi la foto',
  photoError: 'Foto troppo pesante o illeggibile.',
  reportPlayer: 'Segnala',
  reportDone: 'Foto nascosta e segnalata.',

  // Statistiche e cronologia
  stats: 'Statistiche',
  gamesPlayed: 'partite',
  gamesWon: 'vittorie',
  bestRound: 'mano migliore',
  contractsKept: 'Contratti rispettati',
  noHistory: 'Nessuna partita conclusa per ora.',
  historyTitle: 'Le mie ultime partite',
  wonBadge: 'Vinta',
  lostBadge: 'Persa',
  playersCount: (n: number) => `${n} giocatori`,

  // Gruppi di amici
  groups: 'I miei gruppi',
  groupsTitle: 'I miei gruppi',
  groupsSubtitle: 'Una classifica cumulativa per chi gioca sempre insieme',
  noGroups: 'Non fai ancora parte di nessun gruppo.',
  createGroup: 'Crea un gruppo',
  createGroupCta: 'Crea il gruppo',
  groupNamePlaceholder: 'Gli amici del martedì',
  groupNameLabel: 'Nome del gruppo',
  groupNameTooShort: 'Il nome deve avere tra 2 e 30 caratteri.',
  joinGroup: 'Entra in un gruppo',
  joinGroupCta: 'Entra',
  groupCodeLabel: 'Codice del gruppo',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 lettere, senza I, L e O',
  groupCode: 'Codice del gruppo',
  groupShareHint: 'Condividi questo codice per far entrare i tuoi amici nel gruppo',
  copyGroupCode: 'Copia il codice',
  groupCodeCopied: 'Codice copiato!',
  groupMembers: (n: number) => (n === 1 ? '1 membro' : `${n} membri`),
  groupGames: (n: number) => (n === 1 ? '1 partita' : n === 0 ? 'nessuna partita' : `${n} partite`),
  groupRanking: 'Classifica cumulativa',
  groupRecentGames: 'Ultime partite del gruppo',
  groupNoGames: 'Nessuna partita giocata in gruppo per ora.',
  groupNoGamesHint: 'Avvia una partita con questo gruppo: i risultati arriveranno qui.',
  groupPlay: 'Gioca con questo gruppo',
  groupOwner: 'Creatore',
  groupLeave: 'Esci dal gruppo',
  groupLeaveConfirm: 'Uscire da questo gruppo? Le tue partite passate restano in classifica.',
  groupDelete: 'Elimina il gruppo',
  groupDeleteConfirm: 'Eliminare questo gruppo e tutta la sua classifica? È definitivo.',
  groupOwnerCannotLeave: 'Hai creato tu questo gruppo: puoi solo eliminarlo.',
  groupNotFound: 'Gruppo non trovato.',
  groupJoined: (name: string) => `Sei entrato in «${name}»!`,
  groupCreated: (name: string) => `Gruppo «${name}» creato!`,
  groupAttached: (name: string) => `Partita collegata a «${name}»`,
  groupTotalPoints: 'punti',
  groupRankHeader: '#',
  groupPlayerHeader: 'Giocatore',
  groupPointsHeader: 'Pti',
  groupPlayedHeader: 'G',
  groupWonHeader: 'V',

  // Regole del gioco
  rules: 'Regole del gioco',
  rulesTitle: 'Come si gioca',
  demoTitle: 'La partita in un minuto',
  demoPlay: 'Avvia la dimostrazione',
  demoPause: 'Metti in pausa',
  demoReplay: 'Rivedi da capo',
  demoPrev: 'Passo precedente',
  demoNext: 'Passo successivo',
  demoDeal: 'Ognuno riceve le sue carte. L’ultima scoperta fissa la briscola: il suo seme batte tutti gli altri.',
  demoBid: 'Ognuno dichiara quante prese intende fare. Il mazziere dichiara per ultimo e non può far quadrare il totale.',
  demoFollow: 'Si risponde al seme di uscita se lo si ha. Solo altrimenti si gioca ciò che si vuole.',
  demoTrump: 'Una briscola, anche la più bassa, vince la presa sul seme di uscita.',
  demoScore: 'Contratto rispettato: 10 punti più 2 a presa. Mancato: 2 punti in meno per ogni presa di scarto.',
  rulesSubtitle: 'Il Rikiki in 2 minuti',
  rulesGoalTitle: 'Il principio',
  rulesGoalText:
    'Prima di ogni mano dichiari quante prese pensi di fare. Il bello è indovinare esatto: né una in più, né una in meno. Fare tante prese non serve a niente se ne avevi dichiarate poche.',
  rulesDealTitle: 'La distribuzione',
  rulesDealText:
    'La partita si gioca in più mani. Nella prima si distribuisce una sola carta a testa, poi due, poi tre… prima di ridiscendere. In ogni mano tutti ricevono lo stesso numero di carte.',
  rulesTrumpText: 'Si scopre una carta: il suo seme è la briscola della mano.',
  rulesBidTitle: 'La dichiarazione',
  rulesBidText:
    'A turno dichiari quante prese vuoi fare — da 0 al numero di carte in mano. Vedi il tuo gioco e la briscola prima di decidere.',
  rulesHookTitle: 'La regola del gancio',
  rulesHookText:
    'L’ultimo a dichiarare (il mazziere) non può scegliere il numero che farebbe coincidere esattamente il totale delle dichiarazioni con il numero di prese della mano. Risultato: qualcuno resterà per forza deluso. Il numero vietato viene barrato automaticamente.',
  rulesPlayTitle: 'Il gioco delle prese',
  rulesPlayText:
    'Apre il giocatore alla sinistra del mazziere. Ognuno gioca una carta e la più forte vince la presa. Chi vince apre la presa successiva.',
  rulesFollowSuit: 'Devi rispondere al seme richiesto se ne hai una carta.',
  rulesNoSuit: 'Altrimenti giochi quello che vuoi: tagliare con la briscola o scartare.',
  rulesWinTrick: 'Vince la briscola più alta; senza briscola, la carta più alta del seme richiesto.',
  rulesScoreTitle: 'I punti',
  rulesScoreOk: 'Contratto rispettato',
  rulesScoreOkExample: 'Dichiarate 3, fatte 3 → 16 punti',
  rulesScoreKo: 'Contratto mancato',
  rulesScoreKoExample: 'Dichiarate 3, fatte 1 → −4 punti',
  rulesScoreZero: 'Dichiarare 0 e non farne nessuna vale 10 punti: un contratto molto redditizio.',
  rulesScoreVariants: 'L’ospite può scegliere un altro punteggio nella sala:',
  rulesEndTitle: 'Fine della partita',
  rulesEndText:
    'Giocate tutte le mani, vince chi ha totalizzato più punti. La tabella dei punteggi si può consultare in qualsiasi momento durante la partita.',
  rulesTip:
    'Consiglio: nelle mani corte un asso o una briscola alta bastano spesso ad assicurarsi una presa. In quelle lunghe, occhio ai semi lunghi.',
  rulesGotIt: 'Ho capito',

  // Notifiche «tocca a te»
  notificationsTitle: 'Avvisami quando tocca a me',
  notificationsHint:
    'Metti via il telefono: ti mandiamo una notifica appena il tavolo ti aspetta. Ideale per le partite spalmate sulla giornata.',
  notificationsEnable: 'Attiva le notifiche',
  notificationsOn: 'Notifiche attive',
  notificationsOff: 'Notifiche disattivate',
  notificationsChecking: 'Verifica…',
  notificationsUnsupported: 'Il tuo browser non gestisce le notifiche.',
  notificationsNeedsInstall:
    'Su iPhone e iPad aggiungi prima Rikiki alla schermata Home (Condividi → «Aggiungi alla schermata Home»), poi torna qui.',
  notificationsDenied:
    'Le notifiche sono bloccate per questo sito. Riattivale nelle impostazioni del browser.',
  notificationsNoServiceWorker:
    'Notifiche non disponibili qui (installa l’app o ricarica la pagina).',
  notificationsServerOff: 'Le notifiche non sono configurate sul server.',
  notificationsError: 'Impossibile modificare le notifiche.',

  updateAvailable: 'Nuova versione',
  updateReload: 'Aggiorna',
  version: (v: string) => `versione ${v}`,

  // Accessibilità
  accessibility: 'Accessibilità',
  colorblindMode: 'Colori distinti',
  colorblindHint: 'Un colore per seme, per distinguere ♥ ♦ ♠ ♣ senza dipendere dal rosso',
  leftHandedMode: 'Comandi a sinistra',
  leftHandedHint: 'Sposta i pulsanti del tavolo dal bordo destro a quello sinistro.',
  colorblindHintBanner: 'Daltonico? Prova i colori distinti nel tuo profilo.',
  suitNames: { S: 'picche', H: 'cuori', D: 'quadri', C: 'fiori' } as Record<string, string>,
  rankNames: { 11: 'fante', 12: 'donna', 13: 're', 14: 'asso' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} di ${suit}`,
  handOf: (n: number) => (n > 1 ? `La tua mano: ${n} carte` : 'La tua mano: 1 carta'),

  language: 'Lingua',
  languageHint: 'Scegli la lingua dell’app',

  loading: 'Caricamento…',
  errorTitle: 'Ops',
  copyright: '© 2026 Clixite SRL',
};

export default it;
