import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import type { GameView } from '@rikiki/shared';
import { MIN_PLAYERS, isBotId } from '@rikiki/shared';
import InviteButtons from '../components/InviteButtons';
import SoundToggle from '../components/SoundToggle';
import { fr } from '../i18n/fr';
import { addBot, kickPlayer, leaveRoom, removeBot, startGame } from '../socket';
import { useGame } from '../store/game';

interface Props {
  view: GameView;
}

export default function Lobby({ view }: Props) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const isHost = view.hostId === view.you;
  const missing = Math.max(0, MIN_PLAYERS - view.players.length);
  const canStart = missing === 0;
  const isFull = view.players.length >= view.maxPlayers;

  const onStart = async () => {
    const res = await startGame();
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  const onAddBot = async () => {
    setBusy(true);
    const res = await addBot();
    setBusy(false);
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  const onLeave = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center justify-end">
        <SoundToggle />
      </div>

      {/* Code de la partie : l'information la plus importante de cet écran */}
      <div className="rk-fade-up text-center">
        <p className="text-xs uppercase tracking-widest text-paper-50/50">{fr.gameCode}</p>
        <p
          data-testid="room-code"
          className="font-display my-1 text-[3.25rem] font-bold leading-none tracking-[0.22em] text-brass-300"
          style={{ textShadow: '0 2px 12px rgb(0 0 0 / 0.4)' }}
        >
          {view.code}
        </p>
      </div>

      <div className="my-4">
        <InviteButtons code={view.code} />
      </div>

      {/* Liste des joueurs */}
      <div className="rk-scroll min-h-0 flex-1 overflow-y-auto">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-paper-50/50">
          {fr.players} · {view.players.length}/{view.maxPlayers}
        </p>
        <ul className="space-y-1.5">
          {view.players.map((p, i) => {
            const bot = isBotId(p.id);
            return (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 400, damping: 30 }}
                data-testid={`lobby-player-${p.id}`}
                className="flex items-center gap-3 rounded-xl bg-felt-900/45 px-3 py-2.5 ring-1 ring-white/6"
              >
                <span className="text-2xl leading-none" aria-hidden="true">
                  {p.avatar}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                  {p.pseudo}
                  {p.id === view.you && <span className="ml-1.5 text-xs text-paper-50/45">({fr.you})</span>}
                  {bot && <span className="ml-1.5 text-xs text-paper-50/45">· robot</span>}
                </span>
                {p.id === view.hostId && (
                  <span className="rounded-full bg-brass-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brass-300">
                    {fr.host}
                  </span>
                )}
                {isHost && p.id !== view.you && (
                  <button
                    type="button"
                    onClick={() => (bot ? removeBot(p.id) : kickPlayer(p.id))}
                    aria-label={bot ? fr.removeBot : fr.kick}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-paper-50/40 transition active:scale-90 hover:text-danger"
                  >
                    ✕
                  </button>
                )}
              </motion.li>
            );
          })}
        </ul>

        {/* Compléter la table avec un joueur automatique */}
        {isHost && !isFull && (
          <button
            type="button"
            data-testid="add-bot"
            onClick={onAddBot}
            disabled={busy}
            className="mt-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-left transition active:scale-[0.98] disabled:opacity-50"
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              🤖
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium text-paper-50/90">{fr.addBot}</span>
              <span className="block text-[11px] text-paper-50/45">{fr.addBotHint}</span>
            </span>
            <span className="text-lg text-paper-50/40">+</span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-4">
        {isHost ? (
          <>
            <button
              type="button"
              data-testid="start-game"
              onClick={onStart}
              disabled={!canStart}
              className="w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-4 text-lg font-bold text-felt-950 transition active:scale-[0.98] disabled:opacity-35"
              style={{ boxShadow: '0 4px 16px -4px rgb(0 0 0 / 0.5)' }}
            >
              {fr.startGame}
            </button>
            {!canStart && (
              <p className="text-center text-xs text-paper-50/55">{fr.needPlayers(missing)}</p>
            )}
          </>
        ) : (
          <p className="rk-shimmer rounded-xl py-3 text-center text-sm text-paper-50/65">
            {fr.waitingForHost}
          </p>
        )}
        <button
          type="button"
          onClick={onLeave}
          className="w-full py-2.5 text-sm text-paper-50/50 transition active:scale-95"
        >
          {fr.leave}
        </button>
      </div>
    </div>
  );
}
