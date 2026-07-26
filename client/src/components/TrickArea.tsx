import type { CompletedTrick, GameView, Trick } from '@rikiki/shared';
import CardFace from './CardFace';

interface Props {
  view: GameView;
  frozenTrick: CompletedTrick | null;
}

export default function TrickArea({ view, frozenTrick }: Props) {
  const round = view.round!;
  const trick: Trick = frozenTrick ?? round.currentTrick;
  const winnerId = frozenTrick?.winnerId;

  return (
    <div className="flex min-h-28 flex-wrap items-center justify-center gap-2 px-2">
      {trick.plays.length === 0 && !frozenTrick ? (
        <div className="h-17 w-12 rounded-lg border-2 border-dashed border-white/20" />
      ) : (
        trick.plays.map(({ playerId, card }) => {
          const player = view.players.find((p) => p.id === playerId);
          const isWinner = winnerId === playerId;
          return (
            <div
              key={playerId}
              className={`animate-card-in flex flex-col items-center gap-1 rounded-lg p-1 transition ${
                isWinner ? 'bg-gold-400/25 ring-2 ring-gold-400' : ''
              }`}
            >
              <CardFace card={card} size="md" />
              <span className="max-w-14 truncate text-[10px] text-white/80">
                {playerId === view.you ? '✦' : ''} {player?.pseudo}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
