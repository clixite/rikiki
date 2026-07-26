import { useNavigate } from 'react-router-dom';
import type { GameView } from '@rikiki/shared';
import { MIN_PLAYERS } from '@rikiki/shared';
import InviteButtons from '../components/InviteButtons';
import { fr } from '../i18n/fr';
import { kickPlayer, leaveRoom, startGame } from '../socket';
import { useGame } from '../store/game';

interface Props {
  view: GameView;
}

export default function Lobby({ view }: Props) {
  const navigate = useNavigate();
  const isHost = view.hostId === view.you;
  const canStart = view.players.length >= MIN_PLAYERS;

  const onStart = async () => {
    const res = await startGame();
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  const onLeave = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col px-5 py-6">
      <div className="text-center">
        <p className="text-sm text-white/70">{fr.gameCode}</p>
        <p data-testid="room-code" className="font-display my-1 text-6xl font-bold tracking-[0.3em] text-gold-300">
          {view.code}
        </p>
      </div>

      <div className="my-5">
        <InviteButtons code={view.code} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-2 text-sm font-medium text-white/70">
          {fr.players} ({view.players.length}/{view.maxPlayers})
        </p>
        <ul className="space-y-2">
          {view.players.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2.5">
              <span className="text-2xl">{p.avatar}</span>
              <span className="flex-1 truncate font-medium">
                {p.pseudo}
                {p.id === view.you && <span className="ml-1 text-xs text-white/50">({fr.you})</span>}
              </span>
              {p.id === view.hostId && (
                <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-xs text-gold-300">{fr.host}</span>
              )}
              {isHost && p.id !== view.you && (
                <button
                  type="button"
                  onClick={() => kickPlayer(p.id)}
                  className="text-xs text-red-300/80 active:scale-90"
                >
                  ✕ {fr.kick}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 pt-4">
        {isHost ? (
          <>
            <button
              type="button"
              data-testid="start-game"
              onClick={onStart}
              disabled={!canStart}
              className="w-full rounded-2xl bg-gold-400 py-4 text-lg font-bold text-felt-900 shadow-lg active:scale-95 disabled:opacity-40"
            >
              {fr.startGame}
            </button>
            {!canStart && <p className="text-center text-xs text-white/60">{fr.needPlayers}</p>}
          </>
        ) : (
          <p className="py-3 text-center text-sm text-white/70">{fr.waitingForHost}</p>
        )}
        <button type="button" onClick={onLeave} className="w-full py-2 text-sm text-white/60">
          ← {fr.leave}
        </button>
      </div>
    </div>
  );
}
