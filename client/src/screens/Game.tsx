import { Navigate } from 'react-router-dom';
import { useWakeLock } from '../hooks/useWakeLock';
import { useT } from '../i18n';

import { useGame } from '../store/game';
import { useSession } from '../store/session';
import GameOver from './GameOver';
import Lobby from './Lobby';
import Table from './Table';

export default function Game() {
  const t = useT();
  const view = useGame((s) => s.view);
  const { roomCode, user } = useSession();
  useWakeLock(view !== null && view.phase !== 'lobby' && view.phase !== 'game-over');

  if (!user) return <Navigate to="/profile" replace />;
  if (!view) {
    // Après un refresh, App tente de re-rejoindre la room sauvegardée
    if (!roomCode) return <Navigate to="/" replace />;
    return (
      <div className="flex h-dvh items-center justify-center text-white/70">{t.loading}</div>
    );
  }

  if (view.phase === 'lobby') return <Lobby view={view} />;
  if (view.phase === 'game-over') return <GameOver view={view} />;
  return <Table view={view} />;
}
