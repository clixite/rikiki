import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNav } from '../nav';
import { useT } from '../i18n';
import { vibrate } from '../haptics';
import { leaveRoom, setPaused } from '../socket';
import { useGame } from '../store/game';

/**
 * Sortie d'une partie en cours — et sa version douce, la pause.
 *
 * Il n'existait aucun moyen de quitter une fois la partie lancée : il fallait
 * fermer l'application, ce qui laissait le joueur « déconnecté » aux yeux des
 * autres et bloquait la table jusqu'à l'expiration du délai de grâce.
 *
 * Les deux gestes partagent la même feuille parce qu'ils répondent à la même
 * envie — « je dois m'absenter » — et que presque personne ne veut vraiment
 * partir. Voir la pause juste au-dessus de « quitter » évite les départs
 * définitifs pour cinq minutes de cuisine. Quitter reste confirmé : c'est
 * irréversible et cela coûte ses points.
 */
export default function LeaveGameButton() {
  const t = useT();
  const navigate = useNav();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const view = useGame((s) => s.view);
  const iAmPaused = view?.players.find((p) => p.id === view.you)?.paused === true;

  const pause = async () => {
    setBusy(true);
    vibrate('select');
    try {
      await setPaused(!iAmPaused);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    vibrate('select');
    try {
      await leaveRoom();
    } finally {
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <button
        type="button"
        data-testid="leave-game"
        onClick={() => setConfirming(true)}
        aria-label={t.leaveGame}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-felt-900/55 text-lg ring-1 ring-white/10 transition active:scale-90"
      >
        <span aria-hidden="true">←</span>
      </button>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-[2px]"
            onClick={() => !busy && setConfirming(false)}
            data-testid="leave-confirm"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="w-full rounded-t-3xl bg-felt-800 p-5 pb-[max(2rem,env(safe-area-inset-bottom))] ring-1 ring-white/10"
              style={{ boxShadow: 'var(--shadow-panel)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

              {/* La pause d'abord : c'est ce que veulent neuf joueurs sur dix
                  qui touchent ce bouton, et elle ne coûte rien. */}
              <button
                type="button"
                data-testid="pause-game"
                onClick={pause}
                disabled={busy}
                className="min-h-12 w-full rounded-xl bg-brass-400 text-sm font-bold text-felt-950 transition active:scale-[0.98] disabled:opacity-40"
              >
                {iAmPaused ? t.resumePlay : t.pauseGame}
              </button>
              <p className="mx-auto mt-1.5 max-w-xs text-center text-[13px] leading-snug text-paper-50/55">
                {t.pauseHint}
              </p>

              <div className="my-4 h-px bg-white/10" />

              <h2 className="text-center text-lg font-bold">{t.leaveGame}</h2>
              <p className="mx-auto mt-1.5 max-w-xs text-center text-sm leading-snug text-paper-50/60">
                {t.leaveGameWarning}
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="min-h-12 flex-1 rounded-xl bg-white/8 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  data-testid="leave-game-confirm"
                  onClick={leave}
                  disabled={busy}
                  className="min-h-12 flex-1 rounded-xl bg-danger text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
                >
                  {t.leaveGameAction}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
