import type { Messages } from '../types';

/**
 * Pluriel polonais : trois formes.
 *   1                                  → mianownik singulier   (1 karta)
 *   2-4, sauf 12-14                    → mianownik pluriel     (3 karty)
 *   0, 5-21, 12-14…                    → dopełniacz pluriel    (7 kart)
 */
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const tricks = (n: number): string => plural(n, '1 lewa', `${n} lewy`, `${n} lew`);

export const pl: Messages = {
  appName: 'Rikiki',
  tagline: 'Gra w lewy ze znajomymi, każdy na swoim telefonie',

  // Ekran główny
  createGame: 'Nowa partia',
  joinGame: 'Dołącz do partii',
  resumeGame: 'Wróć do partii',
  myGames: 'Moje partie',

  // Profil
  yourPseudo: 'Twój pseudonim',
  pickAvatar: 'Wybierz awatar',
  letsGo: 'Zaczynamy!',
  save: 'Zapisz',
  editProfile: 'Mój profil',
  changeAvatar: 'Zmień awatar',

  // Dołączanie
  enterCode: 'Kod partii',
  join: 'Dołącz',
  gameCode: 'Kod partii',
  copyLink: 'Kopiuj link',
  copied: 'Link skopiowany!',

  // Poczekalnia
  invite: 'Zaproś znajomych',
  players: 'Gracze',
  host: 'Gospodarz',
  you: 'ty',
  waitingForHost: 'Czekamy, aż gospodarz rozpocznie…',
  needPlayers: (missing: number) =>
    plural(
      missing,
      'Jeszcze 1 gracz do startu',
      `Jeszcze ${missing} gracze do startu`,
      `Jeszcze ${missing} graczy do startu`,
    ),
  startGame: 'Rozpocznij partię',
  leave: 'Wyjdź',
  kick: 'Usuń',
  addBot: 'Dodaj bota',
  addBotHint: 'Uzupełnij stolik automatycznym graczem',
  botsFull: 'Stolik jest pełny',
  removeBot: 'Usuń bota',

  // Format partii (długość)
  gameFormat: 'Format partii',
  gameFormatHint: 'Wybierz długość przed startem',
  formatNames: {
    blitz: 'Błyskawiczna',
    normal: 'Normalna',
    climb: 'Rosnąca',
  },
  formatDescriptions: {
    blitz: 'W górę i w dół do 5 kart',
    normal: 'Pełna wspinaczka i zejście',
    climb: 'Tylko w górę, bez zejścia',
  },
  formatRounds: (n: number) => plural(n, '1 runda', `${n} rundy`, `${n} rund`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Format wybiera gospodarz',

  // Barème de score
  scoringVariant: 'Punktacja',
  scoringHint: 'Jak liczone są punkty',
  scoringNames: {
    classic: 'Klasyczna',
    gentle: 'Łagodna',
    always: 'Lewy zawsze się liczą',
  },
  scoringDescriptions: {
    classic: 'Deklaracja trafiona: 10 + 2 za lewę. Nietrafiona: −2 za każdą lewę różnicy.',
    gentle: 'Deklaracja trafiona: 10 + 1 za lewę. Nietrafiona: 0, bez kary.',
    always: 'Twoje lewy zawsze punktują, +10 za trafioną deklarację.',
  },
  scoringLocked: 'Punktację wybiera gospodarz',

  // Stół
  round: 'Runda',
  cards: (n: number) => plural(n, '1 karta', `${n} karty`, `${n} kart`),
  trump: 'Atut',
  noTrump: 'Bez atu',
  dealer: 'Rozdający',
  offline: 'offline',
  thinking: '…',
  yourBid: 'Ile lew?',
  bidsTotal: (sum: number, cards: number) => `Deklaracje: ${sum} / ${tricks(cards)}`,
  hookForbidden: (n: number) => `Zakazane: suma wyniosłaby dokładnie ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} jest zakazane: suma deklaracji nie może równać się ${cards} (reguła haczyka).`,
  bid: 'Deklaracja',
  tricks: 'Lewy',

  // Podsumowanie deklaracji rundy
  bidsAnnounced: 'Zadeklarowano',
  bidsPending: (announced: number, cards: number) =>
    `${announced} z ${cards} — trwają deklaracje`,
  bidsBalanced: (cards: number) => `Suma równa liczbie lew: ${cards}`,
  bidsOver: (n: number) =>
    plural(
      n,
      'O 1 lewę za dużo: ktoś się wyłoży',
      `O ${n} lewy za dużo: ktoś się wyłoży`,
      `O ${n} lew za dużo: ktoś się wyłoży`,
    ),
  bidsUnder: (n: number) =>
    plural(
      n,
      'Zostaje 1 lewa do wzięcia',
      `Zostają ${n} lewy do wzięcia`,
      `Zostaje ${n} lew do wzięcia`,
    ),
  noBidYet: 'Jeszcze bez deklaracji',
  tricksOfContract: (tricksWon: number, bid: number) => `${tricksWon}/${bid} lew`,
  yourTurn: 'Twoja kolej',
  turnOf: (p: string) => `Kolej: ${p}`,
  trickWonBy: (p: string) => `${p} bierze lewę`,
  scoreboard: 'Wyniki',
  total: 'Razem',

  // Podsumowanie
  roundRecap: 'Koniec rundy',
  contractKept: 'Kontrakt wykonany',
  contractMissed: 'Kontrakt niewykonany',
  contract: 'Kontrakt',
  points: 'Punkty',
  nextRound: 'Następna runda',
  seeResults: 'Zobacz wyniki',
  waitingNextRound: 'Gospodarz rozpocznie następną rundę…',

  // Koniec partii
  gameOver: 'Koniec partii',
  shareResult: 'Udostępnij wynik',
  shareTitle: 'Partia Rikiki zakończona 🃏',
  shareSaved: 'Obraz zapisany',
  playAgain: 'Rewanż',
  backHome: 'Menu główne',

  // Dźwięk
  soundOn: 'Włącz dźwięk',
  soundOff: 'Wycisz',

  // Sieć
  reconnecting: 'Ponowne łączenie…',
  playerDisconnected: (p: string) => `${p} traci połączenie`,
  playerReconnected: (p: string) => `${p} wraca do gry`,
  playerJoined: (p: string) => `${p} dołącza do partii`,
  playerLeft: (p: string) => `${p} opuszcza partię`,
  roomClosed: 'Partia została zamknięta.',
  roomClosedKicked: 'Usunięto cię z partii.',
  roomClosedExpired: 'Partia wygasła.',

  // Zaproszenia
  inviteMessage: (code: string, url: string) =>
    `Zagraj z nami w Rikiki! 🃏\nKod partii: ${code}\nDołącz tutaj: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Udostępnij',

  // Konto
  saveAccount: 'Zapisz moje postępy',
  saveAccountHint: 'Dostaniesz link e-mailem — żadnego hasła do zapamiętania',
  emailPlaceholder: 'twoj@email.pl',
  sendMagicLink: 'Wyślij mi link',
  magicLinkSent: 'E-mail wysłany! Otwórz link, aby potwierdzić.',
  accountSaved: 'Postępy zapisane',
  verifying: 'Weryfikacja…',
  verified: 'Konto potwierdzone! Twoje postępy są zapisane.',
  verifyFailed: 'Link nieprawidłowy lub wygasł. Poproś o nowy w swoim profilu.',

  privacyPolicy: 'Prywatność',
  deleteAccount: 'Usuń moje konto',
  deleteAccountHint: 'Usuwa profil, historię i grupy.',
  deleteAccountWarning: 'Twój pseudonim, rozgrywki, statystyki i grupy zostaną usunięte. Tej operacji nie można cofnąć.',
  deleteAccountAction: 'Tak, usuń wszystko',
  deleteAccountDone: 'Konto usunięte.',
  cancel: 'Anuluj',
  botTag: 'bot',
  emotes: 'Reakcje',
  close: 'Zamknij',
  leaveGame: 'Opuść rozgrywkę',
  leaveGameWarning:
    'Rozgrywka toczy się dalej bez ciebie, a twoje punkty z tej partii przepadają.',
  leaveGameAction: 'Tak, opuść',
  takePhoto: 'Zrób zdjęcie',
  removePhoto: 'Usuń zdjęcie',
  photoError: 'Zdjęcie zbyt duże lub nieczytelne.',
  reportPlayer: 'Zgłoś',
  reportDone: 'Zdjęcie ukryte i zgłoszone.',

  // Statystyki i historia
  stats: 'Statystyki',
  gamesPlayed: 'partie',
  gamesWon: 'wygrane',
  bestRound: 'najlepsza runda',
  noHistory: 'Nie masz jeszcze zakończonych partii.',
  historyTitle: 'Moje ostatnie partie',
  wonBadge: 'Wygrana',
  lostBadge: 'Przegrana',
  playersCount: (n: number) => plural(n, '1 gracz', `${n} gracze`, `${n} graczy`),

  // Grupy znajomych
  groups: 'Moje grupy',
  groupsTitle: 'Moje grupy',
  groupsSubtitle: 'Wspólny ranking dla tych, którzy zawsze grają razem',
  noGroups: 'Nie należysz jeszcze do żadnej grupy.',
  createGroup: 'Utwórz grupę',
  createGroupCta: 'Utwórz grupę',
  groupNamePlaceholder: 'Wtorkowa ekipa',
  groupNameLabel: 'Nazwa grupy',
  groupNameTooShort: 'Nazwa musi mieć od 2 do 30 znaków.',
  joinGroup: 'Dołącz do grupy',
  joinGroupCta: 'Dołącz',
  groupCodeLabel: 'Kod grupy',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 liter, bez I, L i O',
  groupCode: 'Kod grupy',
  groupShareHint: 'Udostępnij ten kod, żeby znajomi dołączyli do grupy',
  copyGroupCode: 'Kopiuj kod',
  groupCodeCopied: 'Kod skopiowany!',
  groupMembers: (n: number) =>
    plural(n, '1 członek', `${n} członkowie`, `${n} członków`),
  groupGames: (n: number) =>
    n === 0 ? 'brak partii' : plural(n, '1 partia', `${n} partie`, `${n} partii`),
  groupRanking: 'Ranking ogólny',
  groupRecentGames: 'Ostatnie partie grupy',
  groupNoGames: 'Grupa nie rozegrała jeszcze żadnej partii.',
  groupNoGamesHint: 'Zagraj z tą grupą — wyniki pojawią się tutaj.',
  groupPlay: 'Zagraj z tą grupą',
  groupOwner: 'Założyciel',
  groupLeave: 'Opuść grupę',
  groupLeaveConfirm: 'Opuścić tę grupę? Twoje rozegrane partie zostają w rankingu.',
  groupDelete: 'Usuń grupę',
  groupDeleteConfirm: 'Usunąć tę grupę i cały jej ranking? Tego nie da się cofnąć.',
  groupOwnerCannotLeave: 'To twoja grupa — możesz ją tylko usunąć.',
  groupNotFound: 'Nie znaleziono grupy.',
  groupJoined: (name: string) => `Jesteś już w grupie „${name}”!`,
  groupCreated: (name: string) => `Grupa „${name}” utworzona!`,
  groupAttached: (name: string) => `Partia przypisana do „${name}”`,
  groupTotalPoints: 'punkty',
  groupRankHeader: '#',
  groupPlayerHeader: 'Gracz',
  groupPointsHeader: 'Pkt',
  groupPlayedHeader: 'R',
  groupWonHeader: 'W',

  // Zasady gry
  rules: 'Zasady gry',
  rulesTitle: 'Jak grać',
  rulesSubtitle: 'Rikiki w 2 minuty',
  rulesGoalTitle: 'O co chodzi',
  rulesGoalText:
    'Przed każdą rundą deklarujesz, ile lew zamierzasz wziąć. Cała sztuka to trafić dokładnie: ani mniej, ani więcej. Wzięcie wielu lew nic nie daje, jeśli deklaracja była niska.',
  rulesDealTitle: 'Rozdanie',
  rulesDealText:
    'Partia składa się z kilku rund. W pierwszej każdy dostaje tylko jedną kartę, potem dwie, potem trzy… a następnie liczba kart znów maleje. W każdej rundzie wszyscy mają tyle samo kart.',
  rulesTrumpText: 'Jedna karta zostaje odkryta: jej kolor jest atutem rundy.',
  rulesBidTitle: 'Deklaracja',
  rulesBidText:
    'Po kolei deklarujesz, ile lew chcesz wziąć — od 0 do liczby kart w ręce. Decydujesz, widząc swoje karty i atut.',
  rulesHookTitle: 'Reguła haczyka',
  rulesHookText:
    'Ostatni deklarujący (rozdający) nie może wybrać liczby, przy której suma deklaracji zgadzałaby się dokładnie z liczbą lew w rundzie. Efekt: ktoś na pewno się rozczaruje. Zakazana liczba jest przekreślana automatycznie.',
  rulesPlayTitle: 'Rozgrywka',
  rulesPlayText:
    'Wychodzi gracz po lewej stronie rozdającego. Każdy dokłada jedną kartę, a najsilniejsza bierze lewę. Zwycięzca wychodzi do następnej lewy.',
  rulesFollowSuit: 'Musisz dołożyć do koloru, jeśli masz kartę w tym kolorze.',
  rulesNoSuit: 'Jeśli nie masz, grasz co chcesz: przebijasz atutem albo zrzucasz.',
  rulesWinTrick: 'Wygrywa najwyższy atut; bez atutu — najwyższa karta koloru wyjścia.',
  rulesScoreTitle: 'Punktacja',
  rulesScoreOk: 'Kontrakt wykonany',
  rulesScoreOkExample: 'Deklaracja 3, wzięte 3 → 16 punktów',
  rulesScoreKo: 'Kontrakt niewykonany',
  rulesScoreKoExample: 'Deklaracja 3, wzięta 1 → −4 punkty',
  rulesScoreZero:
    'Deklaracja 0 i ani jednej wziętej lewy daje 10 punktów: bardzo opłacalny kontrakt.',
  rulesScoreVariants: 'Gospodarz może wybrać w poczekalni inną punktację:',
  rulesEndTitle: 'Koniec partii',
  rulesEndText:
    'Po rozegraniu wszystkich rund wygrywa gracz z największą liczbą punktów. Tabelę wyników możesz sprawdzić w każdej chwili podczas partii.',
  rulesTip:
    'Wskazówka: w krótkich rundach as albo wysoki atut zwykle wystarczy na lewę. W długich uważaj na długie kolory.',
  rulesGotIt: 'Rozumiem',

  // Powiadomienia „twoja kolej”
  notificationsTitle: 'Powiadom mnie, gdy przyjdzie moja kolej',
  notificationsHint:
    'Schowaj telefon: wyślemy powiadomienie, gdy tylko stolik będzie na ciebie czekać. Idealne do partii rozłożonych na cały dzień.',
  notificationsEnable: 'Włącz powiadomienia',
  notificationsOn: 'Powiadomienia włączone',
  notificationsOff: 'Powiadomienia wyłączone',
  notificationsChecking: 'Sprawdzanie…',
  notificationsUnsupported: 'Twoja przeglądarka nie obsługuje powiadomień.',
  notificationsNeedsInstall:
    'Na iPhonie i iPadzie najpierw dodaj Rikiki do ekranu głównego (Udostępnij → „Do ekranu początkowego”), a potem wróć tutaj.',
  notificationsDenied:
    'Powiadomienia są zablokowane dla tej strony. Włącz je ponownie w ustawieniach przeglądarki.',
  notificationsNoServiceWorker:
    'Powiadomienia są tu niedostępne (zainstaluj aplikację lub odśwież stronę).',
  notificationsServerOff: 'Powiadomienia nie są skonfigurowane na serwerze.',
  notificationsError: 'Nie udało się zmienić ustawień powiadomień.',

  updateAvailable: 'Nowa wersja',
  updateReload: 'Zaktualizuj',
  version: (v: string) => `wersja ${v}`,

  // Dostępność
  accessibility: 'Dostępność',
  colorblindMode: 'Osobne odcienie',
  colorblindHint:
    'Inny odcień dla każdego koloru, by odróżniać ♥ ♦ ♠ ♣ bez polegania na czerwieni',
  // Mianownik dla ♠♦, dopełniacz mnogi dla ♥♣ : « as pik », « król kier »
  suitNames: { S: 'pik', H: 'kier', D: 'karo', C: 'trefl' } as Record<string, string>,
  rankNames: { 11: 'walet', 12: 'dama', 13: 'król', 14: 'as' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} ${suit}`,
  handOf: (n: number) =>
    `Twoja ręka: ${plural(n, '1 karta', `${n} karty`, `${n} kart`)}`,

  language: 'Język',
  languageHint: 'Wybierz język aplikacji',

  loading: 'Ładowanie…',
  errorTitle: 'Ups',
  copyright: '© 2026 Clixite SRL',
};

export default pl;
