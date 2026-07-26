import { useNavigate } from 'react-router-dom';
import type { GameView } from '@rikiki/shared';
import { fr } from '../i18n/fr';
import { leaveRoom, rematch } from '../socket';
import { useGame } from '../store/game';

interface Props {
  view: GameView;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function GameOver({ view }: Props) {
  const navigate = useNavigate();
  const isHost = view.hostId === view.you;
  const sorted = [...view.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];

  const onRematch = async () => {
    const res = await rematch();
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  const onHome = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold">{fr.gameOver}</h1>
      <div className="my-6 text-center">
        <div className="text-7xl">{winner.avatar}</div>
        <p className="mt-2 text-xl font-bold text-gold-300">
          🏆 {winner.pseudo} · {winner.totalScore} pts
        </p>
      </div>

      <ul className="w-full space-y-2">
        {sorted.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${
              i === 0 ? 'bg-gold-400/20' : 'bg-black/25'
            }`}
          >
            <span className="w-7 text-lg">{MEDALS[i] ?? `${i + 1}.`}</span>
            <span className="text-xl">{p.avatar}</span>
            <span className="flex-1 truncate font-medium">
              {p.pseudo}
              {p.id === view.you && <span className="ml-1 text-xs text-white/50">({fr.you})</span>}
            </span>
            <span className="font-bold text-gold-300">{p.totalScore}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 w-full space-y-2">
        {isHost && (
          <button
            type="button"
            onClick={onRematch}
            className="w-full rounded-2xl bg-gold-400 py-4 text-lg font-bold text-felt-900 shadow-lg active:scale-95"
          >
            🔁 {fr.playAgain}
          </button>
        )}
        <button
          type="button"
          onClick={onHome}
          className="w-full rounded-2xl border border-white/30 py-3 text-base font-semibold active:scale-95"
        >
          {fr.backHome}
        </button>
      </div>
    </div>
  );
}
