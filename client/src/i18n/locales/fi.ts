import type { Messages } from '../types';

/**
 * Suomen lukusanasääntö: yksi on nominatiivissa, kaikki muut (myös nolla)
 * partitiivissa — «1 kortti», «2 korttia», «0 korttia».
 */
const fiN = (count: number, one: string, partitive: string): string =>
  `${count} ${count === 1 ? one : partitive}`;

export const fi: Messages = {
  appName: 'Rikiki',
  tagline: 'Tikkipeli kavereiden kesken, jokainen omalla puhelimellaan',

  // Etusivu
  createGame: 'Luo peli',
  joinGame: 'Liity peliin',
  resumeGame: 'Jatka peliä',
  myGames: 'Omat pelit',

  // Profiili
  yourPseudo: 'Nimimerkkisi',
  pickAvatar: 'Valitse hahmosi',
  letsGo: 'Menoksi!',
  save: 'Tallenna',
  editProfile: 'Oma profiili',
  changeAvatar: 'Vaihda hahmoa',

  // Liittyminen
  enterCode: 'Pelin koodi',
  join: 'Liity',
  gameCode: 'Pelin koodi',
  copyLink: 'Kopioi linkki',
  copied: 'Linkki kopioitu!',

  // Aula
  invite: 'Kutsu kavereita',
  players: 'Pelaajat',
  host: 'Isäntä',
  you: 'sinä',
  waitingForHost: 'Odotetaan, että isäntä aloittaa…',
  needPlayers: (missing: number) =>
    missing === 1 ? 'Vielä 1 pelaaja aloitukseen' : `Vielä ${missing} pelaajaa aloitukseen`,
  startGame: 'Aloita peli',
  leave: 'Poistu',
  kick: 'Poista',
  addBot: 'Lisää robotti',
  addBotHint: 'Täydennä pöytä automaattipelaajalla',
  botsFull: 'Pöytä on täynnä',
  removeBot: 'Poista robotti',

  // Pelin muoto (kesto)
  gameFormat: 'Pelin muoto',
  gameFormatHint: 'Valitse kesto ennen aloitusta',
  formatNames: {
    blitz: 'Salama',
    normal: 'Normaali',
    climb: 'Nouseva',
  },
  formatDescriptions: {
    blitz: 'Nousu ja lasku viiteen korttiin',
    normal: 'Täysi nousu ja täysi lasku',
    climb: 'Pelkkä nousu, ei laskua',
  },
  formatRounds: (n: number) => fiN(n, 'kierros', 'kierrosta'),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Isäntä valitsi muodon',

  // Pelipöytä
  round: 'Kierros',
  cards: (n: number) => fiN(n, 'kortti', 'korttia'),
  trump: 'Valtti',
  noTrump: 'Ei valttia',
  dealer: 'Jakaja',
  offline: 'poissa',
  thinking: '…',
  yourBid: 'Montako tikkiä?',
  bidsTotal: (sum: number, cards: number) =>
    `Tarjottu: ${sum} / ${fiN(cards, 'tikki', 'tikkiä')}`,
  hookForbidden: (n: number) => `Kielletty: summaksi tulisi tasan ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} on kielletty: tarjousten summa ei saa olla tasan ${cards} (koukkusääntö).`,
  bid: 'Tarjous',
  tricks: 'Tikit',

  // Kierroksen tarjoukset
  bidsAnnounced: 'Tarjottu',
  bidsPending: (announced: number, cards: number) =>
    `${announced} / ${cards} — tarjoukset kesken`,
  bidsBalanced: (cards: number) => `Tasan: ${fiN(cards, 'tikki', 'tikkiä')} tarjottu`,
  bidsOver: (n: number) =>
    n > 1 ? `${n} tikkiä liikaa: joku kaatuu` : '1 tikki liikaa: joku kaatuu',
  bidsUnder: (n: number) =>
    n > 1 ? `${n} ylimääräistä tikkiä jaossa` : '1 ylimääräinen tikki jaossa',
  noBidYet: 'Ei vielä tarjousta',
  tricksOfContract: (tricks: number, bid: number) =>
    `${tricks}/${fiN(bid, 'tikki', 'tikkiä')}`,
  yourTurn: 'Sinun vuorosi',
  turnOf: (p: string) => `Vuorossa ${p}`,
  trickWonBy: (p: string) => `${p} vie tikin`,
  scoreboard: 'Pisteet',
  total: 'Yhteensä',

  // Yhteenveto
  roundRecap: 'Kierros päättyi',
  contractKept: 'Sopimus piti',
  contractMissed: 'Sopimus petti',
  contract: 'Sopimus',
  points: 'Pisteet',
  nextRound: 'Seuraava kierros',
  seeResults: 'Katso tulokset',
  waitingNextRound: 'Isäntä aloittaa seuraavan kierroksen…',

  // Pelin päätös
  gameOver: 'Peli päättyi',
  shareResult: 'Jaa tulos',
  shareTitle: 'Rikiki-peli päättyi 🃏',
  shareSaved: 'Kuva tallennettu',
  playAgain: 'Pelaa uudestaan',
  backHome: 'Etusivu',

  // Ääni
  soundOn: 'Laita äänet päälle',
  soundOff: 'Vaimenna äänet',

  // Verkko
  reconnecting: 'Yhdistetään uudelleen…',
  playerDisconnected: (p: string) => `${p} katosi linjoilta`,
  playerReconnected: (p: string) => `${p} on taas mukana`,
  playerJoined: (p: string) => `${p} liittyi peliin`,
  playerLeft: (p: string) => `${p} poistui pelistä`,
  roomClosed: 'Peli on suljettu.',
  roomClosedKicked: 'Sinut poistettiin pelistä.',
  roomClosedExpired: 'Peli on vanhentunut.',

  // Kutsut
  inviteMessage: (code: string, url: string) =>
    `Tule pelaamaan Rikikiä kanssamme! 🃏\nPelin koodi: ${code}\nLiity tästä: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'Tekstiviesti',
  inviteShare: 'Jaa',

  // Tili
  saveAccount: 'Tallenna edistymiseni',
  saveAccountHint: 'Saat linkin sähköpostiin — ei salasanaa muistettavaksi',
  emailPlaceholder: 'sinun@sposti.fi',
  sendMagicLink: 'Lähetä linkki',
  magicLinkSent: 'Sähköposti lähti! Vahvista avaamalla linkki.',
  accountSaved: 'Edistyminen tallennettu',
  verifying: 'Tarkistetaan…',
  verified: 'Tili vahvistettu! Edistymisesi on tallessa.',
  verifyFailed: 'Linkki on virheellinen tai vanhentunut. Pyydä uusi profiilistasi.',

  // Tilastot ja historia
  stats: 'Tilastot',
  gamesPlayed: 'peliä',
  gamesWon: 'voittoa',
  bestRound: 'paras kierros',
  noHistory: 'Ei vielä pelattuja pelejä.',
  historyTitle: 'Viimeisimmät pelini',
  wonBadge: 'Voitto',
  lostBadge: 'Tappio',
  playersCount: (n: number) => fiN(n, 'pelaaja', 'pelaajaa'),

  // Kaveriryhmät
  groups: 'Omat ryhmät',
  groupsTitle: 'Omat ryhmät',
  groupsSubtitle: 'Yhteispistetaulukko porukalle, joka pelaa aina yhdessä',
  noGroups: 'Et kuulu vielä mihinkään ryhmään.',
  createGroup: 'Luo ryhmä',
  createGroupCta: 'Luo ryhmä',
  groupNamePlaceholder: 'Tiistain porukka',
  groupNameLabel: 'Ryhmän nimi',
  groupNameTooShort: 'Nimen pituus on 2–30 merkkiä.',
  joinGroup: 'Liity ryhmään',
  joinGroupCta: 'Liity',
  groupCodeLabel: 'Ryhmän koodi',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 kirjainta, ei I, L eikä O',
  groupCode: 'Ryhmän koodi',
  groupShareHint: 'Jaa koodi, niin kaverit pääsevät ryhmään',
  copyGroupCode: 'Kopioi koodi',
  groupCodeCopied: 'Koodi kopioitu!',
  groupMembers: (n: number) => fiN(n, 'jäsen', 'jäsentä'),
  groupGames: (n: number) => (n === 0 ? 'ei pelejä' : fiN(n, 'peli', 'peliä')),
  groupRanking: 'Yhteispisteet',
  groupRecentGames: 'Ryhmän viimeisimmät pelit',
  groupNoGames: 'Ryhmässä ei ole vielä pelattu.',
  groupNoGamesHint: 'Aloita peli tällä ryhmällä — tulokset ilmestyvät tähän.',
  groupPlay: 'Pelaa tällä ryhmällä',
  groupOwner: 'Perustaja',
  groupLeave: 'Poistu ryhmästä',
  groupLeaveConfirm: 'Poistutaanko ryhmästä? Aiemmat pelisi jäävät pistetaulukkoon.',
  groupDelete: 'Poista ryhmä',
  groupDeleteConfirm: 'Poistetaanko ryhmä ja koko sen pistetaulukko? Tätä ei voi perua.',
  groupOwnerCannotLeave: 'Perustit tämän ryhmän: voit vain poistaa sen.',
  groupNotFound: 'Ryhmää ei löytynyt.',
  groupJoined: (name: string) => `Liityit ryhmään ”${name}”!`,
  groupCreated: (name: string) => `Ryhmä ”${name}” luotu!`,
  groupAttached: (name: string) => `Peli liitettiin ryhmään ”${name}”`,
  groupTotalPoints: 'pistettä',
  groupRankHeader: '#',
  groupPlayerHeader: 'Pelaaja',
  groupPointsHeader: 'Pist',
  groupPlayedHeader: 'P',
  groupWonHeader: 'V',

  // Pelin säännöt
  rules: 'Pelin säännöt',
  rulesTitle: 'Näin pelataan',
  rulesSubtitle: 'Rikiki kahdessa minuutissa',
  rulesGoalTitle: 'Idea',
  rulesGoalText:
    'Ennen jokaista kierrosta tarjoat, montako tikkiä uskot vieväsi. Koko juju on osua tasan oikeaan: ei enempää eikä vähempää. Tikkien haaliminen ei auta, jos tarjosit vähän.',
  rulesDealTitle: 'Jako',
  rulesDealText:
    'Peli koostuu useasta kierroksesta. Ensimmäisellä jaetaan vain yksi kortti pelaajaa kohti, sitten kaksi, sitten kolme… ja lopuksi lasketaan takaisin alas. Joka kierroksella kaikki saavat saman määrän kortteja.',
  rulesTrumpText: 'Yksi kortti käännetään esiin: sen maa on kierroksen valtti.',
  rulesBidTitle: 'Tarjous',
  rulesBidText:
    'Vuorotellen kerrot, montako tikkiä tavoittelet — nollasta kädessä olevien korttien määrään. Näet oman kätesi ja valtin ennen päätöstä.',
  rulesHookTitle: 'Koukkusääntö',
  rulesHookText:
    'Viimeisenä tarjoava (jakaja) ei saa valita lukua, jolla tarjousten summa olisi tasan kierroksen tikkimäärä. Joku siis pettyy väistämättä. Kielletty luku yliviivataan automaattisesti.',
  rulesPlayTitle: 'Tikkien pelaaminen',
  rulesPlayText:
    'Jakajan vasemmalla puolella oleva aloittaa. Jokainen lyö yhden kortin, ja vahvin vie tikin. Voittaja aloittaa seuraavan tikin.',
  rulesFollowSuit: 'Sinun on tunnustettava aloitusmaata, jos sitä on kädessäsi.',
  rulesNoSuit: 'Muuten pelaat mitä haluat: valtaat tai heität hukkakortin.',
  rulesWinTrick: 'Korkein valtti voittaa; ilman valttia korkein aloitusmaan kortti.',
  rulesScoreTitle: 'Pisteet',
  rulesScoreOk: 'Sopimus piti',
  rulesScoreOkExample: 'Tarjous 3, tulos 3 → 16 pistettä',
  rulesScoreKo: 'Sopimus petti',
  rulesScoreKoExample: 'Tarjous 3, tulos 1 → −4 pistettä',
  rulesScoreZero:
    'Nollan tarjoaminen ja tikittä jääminen tuo 10 pistettä: erittäin kannattava sopimus.',
  rulesEndTitle: 'Pelin loppu',
  rulesEndText:
    'Kun kaikki kierrokset on pelattu, eniten pisteitä kerännyt voittaa. Pistetaulukon voi avata milloin tahansa kesken pelin.',
  rulesTip:
    'Vinkki: pienillä kierroksilla ässä tai korkea valtti riittää usein tikkiin. Suurilla kierroksilla varo pitkiä maita.',
  rulesGotIt: 'Selvä',

  // Ilmoitukset ”nyt on sinun vuorosi”
  notificationsTitle: 'Ilmoita, kun on minun vuoroni',
  notificationsHint:
    'Laita puhelin taskuun: lähetämme ilmoituksen heti, kun pöytä odottaa sinua. Täydellinen pitkin päivää venyviin peleihin.',
  notificationsEnable: 'Ota ilmoitukset käyttöön',
  notificationsOn: 'Ilmoitukset käytössä',
  notificationsOff: 'Ilmoitukset pois käytöstä',
  notificationsChecking: 'Tarkistetaan…',
  notificationsUnsupported: 'Selaimesi ei tue ilmoituksia.',
  notificationsNeedsInstall:
    'iPhonessa ja iPadissa lisää Rikiki ensin aloitusnäyttöön (Jaa → ”Lisää aloitusnäyttöön”) ja palaa sitten tänne.',
  notificationsDenied:
    'Ilmoitukset on estetty tältä sivustolta. Salli ne uudelleen selaimen asetuksista.',
  notificationsNoServiceWorker:
    'Ilmoitukset eivät ole käytettävissä täällä (asenna sovellus tai lataa sivu uudelleen).',
  notificationsServerOff: 'Ilmoituksia ei ole määritetty palvelimella.',
  notificationsError: 'Ilmoitusten muuttaminen ei onnistunut.',

  updateAvailable: 'Uusi versio',
  updateReload: 'Päivitä',
  version: (v: string) => `versio ${v}`,

  // Accessibilité
  accessibility: 'Saavutettavuus',
  colorblindMode: 'Omat värit',
  colorblindHint: 'Yksi väri kutakin maata kohden, jotta ♥ ♦ ♠ ♣ erottuvat ilman punaista',
  suitNames: { S: 'pata', H: 'hertta', D: 'ruutu', C: 'risti' } as Record<string, string>,
  rankNames: { 11: 'sotilas', 12: 'rouva', 13: 'kuningas', 14: 'ässä' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${suit} ${rank}`,
  handOf: (n: number) => (n > 1 ? `Kätesi: ${n} korttia` : 'Kätesi: 1 kortti'),

  language: 'Kieli',
  languageHint: 'Valitse sovelluksen kieli',

  loading: 'Ladataan…',
  errorTitle: 'Hups',
  copyright: '© 2026 Nicolas Simon',
};

export default fi;
