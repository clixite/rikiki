import type { Messages } from '../types';

export const de: Messages = {
  appName: 'Rikiki',
  tagline: 'Das Stichspiel für Freunde – jeder an seinem Handy',

  // Startseite
  createGame: 'Spiel erstellen',
  joinGame: 'Spiel beitreten',
  resumeGame: 'Spiel fortsetzen',
  myGames: 'Meine Spiele',

  // Profil
  yourPseudo: 'Dein Name',
  pickAvatar: 'Wähl deinen Avatar',
  letsGo: 'Los geht’s!',
  save: 'Speichern',
  editProfile: 'Mein Profil',
  changeAvatar: 'Avatar wechseln',

  // Beitreten
  enterCode: 'Spielcode',
  join: 'Beitreten',
  gameCode: 'Spielcode',
  copyLink: 'Link kopieren',
  copied: 'Link kopiert!',

  // Lobby
  invite: 'Freunde einladen',
  players: 'Spieler',
  host: 'Host',
  you: 'du',
  waitingForHost: 'Warten auf den Start durch den Host…',
  needPlayers: (missing: number) =>
    missing === 1 ? 'Noch 1 Spieler bis zum Start' : `Noch ${missing} Spieler bis zum Start`,
  startGame: 'Spiel starten',
  leave: 'Verlassen',
  kick: 'Entfernen',
  addBot: 'Bot hinzufügen',
  addBotHint: 'Füll die Runde mit einem automatischen Spieler auf',
  botsFull: 'Der Tisch ist voll',
  removeBot: 'Bot entfernen',

  // Spielformat (Dauer)
  gameFormat: 'Spielformat',
  gameFormatHint: 'Wähl die Länge vor dem Start',
  formatNames: {
    blitz: 'Blitz',
    normal: 'Normal',
    climb: 'Aufstieg',
  },
  formatDescriptions: {
    blitz: 'Rauf und runter bis 5 Karten',
    normal: 'Komplett rauf und wieder runter',
    climb: 'Nur rauf, ohne Rückweg',
  },
  formatRounds: (n: number) => (n === 1 ? '1 Runde' : `${n} Runden`),
  formatDuration: (minutes: number) => `≈ ${minutes} Min.`,
  formatLocked: 'Format vom Host gewählt',

  // Barème de score
  scoringVariant: 'Wertung',
  scoringHint: 'Wie die Punkte gezählt werden',
  scoringNames: {
    classic: 'Klassisch',
    gentle: 'Mild',
    always: 'Stiche zählen',
  },
  scoringDescriptions: {
    classic: 'Ansage erfüllt: 10 + 2 pro Stich. Verfehlt: −2 je Stich Abweichung.',
    gentle: 'Ansage erfüllt: 10 + 1 pro Stich. Verfehlt: 0, keine Strafe.',
    always: 'Deine Stiche zählen immer, +10 bei erfüllter Ansage.',
  },
  scoringLocked: 'Wertung vom Gastgeber gewählt',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Tempo',
  gamePaceHint: 'Gemeinsam oder wann jeder kann',
  paceNames: {
    live: 'Live',
    async: 'Im eigenen Tempo',
  },
  paceDescriptions: {
    live: 'Alle spielen gleichzeitig; ein zu langer Zug wird selbst gespielt.',
    async: 'Jeder spielt, wann er kann, über mehrere Tage. Niemand spielt für dich.',
  },
  paceLocked: 'Tempo vom Gastgeber gewählt',
  waitingForPlayer: (pseudo: string) => `Wartet auf ${pseudo}`,
  waitingToStart: 'Wartet auf den Start',

  // Spieltisch
  round: 'Runde',
  cards: (n: number) => (n === 1 ? '1 Karte' : `${n} Karten`),
  trump: 'Trumpf',
  noTrump: 'Ohne Trumpf',
  dealer: 'Geber',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Wie viele Stiche?',
  bidsTotal: (sum: number, cards: number) => `Angesagt: ${sum} / ${cards} Stiche`,
  hookForbidden: (n: number) => `Verboten: die Summe wäre genau ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} ist verboten: die Ansagen dürfen zusammen nicht ${cards} ergeben (Hakenregel).`,
  bid: 'Ansage',
  tricks: 'Stiche',

  // Übersicht der Ansagen
  bidsAnnounced: 'Angesagt',
  bidsPending: (announced: number, cards: number) =>
    `${announced} von ${cards} – Ansagen laufen`,
  bidsBalanced: (cards: number) => `Summe genau: ${cards} Stiche angesagt`,
  bidsOver: (n: number) =>
    n === 1 ? '1 Stich zu viel: einer geht unter' : `${n} Stiche zu viel: da geht wer unter`,
  bidsUnder: (n: number) =>
    n === 1 ? '1 Stich ist noch frei' : `${n} Stiche sind noch frei`,
  noBidYet: 'Noch nicht angesagt',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} Stiche`,
  yourTurn: 'Du bist dran',
  turnOf: (p: string) => `${p} ist dran`,
  trickWonBy: (p: string) => `${p} macht den Stich`,
  scoreboard: 'Punktestand',
  total: 'Gesamt',

  // Rundenabschluss
  roundRecap: 'Rundenende',
  contractKept: 'Kontrakt erfüllt',
  contractMissed: 'Kontrakt verfehlt',
  contract: 'Kontrakt',
  points: 'Punkte',
  nextRound: 'Nächste Runde',
  seeResults: 'Ergebnisse ansehen',
  waitingNextRound: 'Der Host startet gleich die nächste Runde…',

  // Spielende
  gameOver: 'Spiel beendet',
  shareResult: 'Ergebnis teilen',
  shareTitle: 'Rikiki-Partie beendet 🃏',
  shareSaved: 'Bild gespeichert',
  playAgain: 'Nochmal spielen',
  backHome: 'Startseite',

  // Ton
  soundOn: 'Ton an',
  soundOff: 'Ton aus',

  // Netzwerk
  reconnecting: 'Neu verbinden…',
  playerDisconnected: (p: string) => `${p} ist offline`,
  playerReconnected: (p: string) => `${p} ist wieder da`,
  playerJoined: (p: string) => `${p} ist dabei`,
  playerLeft: (p: string) => `${p} hat das Spiel verlassen`,
  roomClosed: 'Das Spiel wurde geschlossen.',
  roomClosedKicked: 'Du wurdest aus dem Spiel entfernt.',
  roomClosedExpired: 'Das Spiel ist abgelaufen.',

  // Einladungen
  inviteMessage: (code: string, url: string) =>
    `Spiel Rikiki mit uns! 🃏\nSpielcode: ${code}\nHier beitreten: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Teilen',

  // Konto
  saveAccount: 'Fortschritt sichern',
  saveAccountHint: 'Du bekommst einen Link per E-Mail – kein Passwort nötig',
  emailPlaceholder: 'du@email.de',
  sendMagicLink: 'Link schicken',
  magicLinkSent: 'E-Mail unterwegs! Öffne den Link zur Bestätigung.',
  accountSaved: 'Fortschritt gesichert',
  verifying: 'Prüfung…',
  verified: 'Konto bestätigt! Dein Fortschritt ist gesichert.',
  verifyFailed: 'Link ungültig oder abgelaufen. Fordere in deinem Profil einen neuen an.',

  privacyPolicy: 'Datenschutz',
  deleteAccount: 'Mein Konto löschen',
  deleteAccountHint: 'Löscht dein Profil, deinen Verlauf und deine Gruppen.',
  deleteAccountWarning: 'Dein Spitzname, deine Partien, deine Statistiken und deine Gruppen werden gelöscht. Das lässt sich nicht rückgängig machen.',
  deleteAccountAction: 'Ja, alles löschen',
  deleteAccountDone: 'Konto gelöscht.',
  cancel: 'Abbrechen',
  botTag: 'Bot',
  emotes: 'Reaktionen',
  close: 'Schließen',
  leaveGame: 'Partie verlassen',
  leaveGameWarning:
    'Die Partie läuft ohne dich weiter und deine Punkte aus dieser Partie gehen verloren.',
  leaveGameAction: 'Ja, verlassen',
  takePhoto: 'Foto aufnehmen',
  removePhoto: 'Foto entfernen',
  photoError: 'Foto zu groß oder unlesbar.',
  reportPlayer: 'Melden',
  reportDone: 'Foto ausgeblendet und gemeldet.',

  // Statistik und Verlauf
  stats: 'Statistik',
  gamesPlayed: 'Spiele',
  gamesWon: 'Siege',
  bestRound: 'beste Runde',
  noHistory: 'Noch kein Spiel zu Ende gespielt.',
  historyTitle: 'Meine letzten Spiele',
  wonBadge: 'Gewonnen',
  lostBadge: 'Verloren',
  playersCount: (n: number) => `${n} Spieler`,

  // Freundesgruppen
  groups: 'Meine Gruppen',
  groupsTitle: 'Meine Gruppen',
  groupsSubtitle: 'Eine laufende Wertung für alle, die immer zusammen spielen',
  noGroups: 'Du bist noch in keiner Gruppe.',
  createGroup: 'Gruppe erstellen',
  createGroupCta: 'Gruppe erstellen',
  groupNamePlaceholder: 'Die Dienstagsrunde',
  groupNameLabel: 'Gruppenname',
  groupNameTooShort: 'Der Name muss 2 bis 30 Zeichen lang sein.',
  joinGroup: 'Gruppe beitreten',
  joinGroupCta: 'Beitreten',
  groupCodeLabel: 'Gruppencode',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 Buchstaben, ohne I, L und O',
  groupCode: 'Gruppencode',
  groupShareHint: 'Teil diesen Code, damit deine Freunde der Gruppe beitreten',
  copyGroupCode: 'Code kopieren',
  groupCodeCopied: 'Code kopiert!',
  groupMembers: (n: number) => (n === 1 ? '1 Mitglied' : `${n} Mitglieder`),
  groupGames: (n: number) => (n === 1 ? '1 Spiel' : n === 0 ? 'keine Spiele' : `${n} Spiele`),
  groupRanking: 'Gesamtwertung',
  groupRecentGames: 'Letzte Spiele der Gruppe',
  groupNoGames: 'Noch kein Spiel in der Gruppe gespielt.',
  groupNoGamesHint: 'Starte ein Spiel mit dieser Gruppe: die Ergebnisse landen hier.',
  groupPlay: 'Mit dieser Gruppe spielen',
  groupOwner: 'Ersteller',
  groupLeave: 'Gruppe verlassen',
  groupLeaveConfirm: 'Diese Gruppe verlassen? Deine bisherigen Spiele bleiben in der Wertung.',
  groupDelete: 'Gruppe löschen',
  groupDeleteConfirm: 'Diese Gruppe samt Wertung löschen? Das ist endgültig.',
  groupOwnerCannotLeave: 'Du hast diese Gruppe erstellt: du kannst sie nur löschen.',
  groupNotFound: 'Gruppe nicht gefunden.',
  groupJoined: (name: string) => `Du bist jetzt bei „${name}“!`,
  groupCreated: (name: string) => `Gruppe „${name}“ erstellt!`,
  groupAttached: (name: string) => `Spiel zu „${name}“ hinzugefügt`,
  groupTotalPoints: 'Punkte',
  groupRankHeader: '#',
  groupPlayerHeader: 'Spieler',
  groupPointsHeader: 'Pkt',
  groupPlayedHeader: 'S',
  groupWonHeader: 'G',

  // Spielregeln
  rules: 'Spielregeln',
  rulesTitle: 'So wird gespielt',
  rulesSubtitle: 'Rikiki in 2 Minuten',
  rulesGoalTitle: 'Das Prinzip',
  rulesGoalText:
    'Vor jeder Runde sagst du an, wie viele Stiche du machen willst. Es geht darum, genau richtig zu liegen: nicht mehr, nicht weniger. Viele Stiche bringen nichts, wenn du wenige angesagt hast.',
  rulesDealTitle: 'Das Geben',
  rulesDealText:
    'Ein Spiel geht über mehrere Runden. In der ersten bekommt jeder nur eine Karte, dann zwei, dann drei … bevor es wieder abwärts geht. In jeder Runde bekommen alle gleich viele Karten.',
  rulesTrumpText: 'Eine Karte wird aufgedeckt: ihre Farbe ist der Trumpf der Runde.',
  rulesBidTitle: 'Die Ansage',
  rulesBidText:
    'Reihum sagt jeder an, wie viele Stiche er machen will – von 0 bis zur Zahl der Karten auf der Hand. Du siehst dein Blatt und den Trumpf, bevor du dich entscheidest.',
  rulesHookTitle: 'Die Hakenregel',
  rulesHookText:
    'Wer zuletzt ansagt (der Geber), darf nicht die Zahl wählen, mit der die Ansagen zusammen genau der Stichzahl der Runde entsprechen. Ergebnis: irgendwer wird garantiert enttäuscht. Die verbotene Zahl wird automatisch durchgestrichen.',
  rulesPlayTitle: 'Die Stiche',
  rulesPlayText:
    'Der Spieler links vom Geber spielt aus. Jeder legt eine Karte, die stärkste gewinnt den Stich. Der Gewinner spielt zum nächsten Stich aus.',
  rulesFollowSuit: 'Du musst die angespielte Farbe bedienen, wenn du sie hast.',
  rulesNoSuit: 'Sonst spielst du, was du willst: mit Trumpf stechen oder abwerfen.',
  rulesWinTrick: 'Der höchste Trumpf gewinnt; ohne Trumpf die höchste Karte der angespielten Farbe.',
  rulesScoreTitle: 'Die Punkte',
  rulesScoreOk: 'Kontrakt erfüllt',
  rulesScoreOkExample: 'Angesagt 3, gemacht 3 → 16 Punkte',
  rulesScoreKo: 'Kontrakt verfehlt',
  rulesScoreKoExample: 'Angesagt 3, gemacht 1 → −4 Punkte',
  rulesScoreZero: '0 ansagen und keinen Stich machen bringt 10 Punkte: ein sehr lohnender Kontrakt.',
  rulesScoreVariants: 'Der Gastgeber kann im Raum eine andere Wertung wählen:',
  rulesEndTitle: 'Spielende',
  rulesEndText:
    'Sind alle Runden gespielt, gewinnt, wer die meisten Punkte hat. Den Punktestand kannst du während des Spiels jederzeit ansehen.',
  rulesTip:
    'Tipp: In kurzen Runden reicht ein Ass oder ein hoher Trumpf oft für einen sicheren Stich. In langen Runden pass auf lange Farben auf.',
  rulesGotIt: 'Verstanden',

  // Benachrichtigungen „du bist dran“
  notificationsTitle: 'Bescheid sagen, wenn ich dran bin',
  notificationsHint:
    'Steck dein Handy ein: wir schicken dir eine Nachricht, sobald der Tisch auf dich wartet. Ideal für Spiele, die sich über den Tag ziehen.',
  notificationsEnable: 'Benachrichtigungen aktivieren',
  notificationsOn: 'Benachrichtigungen an',
  notificationsOff: 'Benachrichtigungen aus',
  notificationsChecking: 'Prüfung…',
  notificationsUnsupported: 'Dein Browser unterstützt keine Benachrichtigungen.',
  notificationsNeedsInstall:
    'Auf iPhone und iPad füg Rikiki zuerst zum Home-Bildschirm hinzu (Teilen → „Zum Home-Bildschirm“), dann komm hierher zurück.',
  notificationsDenied:
    'Benachrichtigungen sind für diese Seite blockiert. Aktivier sie in den Einstellungen deines Browsers wieder.',
  notificationsNoServiceWorker:
    'Benachrichtigungen hier nicht verfügbar (installier die App oder lad die Seite neu).',
  notificationsServerOff: 'Benachrichtigungen sind auf dem Server nicht eingerichtet.',
  notificationsError: 'Benachrichtigungen konnten nicht geändert werden.',

  updateAvailable: 'Neue Version',
  updateReload: 'Aktualisieren',
  version: (v: string) => `Version ${v}`,

  // Barrierefreiheit
  accessibility: 'Barrierefreiheit',
  colorblindMode: 'Eigene Farben',
  colorblindHint: 'Eine Farbe je Symbol, damit ♥ ♦ ♠ ♣ auch ohne Rot unterscheidbar bleiben',
  suitNames: { S: 'Pik', H: 'Herz', D: 'Karo', C: 'Kreuz' } as Record<string, string>,
  rankNames: { 11: 'Bube', 12: 'Dame', 13: 'König', 14: 'Ass' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) => (n > 1 ? `Dein Blatt: ${n} Karten` : 'Dein Blatt: 1 Karte'),

  language: 'Sprache',
  languageHint: 'Wähl die Sprache der App',

  loading: 'Lädt…',
  errorTitle: 'Hoppla',
  copyright: '© 2026 Clixite SRL',
};

export default de;
