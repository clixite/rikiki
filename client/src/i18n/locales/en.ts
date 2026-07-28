import type { Messages } from '../types';

export const en: Messages = {
  appName: 'Rikiki',
  tagline: 'The trick-taking game with friends, everyone on their own phone',

  // Home
  createGame: 'Create a game',
  joinGame: 'Join a game',
  resumeGame: 'Resume game',
  myGames: 'My games',

  // Profile
  yourPseudo: 'Your nickname',
  pickAvatar: 'Pick your avatar',
  letsGo: "Let's go!",
  save: 'Save',
  editProfile: 'My profile',
  changeAvatar: 'Change avatar',

  // Join
  enterCode: 'Game code',
  join: 'Join',
  gameCode: 'Game code',
  copyLink: 'Copy link',
  copied: 'Link copied!',

  // Lobby
  invite: 'Invite friends',
  players: 'Players',
  host: 'Host',
  you: 'you',
  waitingForHost: 'Waiting for the host to start…',
  needPlayers: (missing: number) =>
    missing === 1 ? '1 more player to start' : `${missing} more players to start`,
  startGame: 'Start game',
  leave: 'Leave',
  kick: 'Remove',
  addBot: 'Add a bot',
  addBotHint: 'Fill the table with an automatic player',
  botsFull: 'The table is full',
  removeBot: 'Remove bot',

  // Game format (length)
  gameFormat: 'Game format',
  gameFormatHint: 'Pick the length before you start',
  formatNames: {
    blitz: 'Blitz',
    normal: 'Standard',
    climb: 'Climb',
  },
  formatDescriptions: {
    blitz: 'Up and back down, max 5 cards',
    normal: 'All the way up, then all the way down',
    climb: 'Climb only, no way back down',
  },
  formatRounds: (n: number) => (n === 1 ? '1 round' : `${n} rounds`),
  formatDuration: (minutes: number) => `≈ ${minutes} min`,
  formatLocked: 'Format set by the host',

  // Table
  round: 'Round',
  cards: (n: number) => (n === 1 ? '1 card' : `${n} cards`),
  trump: 'Trump',
  noTrump: 'No trump',
  dealer: 'Dealer',
  offline: 'offline',
  thinking: '…',
  yourBid: 'How many tricks?',
  bidsTotal: (sum: number, cards: number) => `Bid: ${sum} / ${cards} tricks`,
  hookForbidden: (n: number) => `Not allowed: the total would be exactly ${n}`,
  hookExplain: (forbidden: number, cards: number) =>
    `${forbidden} is off-limits: the bids can't add up to ${cards} (hook rule).`,
  bid: 'Bid',
  tricks: 'Tricks',

  // Round bidding recap
  bidsAnnounced: 'Bid',
  bidsPending: (announced: number, cards: number) =>
    `${announced} of ${cards} — bidding in progress`,
  bidsBalanced: (cards: number) => `Spot on: ${cards} tricks bid`,
  bidsOver: (n: number) =>
    n === 1 ? '1 trick too many: someone goes down' : `${n} tricks too many: someone goes down`,
  bidsUnder: (n: number) =>
    n === 1 ? '1 spare trick up for grabs' : `${n} spare tricks up for grabs`,
  noBidYet: 'No bid yet',
  tricksOfContract: (tricks: number, bid: number) => `${tricks}/${bid} tricks`,
  yourTurn: 'Your turn',
  turnOf: (p: string) => `${p}'s turn`,
  trickWonBy: (p: string) => `${p} wins the trick`,
  scoreboard: 'Scores',
  total: 'Total',

  // Recap
  roundRecap: 'End of round',
  contractKept: 'Contract made',
  contractMissed: 'Contract missed',
  contract: 'Contract',
  points: 'Points',
  nextRound: 'Next round',
  seeResults: 'See results',
  waitingNextRound: 'The host will start the next round…',

  // End of game
  gameOver: 'Game over',
  shareResult: 'Share result',
  shareTitle: 'Rikiki game finished 🃏',
  shareSaved: 'Image saved',
  playAgain: 'Play again',
  backHome: 'Home',

  // Sound
  soundOn: 'Sound on',
  soundOff: 'Mute',

  // Network
  reconnecting: 'Reconnecting…',
  playerDisconnected: (p: string) => `${p} lost connection`,
  playerReconnected: (p: string) => `${p} is back`,
  playerJoined: (p: string) => `${p} joined the game`,
  playerLeft: (p: string) => `${p} left the game`,
  roomClosed: 'The game was closed.',
  roomClosedKicked: 'You were removed from the game.',
  roomClosedExpired: 'The game expired.',

  // Invitations
  inviteMessage: (code: string, url: string) =>
    `Come play Rikiki with us! 🃏\nGame code: ${code}\nJoin here: ${url}`,
  inviteWhatsApp: 'WhatsApp',
  inviteSms: 'SMS',
  inviteShare: 'Share',

  // Account
  saveAccount: 'Save my progress',
  saveAccountHint: 'Get a link by email — no password to remember',
  emailPlaceholder: 'you@email.com',
  sendMagicLink: 'Send my link',
  magicLinkSent: 'Email sent! Open the link to confirm.',
  accountSaved: 'Progress saved',
  verifying: 'Checking…',
  verified: 'Account confirmed! Your progress is saved.',
  verifyFailed: 'Invalid or expired link. Request a new one from your profile.',

  privacyPolicy: 'Privacy',
  deleteAccount: 'Delete my account',
  deleteAccountHint: 'Erases your profile, history and groups.',
  deleteAccountWarning: 'Your nickname, games, statistics and groups will be erased. This cannot be undone.',
  deleteAccountAction: 'Yes, delete everything',
  deleteAccountDone: 'Account deleted.',
  cancel: 'Cancel',
  botTag: 'bot',
  emotes: 'Reactions',
  close: 'Close',
  leaveGame: 'Leave the game',
  leaveGameWarning:
    'The game goes on without you and your points for this game are lost.',
  leaveGameAction: 'Yes, leave',
  takePhoto: 'Take a photo',
  removePhoto: 'Remove photo',
  photoError: 'Photo too large or unreadable.',
  reportPlayer: 'Report',
  reportDone: 'Photo hidden and reported.',

  // Stats and history
  stats: 'Stats',
  gamesPlayed: 'games',
  gamesWon: 'wins',
  bestRound: 'best round',
  noHistory: 'No finished games yet.',
  historyTitle: 'My latest games',
  wonBadge: 'Won',
  lostBadge: 'Lost',
  playersCount: (n: number) => `${n} players`,

  // Friend groups
  groups: 'My groups',
  groupsTitle: 'My groups',
  groupsSubtitle: 'A running leaderboard for the people who always play together',
  noGroups: "You're not in any group yet.",
  createGroup: 'Create a group',
  createGroupCta: 'Create group',
  groupNamePlaceholder: 'Tuesday night crew',
  groupNameLabel: 'Group name',
  groupNameTooShort: 'The name must be 2 to 30 characters long.',
  joinGroup: 'Join a group',
  joinGroupCta: 'Join',
  groupCodeLabel: 'Group code',
  groupCodePlaceholder: 'ABCDEF',
  groupCodeHint: '6 letters, no I, L or O',
  groupCode: 'Group code',
  groupShareHint: 'Share this code so your friends can join the group',
  copyGroupCode: 'Copy code',
  groupCodeCopied: 'Code copied!',
  groupMembers: (n: number) => (n === 1 ? '1 member' : `${n} members`),
  groupGames: (n: number) => (n === 1 ? '1 game' : n === 0 ? 'no games' : `${n} games`),
  groupRanking: 'Overall ranking',
  groupRecentGames: 'Latest group games',
  groupNoGames: 'No group games played yet.',
  groupNoGamesHint: 'Start a game with this group: the results will show up here.',
  groupPlay: 'Play with this group',
  groupOwner: 'Creator',
  groupLeave: 'Leave group',
  groupLeaveConfirm: 'Leave this group? Your past games stay in the ranking.',
  groupDelete: 'Delete group',
  groupDeleteConfirm: 'Delete this group and its whole ranking? This is permanent.',
  groupOwnerCannotLeave: 'You created this group: you can only delete it.',
  groupNotFound: 'Group not found.',
  groupJoined: (name: string) => `You joined “${name}”!`,
  groupCreated: (name: string) => `Group “${name}” created!`,
  groupAttached: (name: string) => `Game linked to “${name}”`,
  groupTotalPoints: 'points',
  groupRankHeader: '#',
  groupPlayerHeader: 'Player',
  groupPointsHeader: 'Pts',
  groupPlayedHeader: 'P',
  groupWonHeader: 'W',

  // Rules
  rules: 'Game rules',
  rulesTitle: 'How to play',
  rulesSubtitle: 'Rikiki in 2 minutes',
  rulesGoalTitle: 'The idea',
  rulesGoalText:
    "Before each round, you announce how many tricks you think you'll win. The whole point is to be exactly right: no more, no less. Winning plenty of tricks is worth nothing if you bid low.",
  rulesDealTitle: 'The deal',
  rulesDealText:
    'A game runs over several rounds. The first one deals a single card to each player, then two, then three… before coming back down. In every round, everyone gets the same number of cards.',
  rulesTrumpText: 'One card is turned over: its suit is the trump for the round.',
  rulesBidTitle: 'The bid',
  rulesBidText:
    "One after another, you announce how many tricks you're going for — from 0 up to the number of cards in your hand. You see your hand and the trump before deciding.",
  rulesHookTitle: 'The hook rule',
  rulesHookText:
    "The last player to bid (the dealer) can't pick the number that would make the bids add up to exactly the number of tricks in the round. So someone is bound to be disappointed. The forbidden number is crossed out automatically.",
  rulesPlayTitle: 'Playing the tricks',
  rulesPlayText:
    'The player to the dealer’s left leads. Everyone plays one card, and the strongest one wins the trick. The winner leads the next trick.',
  rulesFollowSuit: 'You must follow the suit that was led if you hold it.',
  rulesNoSuit: 'Otherwise play whatever you like: trump it or throw a card away.',
  rulesWinTrick: 'The highest trump wins; with no trump, the highest card of the suit led.',
  rulesScoreTitle: 'Scoring',
  rulesScoreOk: 'Contract made',
  rulesScoreOkExample: 'Bid 3, won 3 → 16 points',
  rulesScoreKo: 'Contract missed',
  rulesScoreKoExample: 'Bid 3, won 1 → −4 points',
  rulesScoreZero: 'Bidding 0 and taking none is worth 10 points: a very profitable contract.',
  rulesEndTitle: 'End of the game',
  rulesEndText:
    'Once every round has been played, whoever has the most points wins. The scoreboard can be checked at any time during the game.',
  rulesTip:
    'Tip: in short rounds, an ace or a high trump is often enough to lock in a trick. In long ones, watch out for long suits.',
  rulesGotIt: 'Got it',

  // “It’s your turn” notifications
  notificationsTitle: 'Tell me when it’s my turn',
  notificationsHint:
    'Put your phone away: we’ll send you a notification as soon as the table is waiting for you. Perfect for games spread over the day.',
  notificationsEnable: 'Enable notifications',
  notificationsOn: 'Notifications on',
  notificationsOff: 'Notifications off',
  notificationsChecking: 'Checking…',
  notificationsUnsupported: 'Your browser doesn’t support notifications.',
  notificationsNeedsInstall:
    'On iPhone and iPad, first add Rikiki to your home screen (Share → “Add to Home Screen”), then come back here.',
  notificationsDenied:
    'Notifications are blocked for this site. Turn them back on in your browser settings.',
  notificationsNoServiceWorker: 'Notifications unavailable here (install the app or reload the page).',
  notificationsServerOff: 'Notifications are not set up on the server.',
  notificationsError: 'Could not change the notification setting.',

  updateAvailable: 'New version',
  updateReload: 'Update',
  version: (v: string) => `version ${v}`,

  // Accessibility
  accessibility: 'Accessibility',
  colorblindMode: 'Distinct colours',
  colorblindHint: 'One colour per suit, so ♥ ♦ ♠ ♣ stay apart without relying on red',
  suitNames: { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' } as Record<string, string>,
  rankNames: { 11: 'jack', 12: 'queen', 13: 'king', 14: 'ace' } as Record<number, string>,
  cardOf: (rank: string, suit: string) => `${rank} of ${suit}`,
  handOf: (n: number) => (n > 1 ? `Your hand: ${n} cards` : 'Your hand: 1 card'),

  language: 'Language',
  languageHint: 'Choose the app language',

  loading: 'Loading…',
  errorTitle: 'Oops',
  copyright: '© 2026 Clixite SRL',
};

export default en;
