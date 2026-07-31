import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m as motion } from 'motion/react';
import { useT } from '../i18n';

import { useGame } from '../store/game';

/** Intervalle de vérification d'une nouvelle version (application ouverte). */
const CHECK_EVERY_MS = 5 * 60_000;

/**
 * Invite de mise à jour.
 *
 * Le service worker est en mise à jour automatique : la nouvelle version
 * s'installe et prend la main toute seule. Mais l'onglet déjà ouvert continue
 * d'exécuter l'ANCIEN code jusqu'à un rechargement — c'est ce décalage qui
 * fait qu'une application installée peut sembler figée sur une vieille
 * version pendant des jours.
 *
 * On détecte donc le changement de contrôleur (le moment où la nouvelle
 * version prend la main) et on propose de recharger. Jamais d'autorité :
 * recharger en pleine partie couperait le joueur.
 */
export default function UpdatePrompt() {
  const t = useT();
  const [needRefresh, setNeedRefresh] = useState(false);
  const inGame = useGame((s) => s.view !== null && s.view.phase !== 'lobby');
  /**
   * Y a-t-il déjà eu une version aux commandes ? Lors de la toute première
   * visite, le service worker prend le contrôle sans qu'il s'agisse d'une
   * mise à jour : on enregistre ce premier passage, et seuls les suivants
   * déclenchent l'invite.
   */
  const hadController = useRef(
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      ? Boolean(navigator.serviceWorker.controller)
      : false,
  );

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const onControllerChange = () => {
      if (hadController.current) setNeedRefresh(true);
      else hadController.current = true;
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const checkForUpdate = () => {
      navigator.serviceWorker.getRegistration().then((r) => r?.update().catch(() => undefined));
    };
    // Au retour au premier plan, puis régulièrement tant que l'app est ouverte.
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(checkForUpdate, CHECK_EVERY_MS);
    checkForUpdate();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  const visible = needRefresh && !inGame;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed inset-x-0 top-0 z-[60] mx-auto w-fit max-w-[92%] px-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
          data-testid="update-prompt"
        >
          <div className="flex items-center gap-3 rounded-full bg-brass-400 py-1.5 pl-4 pr-1.5 text-felt-950 shadow-lg">
            <span className="text-sm font-semibold">{t.updateAvailable}</span>
            <button
              type="button"
              data-testid="update-reload"
              onClick={() => window.location.reload()}
              className="h-9 rounded-full bg-felt-900 px-4 text-sm font-bold text-brass-300 transition active:scale-95"
            >
              {t.updateReload}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
