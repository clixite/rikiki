import type { Messages } from '../types';

/**
 * Български. Множествено число: 1 → единствено, останалото → множествено.
 * Мъжките неодушевени съществителни след число вземат бройна форма
 * (1 рунд → 2 рунда), затова „рунд“ се изписва отделно.
 */
const karti = (n: number) => (n === 1 ? '1 карта' : `${n} карти`);
const vzyatki = (n: number) => (n === 1 ? '1 взятка' : `${n} взятки`);
const igrachi = (n: number) => (n === 1 ? '1 играч' : `${n} играчи`);
const rundove = (n: number) => (n === 1 ? '1 рунд' : `${n} рунда`);
const igri = (n: number) => (n === 1 ? '1 игра' : `${n} игри`);
const chlenove = (n: number) => (n === 1 ? '1 член' : `${n} членове`);

export const bg: Messages = {
  appName: 'Rikiki',
  tagline: 'Играта на взятки с приятели, всеки на своя телефон',

  // Начало
  createGame: 'Създай игра',
  joinGame: 'Влез в игра',
  resumeGame: 'Продължи играта',
  myGames: 'Моите игри',

  // Профил
  yourPseudo: 'Твоят прякор',
  pickAvatar: 'Избери си аватар',
  letsGo: 'Да започваме!',
  save: 'Запази',
  editProfile: 'Моят профил',
  changeAvatar: 'Смени аватара',

  // Влизане
  enterCode: 'Код на играта',
  join: 'Влез',
  gameCode: 'Код на играта',
  copyLink: 'Копирай линка',
  copied: 'Линкът е копиран!',

  // Салон
  invite: 'Покани приятели',
  players: 'Играчи',
  host: 'Домакин',
  you: 'ти',
  waitingForHost: 'Чакаме домакинът да започне…',
  waitingForHostNamed: (p: string) => `${p} започва играта, щом всички са тук`,
  needPlayers: (missing: number) =>
    missing === 1 ? 'Още 1 играч, за да започнем' : `Още ${missing} играчи, за да започнем`,
  startGame: 'Започни играта',
  leave: 'Излез',
  kick: 'Премахни',
  addBot: 'Добави робот',
  addBotHint: 'Допълни играта с автоматичен играч',
  botsFull: 'Масата е пълна',
  removeBot: 'Махни робота',

  // Формат на играта (продължителност)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Настройки на играта',
  gameSettingsHint: 'Домакинът избира преди старта',
  gameSettingsLocked: 'Настройките се избират от домакина',
  settingsDone: 'Готово',

  gameFormat: 'Формат на играта',
  gameFormatHint: 'Избери продължителността преди старта',
  formatNames: {
    blitz: 'Светкавица',
    normal: 'Нормална',
    climb: 'Възходяща',
  },
  formatDescriptions: {
    blitz: 'Нагоре и надолу до 5 карти',
    normal: 'Пълно изкачване и слизане',
    climb: 'Само нагоре, без връщане',
  },
  formatRounds: (n: number) => rundove(n),
  formatDuration: (minutes: number) => `≈ ${minutes} мин`,
  formatLocked: 'Форматът е избран от домакина',

  // Barème de score
  scoringVariant: 'Точкуване',
  scoringHint: 'Как се броят точките',
  scoringNames: {
    classic: 'Класическо',
    gentle: 'Меко',
    always: 'Взятките се броят',
  },
  scoringDescriptions: {
    classic: 'Точна заявка: 10 + 2 на взятка. Сгрешена: −2 за всяка разлика.',
    gentle: 'Точна заявка: 10 + 1 на взятка. Сгрешена: 0, без наказание.',
    always: 'Взятките винаги носят точки, +10 при точна заявка.',
  },
  scoringLocked: 'Точкуването се избира от домакина',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Ритъм',
  gamePaceHint: 'Заедно или всеки когато може',
  paceNames: {
    live: 'На живо',
    async: 'Свободен ритъм',
  },
  paceDescriptions: {
    live: 'Всички играят едновременно; твърде дълъг ход се изиграва сам.',
    async: 'Всеки играе когато може, в продължение на дни. Никой не играе вместо теб.',
  },
  paceLocked: 'Ритъмът се избира от домакина',
  waitingForPlayer: (pseudo: string) => `Чака се ${pseudo}`,
  waitingToStart: 'Чака се начало',

  // Маса за игра
  round: 'Рунд',
  cards: (n: number) => karti(n),
  trump: 'Коз',
  noTrump: 'Без коз',
  dealer: 'Раздаващ',
  offline: 'офлайн',
  thinking: '…',
  yourBid: 'Колко взятки?',
  bidsTotal: (sum: number, cards: number) => `Заявени: ${sum} / ${cards} взятки`,
  hookForbidden: (n: number) => `Забранено: сборът щеше да стане точно ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} е забранено: сборът от анонсите не може да е равен на ${cards} (правило на куката).`,
  bid: 'Анонс',
  tricks: 'Взятки',
  lastTrick: 'Последна ръка',
  spreadHand: 'Разгъни картите',
  collapseHand: 'Събери картите',

  // Обобщение на анонсите в рунда
  bidsAnnounced: 'Заявени',
  bidsPending: (announced: number, cards: number) => `${announced} от ${cards} — анонсите текат`,
  bidsBalanced: (cards: number) => `Точен сбор: ${vzyatki(cards)}`,
  bidsOver: (n: number) =>
    n === 1 ? '1 взятка в повече: някой ще падне' : `${n} взятки в повече: някой ще падне`,
  bidsUnder: (n: number) =>
    n === 1 ? '1 свободна взятка за прибиране' : `${n} свободни взятки за прибиране`,
  noBidYet: 'Още без анонс',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} взятки`,
  yourTurn: 'Ти си на ход',
  turnOf: (p: string) => `На ход е ${p}`,
  trickWonBy: (p: string) => `${p} печели взятката`,
  scoreboard: 'Точки',
  total: 'Общо',

  // Обобщение
  roundRecap: 'Край на рунда',
  contractKept: 'Изпълнен контракт',
  contractMissed: 'Провален контракт',
  contract: 'Контракт',
  points: 'Точки',
  nextRound: 'Следващ рунд',
  seeResults: 'Виж резултатите',
  waitingNextRound: 'Домакинът ще пусне следващия рунд…',

  // Край на играта
  gameOver: 'Край на играта',
  shareResult: 'Сподели резултата',
  shareTitle: 'Партия Rikiki приключи 🃏',
  shareSaved: 'Изображението е запазено',
  playAgain: 'Играй пак',
  backHome: 'Начало',

  // Звук
  soundOn: 'Включи звука',
  soundOff: 'Изключи звука',

  // Мрежа
  reconnecting: 'Повторно свързване…',
  playerDisconnected: (p: string) => `${p} прекъсна връзката`,
  playerReconnected: (p: string) => `${p} се върна`,
  playerPaused: (p: string) => `${p} е в пауза`,
  playerResumed: (p: string) => `${p} се връща в играта`,
  playerJoined: (p: string) => `${p} се присъедини към играта`,
  playerLeft: (p: string) => `${p} напусна играта`,
  roomClosed: 'Играта беше затворена.',
  roomClosedKicked: 'Отстранен си от играта.',
  roomClosedExpired: 'Играта изтече.',

  // Покани
  inviteMessage: (code: string, url: string) =>
    `Ела да играем Rikiki с нас! 🃏\nКод на играта: ${code}\nВлез оттук: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Сподели',

  // Профил
  saveAccount: 'Запази напредъка си',
  saveAccountHint: 'Получаваш линк по имейл — няма пароли за помнене',
  emailPlaceholder: 'ti@email.bg',
  sendMagicLink: 'Изпрати ми линк',
  magicLinkSent: 'Имейлът е изпратен! Отвори линка, за да потвърдиш.',
  accountSaved: 'Напредъкът е запазен',
  verifying: 'Проверка…',
  verified: 'Профилът е потвърден! Напредъкът ти е запазен.',
  verifyFailed: 'Невалиден или изтекъл линк. Поискай нов от профила си.',

  privacyPolicy: 'Поверителност',
  deleteAccount: 'Изтриване на профила ми',
  deleteAccountHint: 'Изтрива профила, историята и групите ти.',
  deleteAccountWarning: 'Псевдонимът, игрите, статистиките и групите ти ще бъдат изтрити. Действието е окончателно.',
  deleteAccountAction: 'Да, изтрий всичко',
  deleteAccountDone: 'Профилът е изтрит.',
  cancel: 'Отказ',
  botTag: 'бот',
  emotes: 'Реакции',
  phrases: 'Съобщения',
  phraseTexts: {
    nice: 'Браво!',
    oops: 'Ох…',
    yourTurn: 'Твой ред е!',
    hurry: 'Чакаме те 🙂',
    watchTrump: 'Внимавай с козовете',
    mine: 'Тази е моя',
    sorry: 'Съжалявам!',
    brb: 'Връщам се веднага',
    goodGame: 'Хубава игра!',
    again: 'Още една?',
  },
  pauseGame: 'Пауза',
  resumePlay: 'Върнах се',
  pausedTag: 'в пауза',
  pauseHint: 'Робот пази мястото ти, докато те няма.',
  close: 'Затвори',
  leaveGame: 'Напускане на играта',
  leaveGameWarning:
    'Играта продължава без теб, а точките ти от нея се губят.',
  leaveGameAction: 'Да, напусни',
  takePhoto: 'Направи снимка',
  removePhoto: 'Премахни снимката',
  photoError: 'Снимката е твърде голяма или нечетима.',
  reportPlayer: 'Сигнал',
  reportDone: 'Снимката е скрита и подадена за преглед.',

  // Статистика и история
  stats: 'Статистика',
  gamesPlayed: 'игри',
  gamesWon: 'победи',
  bestRound: 'най-добър рунд',
  contractsKept: 'Изпълнени обявки',
  noHistory: 'Още няма завършени игри.',
  historyTitle: 'Последните ми игри',
  wonBadge: 'Победа',
  lostBadge: 'Загуба',
  playersCount: (n: number) => igrachi(n),

  // Групи приятели
  groups: 'Моите групи',
  groupsTitle: 'Моите групи',
  groupsSubtitle: 'Общо класиране за онези, които винаги играят заедно',
  noGroups: 'Още не си в никоя група.',
  createGroup: 'Създай група',
  createGroupCta: 'Създай групата',
  groupNamePlaceholder: 'Вторнишката компания',
  groupNameLabel: 'Име на групата',
  groupNameTooShort: 'Името трябва да е между 2 и 30 знака.',
  joinGroup: 'Влез в група',
  joinGroupCta: 'Влез',
  groupCodeLabel: 'Код на групата',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 букви, без I, L и O',
  groupCode: 'Код на групата',
  groupShareHint: 'Сподели този код, за да влязат приятелите ти в групата',
  copyGroupCode: 'Копирай кода',
  groupCodeCopied: 'Кодът е копиран!',
  groupMembers: (n: number) => chlenove(n),
  groupGames: (n: number) => (n === 0 ? 'няма игри' : igri(n)),
  groupRanking: 'Общо класиране',
  groupRecentGames: 'Последни игри на групата',
  groupNoGames: 'Още няма изиграни игри в групата.',
  groupNoGamesHint: 'Пусни игра с тази група: резултатите ще се появят тук.',
  groupPlay: 'Играй с тази група',
  groupOwner: 'Създател',
  groupLeave: 'Напусни групата',
  groupLeaveConfirm: 'Да напуснеш ли групата? Миналите ти игри остават в класирането.',
  groupDelete: 'Изтрий групата',
  groupDeleteConfirm: 'Да изтрием ли групата и цялото ѝ класиране? Това е окончателно.',
  groupOwnerCannotLeave: 'Ти създаде тази група: можеш само да я изтриеш.',
  groupNotFound: 'Групата не е намерена.',
  groupJoined: (name: string) => `Влезе в „${name}“!`,
  groupCreated: (name: string) => `Групата „${name}“ е създадена!`,
  groupAttached: (name: string) => `Играта е добавена към „${name}“`,
  groupTotalPoints: 'точки',
  groupRankHeader: '#',
  groupPlayerHeader: 'Играч',
  groupPointsHeader: 'Тчк',
  groupPlayedHeader: 'И',
  groupWonHeader: 'П',

  // Правила на играта
  rules: 'Правила',
  rulesTitle: 'Как се играе',
  demoTitle: 'Играта за една минута',
  demoPlay: 'Пусни демонстрацията',
  demoPause: 'Пауза',
  demoReplay: 'Виж отново',
  demoPrev: 'Предишна стъпка',
  demoNext: 'Следваща стъпка',
  demoDeal: 'Всеки получава картите си. Последната обърната определя коза: неговата боя бие всички останали.',
  demoBid: 'Всеки обявява колко ръце смята да вземе. Раздаващият обявява последен и не може да направи сбора точен.',
  demoFollow: 'Следва се исканата боя, ако я имаш. Само иначе играеш каквото искаш.',
  demoTrump: 'Козът, дори най-малкият, взема ръката пред исканата боя.',
  demoScore: 'Изпълнена обявка: 10 точки плюс 2 за ръка. Пропусната: 2 точки по-малко за всяка ръка разлика.',
  rulesSubtitle: 'Rikiki за 2 минути',
  rulesGoalTitle: 'Идеята',
  rulesGoalText:
    'Преди всеки рунд обявявате колко взятки смятате да вземете. Целта е да улучите точно: нито повече, нито по-малко. Много взятки не помагат, ако сте заявили малко.',
  rulesDealTitle: 'Раздаването',
  rulesDealText:
    'Играта върви на няколко рунда. В първия всеки получава по една карта, после по две, после по три… а след това обратно надолу. Във всеки рунд всички имат еднакъв брой карти.',
  rulesTrumpText: 'Обръща се една карта: нейната боя е козът за рунда.',
  rulesBidTitle: 'Анонсът',
  rulesBidText:
    'Един по един обявявате колко взятки целите — от 0 до броя карти в ръката. Виждаш картите си и коза, преди да решиш.',
  rulesHookTitle: 'Правилото на куката',
  rulesHookText:
    'Последният, който анонсира (раздаващият), не може да избере числото, при което сборът от анонсите съвпада точно с броя взятки в рунда. Значи някой задължително ще остане разочарован. Забраненото число се зачертава автоматично.',
  rulesPlayTitle: 'Игра на взятките',
  rulesPlayText:
    'Играчът вляво от раздаващия започва. Всеки слага по една карта, а най-силната печели взятката. Победителят започва следващата.',
  rulesFollowSuit: 'Длъжен си да отговориш в поисканата боя, ако имаш от нея.',
  rulesNoSuit: 'Иначе играеш каквото искаш: цакаш с коз или се отърваваш от карта.',
  rulesWinTrick: 'Печели най-високият коз; без коз — най-високата карта от поисканата боя.',
  rulesScoreTitle: 'Точките',
  rulesScoreOk: 'Изпълнен контракт',
  rulesScoreOkExample: 'Заявени 3, взети 3 → 16 точки',
  rulesScoreKo: 'Провален контракт',
  rulesScoreKoExample: 'Заявени 3, взети 1 → −4 точки',
  rulesScoreZero:
    'Заявиш ли 0 и не вземеш нито една, печелиш 10 точки: много изгоден контракт.',
  rulesScoreVariants: 'Домакинът може да избере друго точкуване в стаята:',
  rulesEndTitle: 'Край на играта',
  rulesEndText:
    'След последния рунд печели играчът с най-много точки. Таблицата с точките е достъпна по всяко време по време на играта.',
  rulesTip:
    'Съвет: в малките рундове асо или висок коз често стигат за една взятка. В големите внимавай с дългите бои.',
  rulesGotIt: 'Разбрах',

  // Известия „ти си на ход“
  notificationsTitle: 'Уведоми ме, щом съм на ход',
  notificationsHint:
    'Прибери телефона: пращаме ти известие, щом масата те чака. Идеално за игри, разтеглени през целия ден.',
  notificationsEnable: 'Включи известията',
  notificationsOn: 'Известията са включени',
  notificationsOff: 'Известията са изключени',
  notificationsChecking: 'Проверка…',
  notificationsUnsupported: 'Браузърът ти не поддържа известия.',
  notificationsNeedsInstall:
    'На iPhone и iPad първо добави Rikiki към началния екран (Сподели → „Към началния екран“), после се върни тук.',
  notificationsDenied:
    'Известията са блокирани за този сайт. Разреши ги отново в настройките на браузъра.',
  notificationsNoServiceWorker:
    'Известията не са достъпни тук (инсталирай приложението или презареди страницата).',
  notificationsServerOff: 'Известията не са настроени на сървъра.',
  notificationsError: 'Известията не могат да бъдат променени.',

  updateAvailable: 'Нова версия',
  updateReload: 'Обнови',
  version: (v: string) => `версия ${v}`,

  // Достъпност
  accessibility: 'Достъпност',
  colorblindMode: 'Различими цветове',
  colorblindHint:
    'По един нюанс за всяка боя, за да различаваш ♥ ♦ ♠ ♣ без да разчиташ на червеното',
  suitNames: { S: 'пика', H: 'купа', D: 'каро', C: 'спатия' },
  rankNames: { 11: 'вале', 12: 'дама', 13: 'поп', 14: 'асо' },
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) => `Ръката ти: ${karti(n)}`,

  language: 'Език',
  languageHint: 'Избери езика на приложението',

  loading: 'Зареждане…',
  errorTitle: 'Опа',
  copyright: '© 2026 Clixite SRL',
};

export default bg;
