import { useEffect, useState } from 'react';
import { m as motion } from 'motion/react';
import { Navigate } from 'react-router-dom';
import { useNav } from '../nav';
import Icon from '../components/Icon';
import type { ActiveGame, UserStats } from '@rikiki/shared';
import { isColorblindMode } from '../a11y';
import { fetchActiveGames, fetchMe } from '../api';
import SoundToggle from '../components/SoundToggle';
import { unlockAudio } from '../audio';
import { useT } from '../i18n';
import PlayerAvatar from '../components/PlayerAvatar';
import { createRoom, joinRoom } from '../socket';
import { useGame } from '../store/game';
import { useSession } from '../store/session';

/** Injectée à la compilation : permet d'identifier la version installée. */
const APP_VERSION = __APP_VERSION__;

/** Vu une fois, plus jamais : la suggestion ne doit pas devenir un tic. */
const COLORBLIND_HINT_KEY = 'rikiki-colorblind-hint-seen';

export default function Home() {
  const t = useT();
  const { user, roomCode } = useSession();
  const socketConnected = useGame((s) => s.socketConnected);
  const navigate = useNav();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [busy, setBusy] = useState(false);
  // Suggestion du mode daltonien : discrète, et montrée une seule fois — pas
  // la peine d'insister auprès de qui l'a déjà vue, ou de qui l'a déjà activé.
  const [showColorblindHint, setShowColorblindHint] = useState(() => {
    if (isColorblindMode()) return false;
    try {
      return localStorage.getItem(COLORBLIND_HINT_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const dismissColorblindHint = () => {
    setShowColorblindHint(false);
    try {
      localStorage.setItem(COLORBLIND_HINT_KEY, '1');
    } catch {
      // sans stockage, la suggestion reviendra à la prochaine visite : sans gravité
    }
  };
  // `null` = la liste n'a pas encore été obtenue du serveur (hors ligne, ou
  // premier rendu) ; on retombe alors sur la dernière partie mémorisée ici.
  const [games, setGames] = useState<ActiveGame[] | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMe()
      .then(({ user: fresh, stats: s }) => {
        useSession.getState().setUser(fresh);
        setStats(s);
      })
      .catch(() => undefined);
  }, [user?.id]);

  /**
   * Parties en cours, relues à chaque retour sur l'écran.
   *
   * En asynchrone, ce qui a changé pendant qu'on avait le téléphone dans la
   * poche est précisément l'information qu'on vient chercher : la liste doit
   * être fraîche au moment où on la regarde, pas au moment où l'onglet a été
   * ouvert la première fois.
   */
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const refresh = () => {
      fetchActiveGames()
        .then((list) => {
          if (!alive) return;
          setGames(list);
          // La partie mémorisée localement n'existe plus : on nettoie, sinon
          // le bouton « reprendre » mène à une table fermée.
          const known = useSession.getState().roomCode;
          if (known && !list.some((g) => g.code === known)) useSession.getState().setRoomCode(null);
        })
        .catch(() => undefined);
    };
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, socketConnected]);

  if (!user) return <Navigate to="/profile" replace />;

  const onCreate = async () => {
    unlockAudio();
    setBusy(true);
    const res = await createRoom();
    setBusy(false);
    if (res.ok) navigate('/game');
    else useGame.getState().showToast(res.error.message);
  };

  const onResume = async (code: string) => {
    unlockAudio();
    const res = await joinRoom(code);
    if (res.ok) navigate('/game');
    else useSession.getState().setRoomCode(null);
  };

  const disabled = !socketConnected || busy;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
      {/* Barre du haut : profil + son */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="open-profile"
          onClick={() => navigate('/profile')}
          className="flex h-11 min-w-0 items-center gap-2 rounded-full bg-felt-900/45 pl-2.5 pr-3.5 ring-1 ring-white/8 transition active:scale-95"
        >
          <PlayerAvatar avatar={user.avatar} photo={user.photo} size={26} />
          <span className="max-w-32 truncate text-sm font-medium">{user.pseudo}</span>
          {!user.isGuest && (
            <span className="text-xs text-success" title={t.accountSaved} aria-label={t.accountSaved}>
              ✓
            </span>
          )}
        </button>
        <div className="flex-1" />
        <button
          type="button"
          data-testid="open-groups"
          onClick={() => navigate('/groups')}
          aria-label={t.groups}
          title={t.groups}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-felt-900/45 text-lg ring-1 ring-white/8 transition active:scale-90"
        >
          <Icon name="users" />
        </button>
        <button
          type="button"
          data-testid="open-rules"
          onClick={() => navigate('/rules')}
          aria-label={t.rules}
          title={t.rules}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-felt-900/45 text-lg ring-1 ring-white/8 transition active:scale-90"
        >
          <Icon name="rules" />
        </button>
        <SoundToggle />
      </div>

      {/* Identité de marque */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="text-center"
        >
          {/* Deux cartes croisées, dessinées en CSS */}
          <div className="relative mx-auto mb-5 h-24 w-24" aria-hidden="true">
            <div
              className="absolute left-2 top-1 h-20 w-14 -rotate-12 rounded-lg bg-linear-to-b from-paper-50 to-paper-100 ring-1 ring-black/15"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-2xl text-suit-red">♥</span>
            </div>
            <div
              className="absolute left-8 top-3 h-20 w-14 rotate-[10deg] rounded-lg bg-linear-to-b from-paper-50 to-paper-100 ring-1 ring-black/15"
              style={{ boxShadow: 'var(--shadow-card-lifted)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-2xl text-suit-black">♠</span>
            </div>
          </div>

          <h1 className="font-display text-5xl font-bold tracking-tight text-brass-300">{t.appName}</h1>
          <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-snug text-paper-50/55">{t.tagline}</p>

          {/* Suggestion du mode daltonien : tout le jeu se lit par la couleur
              des cartes (♥ ♦ rouges, ♠ ♣ noires), or un joueur sur douze
              environ perçoit mal le rouge. Une ligne discrète, montrée une
              seule fois, vaut mieux qu'un réglage enterré dans le profil que
              personne ne va chercher — et beaucoup mieux qu'une modale. */}
          {showColorblindHint && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              // Deux vraies cibles de 44 px : le bandeau reste visuellement
              // discret (fond ténu, petit texte), mais un réglage
              // d'accessibilité qu'on ne peut pas viser au pouce raterait
              // précisément les gens qu'il vise.
              className="mx-auto mt-3 flex max-w-[18rem] items-center gap-1 rounded-2xl bg-felt-900/40 pl-3 pr-1 ring-1 ring-white/8"
              data-testid="colorblind-hint"
            >
              <button
                type="button"
                data-testid="colorblind-hint-cta"
                onClick={() => {
                  dismissColorblindHint();
                  navigate('/profile');
                }}
                className="flex min-h-11 flex-1 items-center py-1.5 text-left text-[11px] leading-snug text-paper-50/70"
              >
                <span aria-hidden="true">🎨</span>&nbsp;{t.colorblindHintBanner}
              </button>
              <button
                type="button"
                data-testid="colorblind-hint-dismiss"
                onClick={dismissColorblindHint}
                aria-label={t.close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-paper-50/55 transition active:scale-90"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </motion.div>
          )}

          {stats && stats.gamesPlayed > 0 && (
            <motion.button
              type="button"
              data-testid="open-history"
              onClick={() => navigate('/history')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-4 flex h-11 items-center gap-1.5 rounded-full bg-felt-900/40 px-4 text-xs tabular-nums text-paper-50/60 ring-1 ring-white/8 transition active:scale-95"
            >
              {stats.gamesPlayed} {t.gamesPlayed} · {stats.gamesWon} {t.gamesWon}
              <span className="text-paper-50/35">›</span>
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Actions principales */}
      <div className="space-y-2.5">
        {games === null && roomCode && (
          <button
            type="button"
            data-testid="resume-game"
            onClick={() => onResume(roomCode)}
            disabled={disabled}
            className="w-full rounded-2xl bg-white/8 py-3 text-sm font-semibold ring-1 ring-white/10 transition active:scale-[0.98] disabled:opacity-40"
          >
            {t.resumeGame} · {roomCode}
          </button>
        )}

        {games !== null && games.length > 0 && (
          <div data-testid="my-games">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-paper-50/55">{t.myGames}</p>
            {/* Au-delà de trois parties, la liste défile plutôt que de pousser
                les boutons principaux hors de l'écran. */}
            <ul className="rk-scroll max-h-44 space-y-1.5 overflow-y-auto">
              {games.map((g) => (
                <li key={g.code}>
                  <button
                    type="button"
                    data-testid={`game-${g.code}`}
                    data-my-turn={g.myTurn ? 'true' : 'false'}
                    onClick={() => onResume(g.code)}
                    disabled={disabled}
                    className={`flex w-full min-h-11 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left ring-1 transition active:scale-[0.98] disabled:opacity-40 ${
                      g.myTurn ? 'bg-brass-400/15 ring-brass-300/40' : 'bg-white/8 ring-white/10'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold tracking-widest text-brass-300">{g.code}</span>
                      <span className="block truncate text-[11px] text-paper-50/55">
                        {g.phase === 'lobby'
                          ? t.waitingToStart
                          : `${t.round} ${g.round}/${g.roundsTotal} · ${g.myScore} ${t.groupTotalPoints}`}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-[11px] font-semibold ${
                        g.myTurn ? 'text-brass-300' : 'text-paper-50/55'
                      }`}
                    >
                      {g.myTurn ? t.yourTurn : g.waitingFor ? t.waitingForPlayer(g.waitingFor) : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          data-testid="create-game"
          onClick={onCreate}
          disabled={disabled}
          className="w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-4 text-lg font-bold text-felt-950 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          style={{ boxShadow: 'var(--shadow-cta)' }}
        >
          {t.createGame}
        </button>
        <button
          type="button"
          data-testid="goto-join"
          onClick={() => {
            unlockAudio();
            navigate('/join');
          }}
          disabled={disabled}
          className="w-full rounded-2xl bg-white/8 py-3.5 text-base font-semibold ring-1 ring-white/10 transition active:scale-[0.98] disabled:opacity-40"
        >
          {t.joinGame}
        </button>

        {!socketConnected && (
          <p className="pt-1 text-center text-xs text-paper-50/55">{t.reconnecting}</p>
        )}
        <p className="pt-0.5 text-center text-[10px] text-paper-50/55">
          {t.copyright} · {t.version(APP_VERSION)}
        </p>
      </div>
    </div>
  );
}
