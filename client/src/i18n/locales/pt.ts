import type { Messages } from '../types';

export const pt: Messages = {
  appName: 'Rikiki',
  tagline: 'O jogo de vazas entre amigos, cada um no seu telemóvel',

  // Início
  createGame: 'Criar um jogo',
  joinGame: 'Entrar num jogo',
  resumeGame: 'Retomar o jogo',
  myGames: 'Os meus jogos',

  // Perfil
  yourPseudo: 'O teu nome',
  pickAvatar: 'Escolhe o teu avatar',
  letsGo: 'Vamos a isto!',
  save: 'Guardar',
  editProfile: 'O meu perfil',
  changeAvatar: 'Mudar de avatar',

  // Entrar
  enterCode: 'Código do jogo',
  join: 'Entrar',
  gameCode: 'Código do jogo',
  copyLink: 'Copiar o link',
  copied: 'Link copiado!',

  // Sala
  invite: 'Convidar amigos',
  players: 'Jogadores',
  host: 'Anfitrião',
  you: 'tu',
  waitingForHost: 'À espera que o anfitrião comece…',
  needPlayers: (missing: number) =>
    missing === 1 ? 'Falta 1 jogador para começar' : `Faltam ${missing} jogadores para começar`,
  startGame: 'Começar o jogo',
  leave: 'Sair',
  kick: 'Remover',
  addBot: 'Adicionar um bot',
  addBotHint: 'Completa o jogo com um jogador automático',
  botsFull: 'A mesa está cheia',
  removeBot: 'Remover o bot',

  // Formato do jogo (duração)
  gameFormat: 'Formato do jogo',
  gameFormatHint: 'Escolhe a duração antes de começar',
  formatNames: {
    blitz: 'Relâmpago',
    normal: 'Normal',
    climb: 'Subida',
  },
  formatDescriptions: {
    blitz: 'Subida e descida até 5 cartas',
    normal: 'Subida e descida completas',
    climb: 'Só subida, sem descida',
  },
  formatRounds: (n: number) => (n === 1 ? '1 ronda' : `${n} rondas`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Formato escolhido pelo anfitrião',

  // Barème de score
  scoringVariant: 'Pontuação',
  scoringHint: 'Como se contam os pontos',
  scoringNames: {
    classic: 'Clássica',
    gentle: 'Branda',
    always: 'As vazas contam sempre',
  },
  scoringDescriptions: {
    classic: 'Contrato cumprido: 10 + 2 por vaza. Falhado: −2 por vaza de diferença.',
    gentle: 'Contrato cumprido: 10 + 1 por vaza. Falhado: 0, sem penalização.',
    always: 'As tuas vazas pontuam sempre, +10 se cumprires o contrato.',
  },
  scoringLocked: 'Pontuação escolhida pelo anfitrião',

  // Mesa de jogo
  round: 'Ronda',
  cards: (n: number) => (n === 1 ? '1 carta' : `${n} cartas`),
  trump: 'Trunfo',
  noTrump: 'Sem trunfo',
  dealer: 'Dador',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Quantas vazas?',
  bidsTotal: (sum: number, cards: number) => `Apostado: ${sum} / ${cards} vazas`,
  hookForbidden: (n: number) => `Proibido: o total daria exatamente ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} é proibido: o total das apostas não pode ser ${cards} (regra do gancho).`,
  bid: 'Aposta',
  tricks: 'Vazas',

  // Resumo das apostas da ronda
  bidsAnnounced: 'Apostado',
  bidsPending: (announced: number, cards: number) =>
    `${announced} de ${cards} — apostas a decorrer`,
  bidsBalanced: (cards: number) => `Total certo: ${cards} vazas apostadas`,
  bidsOver: (n: number) =>
    n === 1 ? '1 vaza a mais: alguém vai falhar' : `${n} vazas a mais: alguém vai falhar`,
  bidsUnder: (n: number) =>
    n === 1 ? '1 vaza a sobrar para apanhar' : `${n} vazas a sobrar para apanhar`,
  noBidYet: 'Ainda não apostou',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} vazas`,
  yourTurn: 'É a tua vez',
  turnOf: (p: string) => `Vez de ${p}`,
  trickWonBy: (p: string) => `${p} ganha a vaza`,
  scoreboard: 'Pontuações',
  total: 'Total',

  // Resumo
  roundRecap: 'Fim da ronda',
  contractKept: 'Contrato cumprido',
  contractMissed: 'Contrato falhado',
  contract: 'Contrato',
  points: 'Pontos',
  nextRound: 'Ronda seguinte',
  seeResults: 'Ver os resultados',
  waitingNextRound: 'O anfitrião vai começar a ronda seguinte…',

  // Fim do jogo
  gameOver: 'Jogo terminado',
  shareResult: 'Partilhar resultado',
  shareTitle: 'Partida de Rikiki terminada 🃏',
  shareSaved: 'Imagem guardada',
  playAgain: 'Jogar outra vez',
  backHome: 'Início',

  // Som
  soundOn: 'Ligar o som',
  soundOff: 'Desligar o som',

  // Rede
  reconnecting: 'A reconectar…',
  playerDisconnected: (p: string) => `${p} perdeu a ligação`,
  playerReconnected: (p: string) => `${p} está de volta`,
  playerJoined: (p: string) => `${p} entrou no jogo`,
  playerLeft: (p: string) => `${p} saiu do jogo`,
  roomClosed: 'O jogo foi fechado.',
  roomClosedKicked: 'Foste removido do jogo.',
  roomClosedExpired: 'O jogo expirou.',

  // Convites
  inviteMessage: (code: string, url: string) =>
    `Anda jogar Rikiki connosco! 🃏\nCódigo do jogo: ${code}\nEntra aqui: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Partilhar',

  // Conta
  saveAccount: 'Guardar o meu progresso',
  saveAccountHint: 'Recebes um link por e-mail — sem palavra-passe para decorar',
  emailPlaceholder: 'tu@email.pt',
  sendMagicLink: 'Receber o meu link',
  magicLinkSent: 'E-mail enviado! Abre o link para confirmar.',
  accountSaved: 'Progresso guardado',
  verifying: 'A verificar…',
  verified: 'Conta confirmada! O teu progresso está guardado.',
  verifyFailed: 'Link inválido ou expirado. Pede outro no teu perfil.',

  privacyPolicy: 'Privacidade',
  deleteAccount: 'Eliminar a minha conta',
  deleteAccountHint: 'Apaga o teu perfil, o histórico e os grupos.',
  deleteAccountWarning: 'A tua alcunha, as tuas partidas, as tuas estatísticas e os teus grupos serão apagados. Esta ação é definitiva.',
  deleteAccountAction: 'Sim, apagar tudo',
  deleteAccountDone: 'Conta eliminada.',
  cancel: 'Cancelar',
  botTag: 'bot',
  emotes: 'Reações',
  close: 'Fechar',
  leaveGame: 'Sair do jogo',
  leaveGameWarning:
    'O jogo continua sem ti e os teus pontos desta partida perdem-se.',
  leaveGameAction: 'Sim, sair',
  takePhoto: 'Tirar uma foto',
  removePhoto: 'Remover a foto',
  photoError: 'Foto demasiado pesada ou ilegível.',
  reportPlayer: 'Denunciar',
  reportDone: 'Foto ocultada e denunciada.',

  // Estatísticas e histórico
  stats: 'Estatísticas',
  gamesPlayed: 'jogos',
  gamesWon: 'vitórias',
  bestRound: 'melhor ronda',
  noHistory: 'Ainda não terminaste nenhum jogo.',
  historyTitle: 'Os meus últimos jogos',
  wonBadge: 'Ganho',
  lostBadge: 'Perdido',
  playersCount: (n: number) => `${n} jogadores`,

  // Grupos de amigos
  groups: 'Os meus grupos',
  groupsTitle: 'Os meus grupos',
  groupsSubtitle: 'Uma classificação acumulada para quem joga sempre em conjunto',
  noGroups: 'Ainda não pertences a nenhum grupo.',
  createGroup: 'Criar um grupo',
  createGroupCta: 'Criar o grupo',
  groupNamePlaceholder: 'Os amigos de terça',
  groupNameLabel: 'Nome do grupo',
  groupNameTooShort: 'O nome deve ter entre 2 e 30 caracteres.',
  joinGroup: 'Entrar num grupo',
  joinGroupCta: 'Entrar',
  groupCodeLabel: 'Código do grupo',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 letras, sem I, L nem O',
  groupCode: 'Código do grupo',
  groupShareHint: 'Partilha este código para os teus amigos entrarem no grupo',
  copyGroupCode: 'Copiar o código',
  groupCodeCopied: 'Código copiado!',
  groupMembers: (n: number) => (n === 1 ? '1 membro' : `${n} membros`),
  groupGames: (n: number) => (n === 1 ? '1 jogo' : n === 0 ? 'nenhum jogo' : `${n} jogos`),
  groupRanking: 'Classificação acumulada',
  groupRecentGames: 'Últimos jogos do grupo',
  groupNoGames: 'Ainda não houve nenhum jogo em grupo.',
  groupNoGamesHint: 'Começa um jogo com este grupo: os resultados aparecem aqui.',
  groupPlay: 'Jogar com este grupo',
  groupOwner: 'Criador',
  groupLeave: 'Sair do grupo',
  groupLeaveConfirm: 'Sair deste grupo? Os teus jogos anteriores ficam na classificação.',
  groupDelete: 'Apagar o grupo',
  groupDeleteConfirm: 'Apagar este grupo e toda a sua classificação? É definitivo.',
  groupOwnerCannotLeave: 'Criaste este grupo: só o podes apagar.',
  groupNotFound: 'Grupo não encontrado.',
  groupJoined: (name: string) => `Entraste em «${name}»!`,
  groupCreated: (name: string) => `Grupo «${name}» criado!`,
  groupAttached: (name: string) => `Jogo associado a «${name}»`,
  groupTotalPoints: 'pontos',
  groupRankHeader: '#',
  groupPlayerHeader: 'Jogador',
  groupPointsHeader: 'Pts',
  groupPlayedHeader: 'J',
  groupWonHeader: 'V',

  // Regras do jogo
  rules: 'Regras do jogo',
  rulesTitle: 'Como se joga',
  rulesSubtitle: 'O Rikiki em 2 minutos',
  rulesGoalTitle: 'A ideia',
  rulesGoalText:
    'Antes de cada ronda, apostas quantas vazas achas que vais ganhar. O objetivo é acertar em cheio: nem mais, nem menos. Fazer muitas vazas não serve de nada se tinhas apostado poucas.',
  rulesDealTitle: 'A distribuição',
  rulesDealText:
    'O jogo decorre ao longo de várias rondas. Na primeira, distribui-se só uma carta a cada jogador, depois duas, depois três… antes de voltar a descer. Em cada ronda, toda a gente recebe o mesmo número de cartas.',
  rulesTrumpText: 'Vira-se uma carta: o naipe dela é o trunfo da ronda.',
  rulesBidTitle: 'A aposta',
  rulesBidText:
    'À vez, cada um aposta quantas vazas quer fazer — de 0 até ao número de cartas na mão. Vês o teu jogo e o trunfo antes de decidir.',
  rulesHookTitle: 'A regra do gancho',
  rulesHookText:
    'O último a apostar (o dador) não pode escolher o número que faria o total das apostas coincidir exatamente com o número de vazas da ronda. Resultado: alguém vai sair desiludido de certeza. O número proibido é riscado automaticamente.',
  rulesPlayTitle: 'O jogo das vazas',
  rulesPlayText:
    'Sai o jogador à esquerda do dador. Cada um deita uma carta e a mais forte ganha a vaza. Quem ganha sai na vaza seguinte.',
  rulesFollowSuit: 'Tens de servir o naipe pedido se tiveres alguma carta desse naipe.',
  rulesNoSuit: 'Caso contrário, jogas o que quiseres: cortar com trunfo ou descartar.',
  rulesWinTrick: 'Ganha o trunfo mais alto; sem trunfo, a carta mais alta do naipe pedido.',
  rulesScoreTitle: 'Os pontos',
  rulesScoreOk: 'Contrato cumprido',
  rulesScoreOkExample: 'Apostadas 3, feitas 3 → 16 pontos',
  rulesScoreKo: 'Contrato falhado',
  rulesScoreKoExample: 'Apostadas 3, feitas 1 → −4 pontos',
  rulesScoreZero: 'Apostar 0 e não fazer nenhuma vale 10 pontos: um contrato muito rentável.',
  rulesScoreVariants: 'O anfitrião pode escolher outra pontuação na sala:',
  rulesEndTitle: 'Fim do jogo',
  rulesEndText:
    'Jogadas todas as rondas, ganha quem somar mais pontos. Podes consultar a tabela de pontuações a qualquer momento durante o jogo.',
  rulesTip:
    'Dica: nas rondas curtas, um ás ou um trunfo alto chega muitas vezes para garantir uma vaza. Nas longas, cuidado com os naipes compridos.',
  rulesGotIt: 'Percebi',

  // Notificações «é a tua vez»
  notificationsTitle: 'Avisa-me quando for a minha vez',
  notificationsHint:
    'Guarda o telemóvel: enviamos-te uma notificação assim que a mesa estiver à tua espera. Ideal para jogos espalhados pelo dia.',
  notificationsEnable: 'Ativar as notificações',
  notificationsOn: 'Notificações ativadas',
  notificationsOff: 'Notificações desativadas',
  notificationsChecking: 'A verificar…',
  notificationsUnsupported: 'O teu navegador não suporta notificações.',
  notificationsNeedsInstall:
    'No iPhone e no iPad, adiciona primeiro o Rikiki ao ecrã principal (Partilhar → «Adicionar ao ecrã principal») e depois volta aqui.',
  notificationsDenied:
    'As notificações estão bloqueadas para este site. Volta a ativá-las nas definições do navegador.',
  notificationsNoServiceWorker:
    'Notificações indisponíveis aqui (instala a aplicação ou recarrega a página).',
  notificationsServerOff: 'As notificações não estão configuradas no servidor.',
  notificationsError: 'Não foi possível alterar as notificações.',

  updateAvailable: 'Nova versão',
  updateReload: 'Atualizar',
  version: (v: string) => `versão ${v}`,

  // Acessibilidade
  accessibility: 'Acessibilidade',
  colorblindMode: 'Cores distintas',
  colorblindHint: 'Uma cor por naipe, para distinguir ♥ ♦ ♠ ♣ sem depender do vermelho',
  suitNames: { S: 'espadas', H: 'copas', D: 'ouros', C: 'paus' } as Record<string, string>,
  rankNames: { 11: 'valete', 12: 'dama', 13: 'rei', 14: 'ás' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} de ${suit}`,
  handOf: (n: number) => (n === 1 ? 'A tua mão: 1 carta' : `A tua mão: ${n} cartas`),

  language: 'Idioma',
  languageHint: 'Escolhe o idioma da aplicação',

  loading: 'A carregar…',
  errorTitle: 'Ups',
  copyright: '© 2026 Clixite SRL',
};

export default pt;
