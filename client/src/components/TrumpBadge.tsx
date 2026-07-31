import { m as motion } from 'motion/react';
import type { Card } from '@rikiki/shared';
import { rankLabel, suitInkClass, suitSymbol } from './CardFace';
import { useT } from '../i18n';

interface Props {
  trumpCard: Card | null;
}

/**
 * L'atout.
 *
 * Première version : une petite carte au centre du tapis — les joueurs ne la
 * voyaient pas, une carte parmi d'autres cartes ne se distingue pas.
 * Deuxième version : un grand cartouche sur le bord gauche du feutre — lisible,
 * mais posé en plein dans la couronne des sièges : à six joueurs et plus, il
 * recouvrait purement et simplement deux adversaires.
 *
 * L'atout n'est pas un objet de la table, c'est une donnée de la manche, au
 * même titre que « manche 6/11 ». Il rejoint donc l'en-tête, à côté d'elle :
 * toujours au même endroit, toujours visible, et par construction incapable de
 * masquer quoi que ce soit. Le symbole occupe toute la pastille — seule
 * l'ENSEIGNE compte — et le rang n'apparaît qu'en petit, pour la mémoire.
 */
export default function TrumpBadge({ trumpCard }: Props) {
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="flex h-11 shrink-0 items-center rounded-2xl bg-felt-950/60 p-1 ring-1 ring-brass-400/35"
      style={{ boxShadow: '0 2px 12px -6px rgb(0 0 0 / 0.6)' }}
      data-testid="trump-badge"
      data-trump={trumpCard ? trumpCard.suit : 'none'}
    >
      {trumpCard ? (
        <>
          {/* Pastille claire : une enseigne noire serait illisible sur le
              feutre sombre, et le contraste doit tenir en plein soleil.

              Le mot « atout » a disparu, et le rang s'est réfugié dans un coin
              de la pastille : à sept ou huit joueurs, cette colonne de texte
              volait la largeur du numéro de manche, qui se retrouvait tronqué
              en « MANCHE … ». On ne savait plus où on en était. L'enseigne
              colorée dit déjà « atout » sans un mot ; le libellé complet reste
              lu par les lecteurs d'écran. */}
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-paper-50"
            data-testid="trump-suit"
          >
            <span className={`text-[26px] leading-none ${suitInkClass(trumpCard.suit)}`} aria-hidden="true">
              {suitSymbol(trumpCard.suit)}
            </span>
            <span
              className="absolute -right-0.5 -top-1 rounded bg-felt-950 px-0.5 text-[10px] font-bold leading-tight tabular-nums text-brass-300"
              aria-hidden="true"
            >
              {rankLabel(trumpCard.rank)}
            </span>
          </span>
          <span className="sr-only">
            {t.trump} : {suitSymbol(trumpCard.suit)} {rankLabel(trumpCard.rank)}
          </span>
        </>
      ) : (
        <span className="flex h-9 items-center rounded-lg bg-white/8 px-1.5 text-center text-[10px] font-semibold leading-tight text-paper-50/70">
          {t.noTrump}
        </span>
      )}
    </motion.div>
  );
}
