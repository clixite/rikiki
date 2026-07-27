import { motion } from 'motion/react';
import type { Card } from '@rikiki/shared';
import CardFace from './CardFace';
import { fr } from '../i18n/fr';

interface Props {
  trumpCard: Card | null;
  /** Réduit l'encombrement quand des cartes occupent déjà le tapis. */
  compact: boolean;
}

/**
 * L'atout, posé au centre de la table.
 *
 * C'est l'information la plus consultée d'une manche : elle mérite le centre
 * du tapis, pas un coin de l'en-tête. Quand le pli se remplit, la carte
 * s'efface au second plan sans jamais disparaître.
 */
export default function TrumpBadge({ trumpCard, compact }: Props) {
  return (
    <motion.div
      layout
      animate={{ scale: compact ? 0.72 : 1, opacity: compact ? 0.55 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col items-center gap-1"
      data-testid="trump-badge"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brass-300/80">
        {fr.trump}
      </span>
      {trumpCard ? (
        <div className="relative">
          <CardFace card={trumpCard} size="sm" trump />
          {/* Halo : attire l'œil sans clignoter */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 -z-10 rounded-xl"
            style={{ background: 'radial-gradient(circle, rgb(217 178 92 / 0.22) 0%, transparent 70%)' }}
          />
        </div>
      ) : (
        <span className="rounded-lg bg-black/25 px-2 py-1 text-xs text-paper-50/70">{fr.noTrump}</span>
      )}
    </motion.div>
  );
}
