import type { GameView } from '@rikiki/shared';
import { fr } from '../i18n/fr';
import { nextRound } from '../socket';

interface Props {
  view: GameView;
}

export default function RoundRecap({ view }: Props) {
  const round = view.round!;
  const isHost = view.hostId === view.you;
  const isLastRound = round.roundIndex === view.roundsSequence.length - 1;
  const sorted = [...view.players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-felt-800 p-5 shadow-2xl">
        <h2 className="mb-1 text-center text-xl font-bold">{fr.roundRecap}</h2>
        <p className="mb-4 text-center text-sm text-white/60">
          {fr.round} {round.roundIndex + 1}/{view.roundsSequence.length} · {fr.cards(round.cardsCount)}
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/60">
              <th className="pb-2 text-left font-normal">{fr.players}</th>
              <th className="pb-2 text-center font-normal">{fr.contract}</th>
              <th className="pb-2 text-center font-normal">{fr.tricks}</th>
              <th className="pb-2 text-right font-normal">{fr.points}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const bid = round.bids[p.id] ?? 0;
              const tricks = round.tricksWon[p.id] ?? 0;
              const pts = round.roundScores?.[p.id] ?? 0;
              return (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="max-w-24 truncate py-2">
                    {p.avatar} {p.pseudo}
                  </td>
                  <td className="py-2 text-center">{bid}</td>
                  <td className="py-2 text-center">{tricks}</td>
                  <td className={`py-2 text-right font-bold ${pts >= 0 ? 'text-gold-300' : 'text-red-400'}`}>
                    {pts > 0 ? `+${pts}` : pts}
                    <span className="ml-1 text-xs">{bid === tricks ? '✓' : '✗'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-5">
          {isHost ? (
            <button
              type="button"
              data-testid="next-round"
              onClick={() => nextRound()}
              className="w-full rounded-xl bg-gold-400 py-3 text-base font-bold text-felt-900 shadow-md active:scale-95"
            >
              {isLastRound ? fr.gameOver : fr.nextRound}
            </button>
          ) : (
            <p className="text-center text-sm text-white/60">{fr.waitingNextRound}</p>
          )}
        </div>
      </div>
    </div>
  );
}
