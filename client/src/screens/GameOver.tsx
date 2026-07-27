import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import type { GameView } from '@rikiki/shared';
import SoundToggle from '../components/SoundToggle';
import { fr } from '../i18n/fr';
import { leaveRoom, rematch } from '../socket';
import { useGame } from '../store/game';
import PlayerAvatar from '../components/PlayerAvatar';

interface Props {
  view: GameView;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function GameOver({ view }: Props) {
  const navigate = useNavigate();
  const isHost = view.hostId === view.you;
  const sorted = [...view.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];
  const iWon = winner.id === view.you;

  const onRematch = async () => {
    const res = await rematch();
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  const onHome = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center justify-end">
        <SoundToggle />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mb-6 text-center"
        >
          <p className="text-xs uppercase tracking-widest text-paper-50/50">{fr.gameOver}</p>
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            className="my-2 text-7xl"
            aria-hidden="true"
          >
            {winner.avatar}
          </motion.div>
          <p className="font-display text-2xl font-bold text-brass-300">{winner.pseudo}</p>
          <p className="mt-0.5 text-sm text-paper-50/60">
            {winner.totalScore} points {iWon ? '· bravo !' : ''}
          </p>
        </motion.div>

        <ul className="space-y-1.5">
          {sorted.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 ${
                i === 0 ? 'bg-brass-400/12 ring-1 ring-brass-400/25' : 'bg-felt-900/40'
              }`}
            >
              <span className="w-6 text-center text-base" aria-hidden="true">
                {MEDALS[i] ?? <span className="text-xs text-paper-50/40">{i + 1}</span>}
              </span>
              <PlayerAvatar avatar={p.avatar} size={22} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {p.pseudo}
                {p.id === view.you && <span className="ml-1 text-[11px] text-paper-50/45">({fr.you})</span>}
              </span>
              <span className="text-base font-bold tabular-nums text-brass-300">{p.totalScore}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 pt-4">
        {isHost && (
          <button
            type="button"
            data-testid="rematch"
            onClick={onRematch}
            className="w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-4 text-lg font-bold text-felt-950 transition active:scale-[0.98]"
            style={{ boxShadow: '0 4px 16px -4px rgb(0 0 0 / 0.5)' }}
          >
            {fr.playAgain}
          </button>
        )}
        <button
          type="button"
          onClick={onHome}
          className="w-full rounded-2xl bg-white/8 py-3 text-base font-medium transition active:scale-[0.98]"
        >
          {fr.backHome}
        </button>
      </div>
    </div>
  );
}
