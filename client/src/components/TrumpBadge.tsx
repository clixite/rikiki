import { motion } from 'motion/react';
import type { Card } from '@rikiki/shared';
import { rankLabel, suitInkClass, suitSymbol } from './CardFace';
import { useT } from '../i18n';

interface Props {
  trumpCard: Card | null;
}

/**
 * L'atout.
 *
 * Première version : une petite carte au centre du tapis. Les joueurs ne la
 * voyaient pas — une carte parmi d'autres cartes ne se distingue pas, et sa
 * valeur n'a de toute façon aucune importance : seule l'ENSEIGNE compte.
 *
 * Les jeux de plis mobiles les plus joués (belote, coinche, spades, callbreak)
 * font tous la même chose : un grand symbole de couleur, dans un cartouche
 * fixe, visible en permanence. On reprend ce parti — le symbole occupe toute
 * la place, le rang n'apparaît qu'en petit, pour ceux que ça intéresse.
 */
export default function TrumpBadge({ trumpCard }: Props) {
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="flex w-[4.75rem] flex-col items-center gap-0.5 rounded-2xl bg-felt-950/55 px-1.5 py-2 ring-1 ring-brass-400/30"
      style={{ boxShadow: '0 2px 14px -6px rgb(0 0 0 / 0.6)' }}
      data-testid="trump-badge"
      data-trump={trumpCard ? trumpCard.suit : 'none'}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brass-300">
        {t.trump}
      </span>

      {trumpCard ? (
        <>
          {/* Pastille claire : une enseigne noire serait illisible sur le
              feutre sombre, et le contraste doit tenir en plein soleil. */}
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-paper-50">
            <span className={`text-4xl leading-none ${suitInkClass(trumpCard.suit)}`} aria-hidden="true">
              {suitSymbol(trumpCard.suit)}
            </span>
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-paper-50/45">
            {rankLabel(trumpCard.rank)}
          </span>
          <span className="sr-only">
            {t.trump} : {suitSymbol(trumpCard.suit)} {rankLabel(trumpCard.rank)}
          </span>
        </>
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/8 px-1 text-center text-[11px] font-semibold leading-tight text-paper-50/70">
          {t.noTrump}
        </span>
      )}
    </motion.div>
  );
}
