import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNav } from '../nav';
import { useT } from '../i18n';
import { vibrate } from '../haptics';
import { leaveRoom } from '../socket';

/**
 * Sortie d'une partie en cours.
 *
 * Il n'existait aucun moyen de quitter une fois la partie lancée : il fallait
 * fermer l'application, ce qui laissait le joueur « déconnecté » aux yeux des
 * autres et bloquait la table jusqu'à l'expiration du délai de grâce.
 *
 * Confirmation obligatoire — c'est un geste irréversible qui affecte les
 * autres joueurs — mais une seule étape, sans friction inutile.
 */
export default function LeaveGameButton() {
  const t = useT();
  const navigate = useNav();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

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
