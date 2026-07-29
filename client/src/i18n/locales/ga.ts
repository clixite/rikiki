import type { Messages } from '../types';

/**
 * Gaeilge — córas na n-uimhreacha (CLDR: one/two/few/many/other).
 * Séimhiú i ndiaidh 1–6 (1 chárta, 3 chárta), urú i ndiaidh 7–10
 * (7 gcárta), agus an fhoirm lom i ndiaidh 0 agus 11+ (11 cárta).
 */
type GaForm = 'one' | 'two' | 'few' | 'many' | 'other';

const gaForm = (n: number): GaForm => {
  if (n === 1) return 'one';
  if (n === 2) return 'two';
  if (n >= 3 && n <= 6) return 'few';
  if (n >= 7 && n <= 10) return 'many';
  return 'other';
};

/**
 * `lenited` : an fhoirm shéimhithe (1–6), `eclipsed` : an fhoirm uraithe (7–10),
 * `plain` : an fhoirm lom (0, 11+).
 */
const ga1 = (n: number, lenited: string, eclipsed: string, plain: string) => {
  const form = gaForm(n);
  if (form === 'many') return `${n} ${eclipsed}`;
  if (form === 'other') return `${n} ${plain}`;
  return `${n} ${lenited}`;
};

const cartai = (n: number) => ga1(n, 'chárta', 'gcárta', 'cárta');
const cleasa = (n: number) => ga1(n, 'chleas', 'gcleas', 'cleas');
const imreoiri = (n: number) => ga1(n, 'imreoir', 'n-imreoir', 'imreoir');
const babhtai = (n: number) => ga1(n, 'bhabhta', 'mbabhta', 'babhta');
const cluichi = (n: number) => ga1(n, 'chluiche', 'gcluiche', 'cluiche');
const baill = (n: number) => ga1(n, 'bhall', 'mball', 'ball');

export const ga: Messages = {
  appName: 'Rikiki',
  tagline: 'An cluiche cleas le do chairde, gach duine ar a fhón féin',

  // Baile
  createGame: 'Cruthaigh cluiche',
  joinGame: 'Téigh isteach i gcluiche',
  resumeGame: 'Lean ar aghaidh',
  myGames: 'Mo chluichí',

  // Próifíl
  yourPseudo: 'Do leasainm',
  pickAvatar: 'Roghnaigh avatar',
  letsGo: 'Ar aghaidh linn!',
  save: 'Sábháil',
  editProfile: 'Mo phróifíl',
  changeAvatar: 'Athraigh an t-avatar',

  // Dul isteach
  enterCode: 'Cód an chluiche',
  join: 'Isteach',
  gameCode: 'Cód an chluiche',
  copyLink: 'Cóipeáil an nasc',
  copied: 'Nasc cóipeáilte!',

  // Halla
  invite: 'Tabhair cuireadh do chairde',
  players: 'Imreoirí',
  host: 'Óstach',
  you: 'tusa',
  waitingForHost: 'Ag fanacht leis an óstach tosú…',
  needPlayers: (missing: number) =>
    missing === 1 ? 'Imreoir amháin eile chun tosú' : `${imreoiri(missing)} eile chun tosú`,
  startGame: 'Tosaigh an cluiche',
  leave: 'Fág',
  kick: 'Bain amach',
  addBot: 'Cuir róbat leis',
  addBotHint: 'Líon an bord le himreoir uathoibríoch',
  botsFull: 'Tá an bord lán',
  removeBot: 'Bain an róbat',

  // Formáid an chluiche (fad)
  // Réglages de la partie (feuille du salon)
  gameSettings: 'Socruithe an chluiche',
  gameSettingsHint: 'Roghnaíonn an t-óstach roimh thosú',
  gameSettingsLocked: 'Roghnaíonn an t-óstach na socruithe',
  settingsDone: 'Déanta',

  gameFormat: 'Formáid an chluiche',
  gameFormatHint: 'Roghnaigh an fad sula dtosaíonn tú',
  formatNames: {
    blitz: 'Splanc',
    normal: 'Gnáth',
    climb: 'Dreapadh',
  },
  formatDescriptions: {
    blitz: 'Suas agus síos go dtí 5 chárta',
    normal: 'Suas agus síos ina n-iomláine',
    climb: 'Suas amháin, gan teacht anuas',
  },
  formatRounds: (n: number) => babhtai(n),
  formatDuration: (minutes: number) => `≈ ${minutes} nóim.`,
  formatLocked: 'Formáid roghnaithe ag an óstach',

  // Barème de score
  scoringVariant: 'Scóráil',
  scoringHint: 'An chaoi a gcomhairtear na pointí',
  scoringNames: {
    classic: 'Clasaiceach',
    gentle: 'Séimh',
    always: 'Cleasanna i gcónaí',
  },
  scoringDescriptions: {
    classic: 'Conradh comhlíonta: 10 + 2 in aghaidh an chleasa. Teipthe: −2 in aghaidh gach cleasa difríochta.',
    gentle: 'Conradh comhlíonta: 10 + 1 in aghaidh an chleasa. Teipthe: 0, gan phionós.',
    always: 'Faigheann do chleasanna pointí i gcónaí, +10 má chomhlíontar an conradh.',
  },
  scoringLocked: 'Roghnaíonn an t-óstach an scóráil',

  // Rythme de la partie (temps réel / asynchrone)
  gamePace: 'Luas',
  gamePaceHint: 'Le chéile, nó gach duine nuair is féidir',
  paceNames: {
    live: 'Beo',
    async: 'Ar do luas féin',
  },
  paceDescriptions: {
    live: 'Imríonn cách ag an am céanna; imrítear seal rófhada go huathoibríoch.',
    async: 'Imríonn gach duine nuair is féidir, thar laethanta. Ní imríonn aon duine ar do shon.',
  },
  paceLocked: 'Roghnaíonn an t-óstach an luas',
  waitingForPlayer: (pseudo: string) => `Ag fanacht le ${pseudo}`,
  waitingToStart: 'Ag fanacht leis an tús',

  // An bord
  round: 'Babhta',
  cards: (n: number) => cartai(n),
  trump: 'Mámh',
  noTrump: 'Gan mámh',
  dealer: 'Dáileoir',
  offline: 'as líne',
  thinking: '…',
  yourBid: 'Cé mhéad cleas?',
  bidsTotal: (sum: number, cards: number) => `Tairgthe: ${sum} / ${cards} cleas`,
  hookForbidden: (n: number) => `Coiscthe: bheadh an t-iomlán díreach ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `Tá ${forbidden} coiscthe: ní féidir le hiomlán na dtairiscintí a bheith cothrom le ${cards} (riail an chrúca).`,
  bid: 'Tairiscint',
  tricks: 'Cleasa',

  // Achoimre ar thairiscintí an bhabhta
  bidsAnnounced: 'Tairgthe',
  bidsPending: (announced: number, cards: number) =>
    `${announced} as ${cards} — tairiscintí ar siúl`,
  bidsBalanced: (cards: number) => `Iomlán cruinn: ${cleasa(cards)} tairgthe`,
  bidsOver: (n: number) =>
    n === 1
      ? 'Cleas amháin sa bhreis: titfidh duine éigin'
      : `${cleasa(n)} sa bhreis: titfidh duine éigin`,
  bidsUnder: (n: number) =>
    n === 1 ? 'Cleas amháin saor le piocadh' : `${cleasa(n)} saor le piocadh`,
  noBidYet: 'Gan tairiscint fós',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} cleas`,
  yourTurn: 'Do sheal féin',
  turnOf: (p: string) => `Tá ${p} ag imirt`,
  trickWonBy: (p: string) => `Bhuaigh ${p} an cleas`,
  scoreboard: 'Scóir',
  total: 'Iomlán',

  // Achoimre
  roundRecap: 'Deireadh an bhabhta',
  contractKept: 'Conradh comhlíonta',
  contractMissed: 'Conradh teipthe',
  contract: 'Conradh',
  points: 'Pointí',
  nextRound: 'An chéad bhabhta eile',
  seeResults: 'Féach ar na torthaí',
  waitingNextRound: 'Tosóidh an t-óstach an chéad bhabhta eile…',

  // Deireadh an chluiche
  gameOver: 'Cluiche thart',
  shareResult: 'Roinn an toradh',
  shareTitle: 'Cluiche Rikiki thart 🃏',
  shareSaved: 'Íomhá sábháilte',
  playAgain: 'Imir arís',
  backHome: 'Baile',

  // Fuaim
  soundOn: 'Cuir fuaim ar siúl',
  soundOff: 'Múch an fhuaim',

  // Líonra
  reconnecting: 'Ag athnascadh…',
  playerDisconnected: (p: string) => `Tá ${p} as líne`,
  playerReconnected: (p: string) => `Tá ${p} ar ais`,
  playerJoined: (p: string) => `Tháinig ${p} isteach sa chluiche`,
  playerLeft: (p: string) => `D’fhág ${p} an cluiche`,
  roomClosed: 'Dúnadh an cluiche.',
  roomClosedKicked: 'Baineadh amach as an gcluiche thú.',
  roomClosedExpired: 'Chuaigh an cluiche in éag.',

  // Cuirí
  inviteMessage: (code: string, url: string) =>
    `Tar ag imirt Rikiki linn! 🃏\nCód an chluiche: ${code}\nIsteach anseo: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Roinn',

  // Cuntas
  saveAccount: 'Sábháil mo dhul chun cinn',
  saveAccountHint: 'Gheobhaidh tú nasc ar r-phost — gan pasfhocal le cuimhneamh',
  emailPlaceholder: 'tu@riomhphost.ie',
  sendMagicLink: 'Seol an nasc chugam',
  magicLinkSent: 'R-phost seolta! Oscail an nasc chun é a dhearbhú.',
  accountSaved: 'Dul chun cinn sábháilte',
  verifying: 'Á dhearbhú…',
  verified: 'Cuntas dearbhaithe! Tá do dhul chun cinn sábháilte.',
  verifyFailed: 'Nasc neamhbhailí nó as dáta. Iarr ceann nua ó do phróifíl.',

  privacyPolicy: 'Príobháideacht',
  deleteAccount: 'Scrios mo chuntas',
  deleteAccountHint: 'Scriosann sé do phróifíl, do stair agus do ghrúpaí.',
  deleteAccountWarning: 'Scriosfar do leasainm, do chluichí, do staitisticí agus do ghrúpaí. Ní féidir é seo a chur ar ceal.',
  deleteAccountAction: 'Sea, scrios gach rud',
  deleteAccountDone: 'Cuntas scriosta.',
  cancel: 'Cealaigh',
  botTag: 'róbat',
  emotes: 'Frithghníomhartha',
  close: 'Dún',
  leaveGame: 'Fág an cluiche',
  leaveGameWarning:
    'Leanann an cluiche ar aghaidh gan tú agus caillfear do phointí don chluiche seo.',
  leaveGameAction: 'Tá, fág',
  takePhoto: 'Tóg grianghraf',
  removePhoto: 'Bain an grianghraf',
  photoError: 'Tá an grianghraf rómhór nó doléite.',
  reportPlayer: 'Tuairiscigh',
  reportDone: 'Grianghraf folaithe agus tuairiscithe.',

  // Staitisticí agus stair
  stats: 'Staitisticí',
  gamesPlayed: 'cluichí',
  gamesWon: 'buanna',
  bestRound: 'an babhta is fearr',
  noHistory: 'Níl aon chluiche críochnaithe agat fós.',
  historyTitle: 'Mo chluichí is déanaí',
  wonBadge: 'Bua',
  lostBadge: 'Caillte',
  playersCount: (n: number) => imreoiri(n),

  // Grúpaí cairde
  groups: 'Mo ghrúpaí',
  groupsTitle: 'Mo ghrúpaí',
  groupsSubtitle: 'Rangú carntha dóibh siúd a imríonn le chéile i gcónaí',
  noGroups: 'Níl tú i ngrúpa ar bith fós.',
  createGroup: 'Cruthaigh grúpa',
  createGroupCta: 'Cruthaigh an grúpa',
  groupNamePlaceholder: 'Buíon na Máirte',
  groupNameLabel: 'Ainm an ghrúpa',
  groupNameTooShort: 'Caithfidh idir 2 agus 30 carachtar a bheith san ainm.',
  joinGroup: 'Téigh isteach i ngrúpa',
  joinGroupCta: 'Isteach',
  groupCodeLabel: 'Cód an ghrúpa',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 litir, gan I, L ná O',
  groupCode: 'Cód an ghrúpa',
  groupShareHint: 'Roinn an cód seo le go dtiocfaidh do chairde isteach sa ghrúpa',
  copyGroupCode: 'Cóipeáil an cód',
  groupCodeCopied: 'Cód cóipeáilte!',
  groupMembers: (n: number) => baill(n),
  groupGames: (n: number) => (n === 0 ? 'gan chluiche' : cluichi(n)),
  groupRanking: 'Rangú carntha',
  groupRecentGames: 'Cluichí is déanaí an ghrúpa',
  groupNoGames: 'Níor imríodh cluiche ar bith sa ghrúpa fós.',
  groupNoGamesHint: 'Tosaigh cluiche leis an ngrúpa seo: taispeánfar na torthaí anseo.',
  groupPlay: 'Imir leis an ngrúpa seo',
  groupOwner: 'Bunaitheoir',
  groupLeave: 'Fág an grúpa',
  groupLeaveConfirm: 'An grúpa a fhágáil? Fanann do sheanchluichí sa rangú.',
  groupDelete: 'Scrios an grúpa',
  groupDeleteConfirm: 'An grúpa seo agus a rangú ar fad a scriosadh? Tá sé buan.',
  groupOwnerCannotLeave: 'Chruthaigh tú an grúpa seo: ní féidir leat ach é a scriosadh.',
  groupNotFound: 'Grúpa gan aimsiú.',
  groupJoined: (name: string) => `Tá tú i ‘${name}’ anois!`,
  groupCreated: (name: string) => `Cruthaíodh an grúpa ‘${name}’!`,
  groupAttached: (name: string) => `Cluiche ceangailte le ‘${name}’`,
  groupTotalPoints: 'pointí',
  groupRankHeader: '#',
  groupPlayerHeader: 'Imreoir',
  groupPointsHeader: 'Pti',
  groupPlayedHeader: 'I',
  groupWonHeader: 'B',

  // Rialacha an chluiche
  rules: 'Rialacha',
  rulesTitle: 'Conas imirt',
  rulesSubtitle: 'Rikiki in 2 nóiméad',
  rulesGoalTitle: 'An prionsabal',
  rulesGoalText:
    'Roimh gach babhta, tairgeann tú cé mhéad cleas a shíleann tú a bhuafaidh tú. Is é an cuspóir teacht ar an uimhir chruinn: gan a bheith os a cionn ná faoina bun. Ní haon mhaith mórán cleas a bhuachan má thairg tú beagán.',
  rulesDealTitle: 'An dáileadh',
  rulesDealText:
    'Imrítear an cluiche thar roinnt babhtaí. Ní thugtar ach cárta amháin an duine sa chéad bhabhta, ansin dhá cheann, ansin trí cinn… sula dtagann sé anuas arís. I ngach babhta faigheann gach duine an líon céanna cártaí.',
  rulesTrumpText: 'Iompaítear cárta: is é a dhath mámh an bhabhta.',
  rulesBidTitle: 'An tairiscint',
  rulesBidText:
    'Ar a seal, tairgeann gach duine líon na gcleas atá uaidh — ó 0 go dtí líon na gcártaí ina láimh. Feiceann tú do lámh agus an mámh sula gcinneann tú.',
  rulesHookTitle: 'Riail an chrúca',
  rulesHookText:
    'An duine deireanach a thairgeann (an dáileoir), ní féidir leis an uimhir a roghnú a chuirfeadh iomlán na dtairiscintí cothrom go díreach le líon cleas an bhabhta. Mar sin, beidh díomá ar dhuine éigin. Cuirtear líne tríd an uimhir choiscthe go huathoibríoch.',
  rulesPlayTitle: 'Imirt na gcleas',
  rulesPlayText:
    'Tosaíonn an t-imreoir ar chlé an dáileora. Cuireann gach duine cárta síos, agus buann an ceann is airde an cleas. Osclaíonn an buaiteoir an chéad cheann eile.',
  rulesFollowSuit: 'Caithfidh tú an dath a iarradh a leanúint má tá sé agat.',
  rulesNoSuit: 'Mura bhfuil, imir cibé rud is mian leat: gearr le mámh nó caith cárta uait.',
  rulesWinTrick: 'Buann an mámh is airde; gan mámh, an cárta is airde den dath a iarradh.',
  rulesScoreTitle: 'Na pointí',
  rulesScoreOk: 'Conradh comhlíonta',
  rulesScoreOkExample: 'Tairgthe 3, bainte amach 3 → 16 pointe',
  rulesScoreKo: 'Conradh teipthe',
  rulesScoreKoExample: 'Tairgthe 3, bainte amach 1 → −4 phointe',
  rulesScoreZero:
    'Má thairgeann tú 0 agus mura mbuann tú ceann ar bith, gnóthaíonn tú 10 bpointe: conradh an-bhrabúsach.',
  rulesScoreVariants: 'Is féidir leis an óstach scóráil eile a roghnú sa halla:',
  rulesEndTitle: 'Deireadh an chluiche',
  rulesEndText:
    'Nuair a bhíonn na babhtaí ar fad imrithe, buann an t-imreoir leis an líon is mó pointí. Tá clár na scór le feiceáil am ar bith le linn an chluiche.',
  rulesTip:
    'Leid: sna babhtaí beaga, is minic gur leor aon amháin nó mámh ard chun cleas a chinntiú. Sna babhtaí móra, seachain na dathanna fada.',
  rulesGotIt: 'Tuigim',

  // Fógraí ‘is é do sheal é’
  notificationsTitle: 'Cuir in iúl dom nuair is é mo sheal é',
  notificationsHint:
    'Cuir do ghuthán uait: seolfaimid fógra chugat a luaithe is a bhíonn an bord ag fanacht leat. Foirfe do chluichí a mhaireann an lá ar fad.',
  notificationsEnable: 'Cuir fógraí ar siúl',
  notificationsOn: 'Fógraí ar siúl',
  notificationsOff: 'Fógraí múchta',
  notificationsChecking: 'Á sheiceáil…',
  notificationsUnsupported: 'Ní thacaíonn do bhrabhsálaí le fógraí.',
  notificationsNeedsInstall:
    'Ar iPhone agus iPad, cuir Rikiki le do scáileán baile ar dtús (Roinn → ‘Leis an Scáileán Baile’), agus tar ar ais anseo.',
  notificationsDenied:
    'Tá fógraí bactha don suíomh seo. Cuir ar siúl arís iad i socruithe do bhrabhsálaí.',
  notificationsNoServiceWorker:
    'Níl fógraí ar fáil anseo (suiteáil an aip nó athlódáil an leathanach).',
  notificationsServerOff: 'Níl fógraí cumraithe ar an bhfreastalaí.',
  notificationsError: 'Níorbh fhéidir na fógraí a athrú.',

  updateAvailable: 'Leagan nua',
  updateReload: 'Nuashonraigh',
  version: (v: string) => `leagan ${v}`,

  // Inrochtaineacht
  accessibility: 'Inrochtaineacht',
  colorblindMode: 'Dathanna ar leith',
  colorblindHint:
    'Dath ar leith do gach comhartha, chun ♥ ♦ ♠ ♣ a aithint gan brath ar an dearg',
  suitNames: { S: 'spéireata', H: 'hart', D: 'muileata', C: 'triuf' },
  rankNames: { 11: 'cuireata', 12: 'banríon', 13: 'rí', 14: 'aon' },
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) => `Do lámh: ${cartai(n)}`,

  language: 'Teanga',
  languageHint: 'Roghnaigh teanga na haipe',

  loading: 'Á lódáil…',
  errorTitle: 'Úps',
  copyright: '© 2026 Clixite SRL',
};

export default ga;
