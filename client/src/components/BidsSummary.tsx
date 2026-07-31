import { m as motion } from 'motion/react';
import type { GameView } from '@rikiki/shared';
import { useT } from '../i18n';


interface Props {
  view: GameView;
}

/**
 * Récapitulatif des annonces de la manche.
 *
 * Savoir si la table a sur-annoncé ou sous-annoncé change complètement la
 * façon de jouer : si le total dépasse le nombre de plis, quelqu'un tombera
 * forcément — mieux vaut le savoir avant de s'engager. L'information est donc
 * affichée en permanence, et pas seulement au moment d'annoncer.
 */
export default function BidsSummary({ view }: Props) {
  const t = useT();
  const round = view.round;
  if (!round) return null;

  const bids = Object.values(round.bids);
  const announced = bids.reduce<number>((sum, b) => sum + (b ?? 0), 0);
  const allBid = bids.every((b) => b !== null);
  const cards = round.cardsCount;
  const diff = announced - cards;

  // Tant que tout le monde n'a pas parlé, le total n'a pas de sens définitif.
  const label = !allBid
    ? t.bidsPending(announced, cards)
    : diff === 0
      ? t.bidsBalanced(cards)
      : diff > 0
        ? t.bidsOver(diff)
        : t.bidsUnder(-diff);

  const tone = !allBid
    ? 'text-paper-50/55'
    : diff > 0
      ? 'text-danger'
      : diff < 0
        ? 'text-brass-300'
        : 'text-success';

  return (
    <motion.div
      layout
      className="flex items-center justify-center gap-2 px-3"
      data-testid="bids-summary"
      data-announced={announced}
      data-cards={cards}
    >
      <span className="rounded-full bg-felt-900/55 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-paper-50/80 ring-1 ring-white/8">
        {t.bidsAnnounced} {announced}/{cards}
      </span>
      <span className={`text-[11px] font-medium ${tone}`}>{label}</span>
    </motion.div>
  );
}
