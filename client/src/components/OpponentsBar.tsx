import type { GameView } from '@rikiki/shared';

interface Props {
  view: GameView;
}

/** Adversaires (et soi) en arc au-dessus de la table, dans l'ordre des sièges à partir de soi. */
export default function OpponentsBar({ view }: Props) {
  const me = view.players.find((p) => p.id === view.you);
  const round = view.round;
  const ordered = [...view.players].sort(
    (a, b) => ((a.seat - (me?.seat ?? 0) + view.players.length) % view.players.length) -
      ((b.seat - (me?.seat ?? 0) + view.players.length) % view.players.length),
  );
  const others = ordered.filter((p) => p.id !== view.you);

  return (
    <div className="flex flex-wrap justify-center gap-2 px-2">
      {others.map((p) => {
        const isCurrent = round !== null && view.phase !== 'round-scoring' && round.currentSeat === p.seat;
        const bid = round?.bids[p.id];
        const tricks = round?.tricksWon[p.id] ?? 0;
        const isDealer = round?.dealerSeat === p.seat;
        return (
          <div
            key={p.id}
            className={`flex min-w-16 flex-col items-center rounded-xl bg-black/25 px-2 py-1.5 ${
              isCurrent ? 'turn-halo' : ''
            } ${p.connected ? '' : 'opacity-50'}`}
          >
            <span className="text-2xl leading-none">{p.avatar}</span>
            <span className="mt-0.5 max-w-18 truncate text-[11px] font-medium">
              {p.pseudo}
              {isDealer ? ' 🃏' : ''}
            </span>
            <span className="text-[11px] text-gold-300">
              {bid === null || bid === undefined ? '—' : `${tricks}/${bid}`}
            </span>
            {!p.connected && <span className="text-[9px] text-red-300">hors ligne</span>}
          </div>
        );
      })}
    </div>
  );
}
