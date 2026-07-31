import { m as motion } from 'motion/react';
import { useNav } from '../nav';
import Icon from '../components/Icon';
import type { GameView } from '@rikiki/shared';
import SoundToggle from '../components/SoundToggle';
import { useT } from '../i18n';

import { shareResult } from '../shareCard';
import { leaveRoom, rematch } from '../socket';
import { vibrate } from '../haptics';
import { useGame } from '../store/game';
import PlayerAvatar from '../components/PlayerAvatar';

interface Props {
  view: GameView;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function GameOver({ view }: Props) {
  const t = useT();
  const navigate = useNav();
  const isHost = view.hostId === view.you;
  const sorted = [...view.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];
  const iWon = winner.id === view.you;

  /*
   * Ma partie en deux chiffres. Le classement dit qui a gagné ; il ne dit pas
   * COMMENT on a joué — et c'est ce « 5 contrats sur 7 » qui donne envie de
   * faire mieux à la prochaine. L'historique est accumulé côté client au fil
   * des manches : quelqu'un qui rejoint la table à la toute fin n'en a pas,
   * et le bandeau disparaît alors plutôt que d'afficher des zéros faux.
   */
  const roundHistory = useGame((s) => s.roundHistory);
  const kept = roundHistory.filter((r) => r.bid !== null && r.bid === r.tricks).length;
  const bestRound = roundHistory.length ? Math.max(...roundHistory.map((r) => r.score)) : 0;

  const onRematch = async () => {
    const res = await rematch();
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  const onShare = async () => {
    vibrate('select');
    const res = await shareResult(view);
    if (res === 'downloaded') useGame.getState().showToast(t.shareSaved);
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
          <p className="text-xs uppercase tracking-widest text-paper-50/55">{t.gameOver}</p>
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            className="my-2"
          >
            <PlayerAvatar avatar={winner.avatar} size={96} className="mx-auto" />
          </motion.div>
          <p className="font-display text-2xl font-bold text-brass-300">{winner.pseudo}</p>
          <p className="mt-0.5 text-sm text-paper-50/60">
            {winner.totalScore} points {iWon ? '· bravo !' : ''}
          </p>
        </motion.div>

        {roundHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-3 flex gap-2"
            data-testid="game-recap"
          >
            <div className="flex-1 rounded-xl bg-felt-900/45 p-2.5 text-center ring-1 ring-white/6">
              <p className="text-[11px] leading-tight text-paper-50/55">{t.contractsKept}</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-brass-300">
                {kept}/{roundHistory.length}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-felt-900/45 p-2.5 text-center ring-1 ring-white/6">
              <p className="text-[11px] leading-tight text-paper-50/55">{t.bestRound}</p>
              <p
                className={`mt-0.5 text-lg font-bold tabular-nums ${
                  bestRound > 0 ? 'text-success' : 'text-paper-50/70'
                }`}
              >
                {bestRound > 0 ? `+${bestRound}` : bestRound}
              </p>
            </div>
          </motion.div>
        )}

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
                {MEDALS[i] ?? <span className="text-xs text-paper-50/55">{i + 1}</span>}
              </span>
              <PlayerAvatar avatar={p.avatar} size={22} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {p.pseudo}
                {p.id === view.you && <span className="ml-1 text-[11px] text-paper-50/55">({t.you})</span>}
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
            className="w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-4 text-lg font-bold text-felt-950 transition hover:brightness-110 active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-cta)' }}
          >
            {t.playAgain}
          </button>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="share-result"
            onClick={onShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 text-base font-semibold transition hover:bg-white/15 active:scale-[0.98]"
          >
            <Icon name="share" size={18} />
            {t.shareResult}
          </button>
          <button
            type="button"
            onClick={onHome}
            className="rounded-2xl bg-white/8 px-5 py-3 text-base font-medium transition hover:bg-white/12 active:scale-[0.98]"
          >
            {t.backHome}
          </button>
        </div>
      </div>
    </div>
  );
}
