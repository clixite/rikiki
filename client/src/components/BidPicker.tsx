import { useState } from 'react';
import { motion } from 'motion/react';
import { useT } from '../i18n';


interface Props {
  cardsCount: number;
  legalBids: number[];
  /** Somme des annonces déjà faites (pour expliquer la règle du crochet). */
  bidsSoFar: number;
  onBid: (bid: number) => void;
}

/**
 * Barre d'annonce compacte, volontairement NON modale : la main du joueur
 * reste visible en dessous — on ne peut pas choisir un contrat sans voir
 * ses cartes.
 */
export default function BidPicker({ cardsCount, legalBids, bidsSoFar, onBid }: Props) {
  const t = useT();
  const [pending, setPending] = useState<number | null>(null);
  const all = Array.from({ length: cardsCount + 1 }, (_, i) => i);
  const forbidden = all.find((b) => !legalBids.includes(b));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="mx-3 rounded-2xl bg-felt-900/75 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur-md"
      style={{ boxShadow: 'var(--shadow-panel)' }}
      data-testid="bid-picker"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-paper-50">{t.yourBid}</p>
        <p className="text-[11px] tabular-nums text-paper-50/55">
          {t.bidsTotal(bidsSoFar, cardsCount)}
        </p>
      </div>

      {/* Les annonces s'enroulent sur plusieurs lignes plutôt que de défiler :
          à dix cartes, la moitié des choix se cachait hors écran sans que rien
          ne l'indique — on annonçait petit faute de voir les grands nombres. */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {all.map((b) => {
          const legal = legalBids.includes(b);
          const isPending = pending === b;
          return (
            <button
              key={b}
              type="button"
              data-testid={`bid-${b}`}
              disabled={!legal || pending !== null}
              title={legal ? undefined : t.hookForbidden(cardsCount)}
              onClick={() => {
                setPending(b);
                onBid(b);
              }}
              className={`relative h-11 min-w-11 shrink-0 rounded-xl px-1 text-lg font-bold tabular-nums transition-all duration-150 ${
                legal
                  ? 'bg-linear-to-b from-brass-300 to-brass-500 text-felt-950 ring-1 ring-brass-200/50 active:scale-90'
                  : 'bg-white/6 text-paper-50/25 ring-1 ring-white/8'
              } ${isPending ? 'scale-90 opacity-60' : ''}`}
              style={legal ? { boxShadow: '0 2px 8px -2px rgb(0 0 0 / 0.5)' } : undefined}
            >
              {b}
              {!legal && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[1.5px] w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-paper-50/35"
                />
              )}
            </button>
          );
        })}
      </div>

      {forbidden !== undefined && (
        <p className="mt-1.5 text-[11px] leading-snug text-brass-200/70">
          ⛓️ {t.hookExplain(forbidden, cardsCount)}
        </p>
      )}
    </motion.div>
  );
}
