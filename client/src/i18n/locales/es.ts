import type { Messages } from '../types';

export const es: Messages = {
  appName: 'Rikiki',
  tagline: 'El juego de bazas entre amigos, cada uno en su móvil',

  // Inicio
  createGame: 'Crear partida',
  joinGame: 'Unirse a una partida',
  resumeGame: 'Reanudar partida',
  myGames: 'Mis partidas',

  // Perfil
  yourPseudo: 'Tu apodo',
  pickAvatar: 'Elige tu avatar',
  letsGo: '¡Vamos!',
  save: 'Guardar',
  editProfile: 'Mi perfil',
  changeAvatar: 'Cambiar de avatar',

  // Unirse
  enterCode: 'Código de la partida',
  join: 'Unirse',
  gameCode: 'Código de la partida',
  copyLink: 'Copiar el enlace',
  copied: '¡Enlace copiado!',

  // Sala
  invite: 'Invitar a amigos',
  players: 'Jugadores',
  host: 'Anfitrión',
  you: 'tú',
  waitingForHost: 'Esperando a que el anfitrión empiece…',
  waitingForHostNamed: (p: string) => `${p} empieza la partida cuando estén todos`,
  needPlayers: (missing: number) =>
    missing === 1 ? 'Falta 1 jugador para empezar' : `Faltan ${missing} jugadores para empezar`,
  startGame: 'Empezar partida',
  leave: 'Salir',
  kick: 'Expulsar',
  addBot: 'Añadir un bot',
  addBotHint: 'Completa la partida con un jugador automático',
  botsFull: 'La mesa está completa',
  removeBot: 'Quitar el bot',

  // Formato de partida (duración)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Ajustes de la partida',
  gameSettingsHint: 'El anfitrión elige antes de empezar',
  gameSettingsLocked: 'Ajustes elegidos por el anfitrión',
  settingsDone: 'Listo',

  gameFormat: 'Formato de la partida',
  gameFormatHint: 'Elige la duración antes de empezar',
  formatNames: {
    blitz: 'Relámpago',
    normal: 'Normal',
    climb: 'Ascenso',
  },
  formatDescriptions: {
    blitz: 'Subida y bajada hasta 5 cartas',
    normal: 'Subida y bajada completas',
    climb: 'Solo subida, sin bajada',
  },
  formatRounds: (n: number) => (n === 1 ? '1 ronda' : `${n} rondas`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formato elegido por el anfitrión',

  // Barème de score
  scoringVariant: 'Puntuación',
  scoringHint: 'Cómo se cuentan los puntos',
  scoringNames: {
    classic: 'Clásica',
    gentle: 'Indulgente',
    always: 'Las bazas cuentan',
  },
  scoringDescriptions: {
    classic: 'Contrato cumplido: 10 + 2 por baza. Fallado: −2 por baza de diferencia.',
    gentle: 'Contrato cumplido: 10 + 1 por baza. Fallado: 0, sin penalización.',
    always: 'Tus bazas puntúan siempre, +10 si cumples el contrato.',
  },
  scoringLocked: 'Puntuación elegida por el anfitrión',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Ritmo',
  gamePaceHint: 'Juntos, o cada uno cuando pueda',
  paceNames: {
    live: 'En directo',
    async: 'A tu ritmo',
  },
  paceDescriptions: {
    live: 'Todos juegan a la vez; un turno demasiado largo se juega solo.',
    async: 'Cada uno juega cuando puede, durante días. Nadie juega por ti.',
  },
  paceLocked: 'Ritmo elegido por el anfitrión',
  waitingForPlayer: (pseudo: string) => `Esperando a ${pseudo}`,
  waitingToStart: 'Esperando el inicio',

  // Mesa de juego
  round: 'Ronda',
  cards: (n: number) => (n === 1 ? '1 carta' : `${n} cartas`),
  trump: 'Triunfo',
  noTrump: 'Sin triunfo',
  dealer: 'Repartidor',
  offline: 'desconectado',
  thinking: '…',
  yourBid: '¿Cuántas bazas?',
  bidsTotal: (sum: number, cards: number) => `Apostado: ${sum} / ${cards} bazas`,
  hookForbidden: (n: number) => `Prohibido: el total sería exactamente ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} está prohibido: el total de las apuestas no puede ser ${cards} (regla del gancho).`,
  bid: 'Apuesta',
  tricks: 'Bazas',
  lastTrick: 'Última baza',
  spreadHand: 'Desplegar mis cartas',
  collapseHand: 'Agrupar mis cartas',

  // Resumen de las apuestas de la ronda
  bidsAnnounced: 'Apostado',
  bidsPending: (announced: number, cards: number) =>
    `${announced} de ${cards} — apuestas en curso`,
  bidsBalanced: (cards: number) => `Total exacto: ${cards} bazas apostadas`,
  bidsOver: (n: number) =>
    n === 1 ? '1 baza de más: alguien va a caer' : `${n} bazas de más: alguien va a caer`,
  bidsUnder: (n: number) =>
    n === 1 ? '1 baza suelta por recoger' : `${n} bazas sueltas por recoger`,
  noBidYet: 'Aún sin apostar',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} bazas`,
  yourTurn: 'Te toca',
  turnOf: (p: string) => `Turno de ${p}`,
  trickWonBy: (p: string) => `${p} se lleva la baza`,
  scoreboard: 'Puntuación',
  total: 'Total',

  // Recuento
  roundRecap: 'Fin de la ronda',
  contractKept: 'Contrato cumplido',
  contractMissed: 'Contrato fallado',
  contract: 'Contrato',
  points: 'Puntos',
  nextRound: 'Ronda siguiente',
  seeResults: 'Ver los resultados',
  waitingNextRound: 'El anfitrión va a empezar la siguiente ronda…',

  // Fin de partida
  gameOver: 'Partida terminada',
  shareResult: 'Compartir resultado',
  shareTitle: 'Partida de Rikiki terminada 🃏',
  shareSaved: 'Imagen guardada',
  playAgain: 'Volver a jugar',
  backHome: 'Inicio',

  // Sonido
  soundOn: 'Activar el sonido',
  soundOff: 'Silenciar',

  // Red
  reconnecting: 'Reconectando…',
  playerDisconnected: (p: string) => `${p} se ha desconectado`,
  playerReconnected: (p: string) => `${p} ha vuelto`,
  playerPaused: (p: string) => `${p} se toma un descanso`,
  playerResumed: (p: string) => `${p} vuelve a la partida`,
  playerJoined: (p: string) => `${p} se ha unido a la partida`,
  playerLeft: (p: string) => `${p} ha dejado la partida`,
  roomClosed: 'La partida se ha cerrado.',
  roomClosedKicked: 'Te han expulsado de la partida.',
  roomClosedExpired: 'La partida ha caducado.',

  // Invitaciones
  inviteMessage: (code: string, url: string) =>
    `¡Vente a jugar al Rikiki con nosotros! 🃏\nCódigo de la partida: ${code}\nÚnete aquí: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Compartir',

  // Cuenta
  saveAccount: 'Guardar mi progreso',
  saveAccountHint: 'Recibe un enlace por correo — sin contraseñas que recordar',
  emailPlaceholder: 'tu@email.es',
  sendMagicLink: 'Recibir mi enlace',
  magicLinkSent: '¡Correo enviado! Abre el enlace para confirmar.',
  accountSaved: 'Progreso guardado',
  verifying: 'Verificando…',
  verified: '¡Cuenta confirmada! Tu progreso está guardado.',
  verifyFailed: 'Enlace no válido o caducado. Pide otro desde tu perfil.',

  privacyPolicy: 'Privacidad',
  deleteAccount: 'Eliminar mi cuenta',
  deleteAccountHint: 'Borra tu perfil, tu historial y tus grupos.',
  deleteAccountWarning: 'Se borrarán tu apodo, tus partidas, tus estadísticas y tus grupos. Esta acción es definitiva.',
  deleteAccountAction: 'Sí, borrarlo todo',
  deleteAccountDone: 'Cuenta eliminada.',
  cancel: 'Cancelar',
  botTag: 'bot',
  emotes: 'Reacciones',
  phrases: 'Mensajes',
  phraseTexts: {
    nice: '¡Bien jugado!',
    oops: 'Vaya…',
    yourTurn: '¡Te toca!',
    hurry: 'Te esperamos 🙂',
    watchTrump: 'Ojo con el triunfo',
    mine: 'Esa es mía',
    sorry: '¡Perdón!',
    brb: 'Vuelvo enseguida',
    goodGame: '¡Buena partida!',
    again: '¿Otra?',
  },
  pauseGame: 'Hacer una pausa',
  resumePlay: 'Ya vuelvo a jugar',
  pausedTag: 'en pausa',
  pauseHint: 'Un robot ocupa tu sitio mientras no estás.',
  close: 'Cerrar',
  leaveGame: 'Salir de la partida',
  leaveGameWarning:
    'La partida continúa sin ti y pierdes tus puntos de esta partida.',
  leaveGameAction: 'Sí, salir',
  takePhoto: 'Hacer una foto',
  removePhoto: 'Quitar la foto',
  photoError: 'Foto demasiado grande o ilegible.',
  reportPlayer: 'Denunciar',
  reportDone: 'Foto ocultada y denunciada.',

  // Estadísticas e historial
  stats: 'Estadísticas',
  gamesPlayed: 'partidas',
  gamesWon: 'victorias',
  bestRound: 'mejor ronda',
  contractsKept: 'Contratos cumplidos',
  noHistory: 'Todavía no has terminado ninguna partida.',
  historyTitle: 'Mis últimas partidas',
  wonBadge: 'Ganada',
  lostBadge: 'Perdida',
  playersCount: (n: number) => `${n} jugadores`,

  // Grupos de amigos
  groups: 'Mis grupos',
  groupsTitle: 'Mis grupos',
  groupsSubtitle: 'Una clasificación acumulada para los que siempre juegan juntos',
  noGroups: 'Todavía no perteneces a ningún grupo.',
  createGroup: 'Crear un grupo',
  createGroupCta: 'Crear el grupo',
  groupNamePlaceholder: 'Los colegas del martes',
  groupNameLabel: 'Nombre del grupo',
  groupNameTooShort: 'El nombre debe tener entre 2 y 30 caracteres.',
  joinGroup: 'Unirse a un grupo',
  joinGroupCta: 'Unirse',
  groupCodeLabel: 'Código del grupo',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 letras, sin I, L ni O',
  groupCode: 'Código del grupo',
  groupShareHint: 'Comparte este código para que tus amigos se unan al grupo',
  copyGroupCode: 'Copiar el código',
  groupCodeCopied: '¡Código copiado!',
  groupMembers: (n: number) => (n === 1 ? '1 miembro' : `${n} miembros`),
  groupGames: (n: number) => (n === 1 ? '1 partida' : n === 0 ? 'ninguna partida' : `${n} partidas`),
  groupRanking: 'Clasificación acumulada',
  groupRecentGames: 'Últimas partidas del grupo',
  groupNoGames: 'Todavía no se ha jugado ninguna partida en grupo.',
  groupNoGamesHint: 'Empieza una partida con este grupo: los resultados aparecerán aquí.',
  groupPlay: 'Jugar con este grupo',
  groupOwner: 'Creador',
  groupLeave: 'Salir del grupo',
  groupLeaveConfirm: '¿Salir de este grupo? Tus partidas pasadas siguen en la clasificación.',
  groupDelete: 'Eliminar el grupo',
  groupDeleteConfirm: '¿Eliminar este grupo y toda su clasificación? Es definitivo.',
  groupOwnerCannotLeave: 'Has creado este grupo: solo puedes eliminarlo.',
  groupNotFound: 'Grupo no encontrado.',
  groupJoined: (name: string) => `¡Te has unido a «${name}»!`,
  groupCreated: (name: string) => `¡Grupo «${name}» creado!`,
  groupAttached: (name: string) => `Partida añadida a «${name}»`,
  groupTotalPoints: 'puntos',
  groupRankHeader: '#',
  groupPlayerHeader: 'Jugador',
  groupPointsHeader: 'Pts',
  groupPlayedHeader: 'J',
  groupWonHeader: 'G',

  // Reglas del juego
  rules: 'Reglas del juego',
  rulesTitle: 'Cómo se juega',
  demoTitle: 'La partida en un minuto',
  demoPlay: 'Ver la demostración',
  demoPause: 'Pausar',
  demoReplay: 'Verla otra vez',
  demoPrev: 'Paso anterior',
  demoNext: 'Paso siguiente',
  demoDeal: 'Cada uno recibe sus cartas. La última que se levanta marca el triunfo: su palo gana a todos los demás.',
  demoBid: 'Cada uno anuncia cuántas bazas piensa ganar. El que reparte anuncia el último y no puede hacer que el total cuadre.',
  demoFollow: 'Hay que servir el palo de salida si se tiene. Solo si no, se juega lo que se quiera.',
  demoTrump: 'Un triunfo, aunque sea el más bajo, gana la baza al palo de salida.',
  demoScore: 'Contrato cumplido: 10 puntos más 2 por baza. Fallado: 2 puntos menos por cada baza de diferencia.',
  rulesSubtitle: 'El Rikiki en 2 minutos',
  rulesGoalTitle: 'La idea',
  rulesGoalText:
    'Antes de cada ronda, apuestas cuántas bazas crees que vas a ganar. Lo importante es acertar justo: ni más, ni menos. Hacer muchas bazas no sirve de nada si habías apostado pocas.',
  rulesDealTitle: 'El reparto',
  rulesDealText:
    'La partida se juega en varias rondas. En la primera se reparte una sola carta por jugador, luego dos, luego tres… antes de volver a bajar. En cada ronda todos reciben el mismo número de cartas.',
  rulesTrumpText: 'Se da la vuelta a una carta: su palo es el triunfo de la ronda.',
  rulesBidTitle: 'La apuesta',
  rulesBidText:
    'Por turnos, cada uno apuesta cuántas bazas quiere hacer — de 0 al número de cartas en la mano. Ves tu juego y el triunfo antes de decidir.',
  rulesHookTitle: 'La regla del gancho',
  rulesHookText:
    'El último en apostar (el repartidor) no puede elegir la cifra que haría coincidir exactamente el total de las apuestas con el número de bazas de la ronda. Resultado: alguien se llevará un disgusto seguro. La cifra prohibida se tacha automáticamente.',
  rulesPlayTitle: 'El juego de las bazas',
  rulesPlayText:
    'Sale el jugador a la izquierda del repartidor. Cada uno pone una carta y la más fuerte gana la baza. El ganador sale en la siguiente.',
  rulesFollowSuit: 'Debes servir el palo pedido si tienes alguna carta de ese palo.',
  rulesNoSuit: 'Si no, juegas lo que quieras: fallar con un triunfo o descartarte.',
  rulesWinTrick: 'Gana el triunfo más alto; sin triunfo, la carta más alta del palo pedido.',
  rulesScoreTitle: 'Los puntos',
  rulesScoreOk: 'Contrato cumplido',
  rulesScoreOkExample: 'Apostadas 3, hechas 3 → 16 puntos',
  rulesScoreKo: 'Contrato fallado',
  rulesScoreKoExample: 'Apostadas 3, hechas 1 → −4 puntos',
  rulesScoreZero: 'Apostar 0 y no hacer ninguna da 10 puntos: un contrato muy rentable.',
  rulesScoreVariants: 'El anfitrión puede elegir otra puntuación en la sala:',
  rulesEndTitle: 'Fin de la partida',
  rulesEndText:
    'Cuando se han jugado todas las rondas, gana quien suma más puntos. Puedes consultar la tabla de puntuación en cualquier momento de la partida.',
  rulesTip:
    'Consejo: en las rondas cortas, un as o un triunfo alto suele bastar para asegurar una baza. En las largas, cuidado con los palos largos.',
  rulesGotIt: 'Entendido',

  // Notificaciones «te toca»
  notificationsTitle: 'Avisarme cuando sea mi turno',
  notificationsHint:
    'Guarda el móvil: te enviamos una notificación en cuanto la mesa te esté esperando. Ideal para partidas repartidas a lo largo del día.',
  notificationsEnable: 'Activar las notificaciones',
  notificationsOn: 'Notificaciones activadas',
  notificationsOff: 'Notificaciones desactivadas',
  notificationsChecking: 'Verificando…',
  notificationsUnsupported: 'Tu navegador no admite notificaciones.',
  notificationsNeedsInstall:
    'En iPhone y iPad, añade primero Rikiki a la pantalla de inicio (Compartir → «Añadir a inicio») y luego vuelve aquí.',
  notificationsDenied:
    'Las notificaciones están bloqueadas para este sitio. Vuelve a activarlas en los ajustes del navegador.',
  notificationsNoServiceWorker:
    'Notificaciones no disponibles aquí (instala la aplicación o recarga la página).',
  notificationsServerOff: 'Las notificaciones no están configuradas en el servidor.',
  notificationsError: 'No se han podido cambiar las notificaciones.',

  updateAvailable: 'Nueva versión',
  updateReload: 'Actualizar',
  version: (v: string) => `versión ${v}`,

  // Accesibilidad
  accessibility: 'Accesibilidad',
  colorblindMode: 'Colores distintos',
  colorblindHint: 'Un color por palo, para distinguir ♥ ♦ ♠ ♣ sin depender del rojo',
  suitNames: { S: 'picas', H: 'corazones', D: 'diamantes', C: 'tréboles' } as Record<string, string>,
  rankNames: { 11: 'jota', 12: 'reina', 13: 'rey', 14: 'as' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} de ${suit}`,
  handOf: (n: number) => (n > 1 ? `Tu mano: ${n} cartas` : 'Tu mano: 1 carta'),

  language: 'Idioma',
  languageHint: 'Elige el idioma de la aplicación',

  loading: 'Cargando…',
  errorTitle: 'Vaya',
  copyright: '© 2026 Clixite SRL',
};

export default es;
