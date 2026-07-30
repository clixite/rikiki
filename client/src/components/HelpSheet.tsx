import { m as motion } from 'motion/react';
import { useT } from '../i18n';
import RulesDemo from './RulesDemo';

interface Props {
  onClose: () => void;
}

/**
 * L'aide en pleine partie.
 *
 * Le seul chemin vers les règles passait par « quitter la partie » — qui coûte
 * ses points. Résultat : le débutant perdu pendant les annonces (« pourquoi je
 * ne peux pas annoncer 2 ? ») restait perdu, ou partait. Cette feuille pose la
 * démonstration animée et l'essentiel des règles PAR-DESSUS la table : on
 * s'instruit, on referme, la partie n'a pas bougé.
 *
 * Une feuille et non un écran : la partie continue derrière, et l'état de la
 * table (pli en cours, main) reste monté — revenir est instantané.
 */
export default function HelpSheet({ onClose }: Props) {
  const t = useT();

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.rules}
      data-testid="help-sheet"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl bg-felt-800 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-1 ring-white/10 sm:rounded-3xl"
        style={{ boxShadow: 'var(--shadow-panel)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        <div className="rk-scroll min-h-0 flex-1 space-y-3 overflow-y-auto">
          <RulesDemo />

          {/* L'essentiel en quatre lignes, pour qui cherche UNE réponse
              précise plutôt qu'une leçon : c'est le cas le plus fréquent en
              pleine partie. */}
          <div className="rounded-2xl bg-felt-900/45 p-4 ring-1 ring-white/6">
            <ul className="ml-4 list-disc space-y-1.5 text-sm leading-snug text-paper-50/75">
              <li>{t.rulesFollowSuit}</li>
              <li>{t.rulesNoSuit}</li>
              <li>{t.rulesWinTrick}</li>
              <li>{t.rulesHookText}</li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          data-testid="help-close"
          className="mt-3 min-h-11 w-full shrink-0 rounded-xl bg-white/8 py-3 text-sm font-medium transition active:scale-[0.98]"
        >
          {t.close}
        </button>
      </motion.div>
    </div>
  );
}
