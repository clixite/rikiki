import { useState } from 'react';
import { motion } from 'motion/react';
import { useNav } from '../nav';
import type { GameFormat, GameView, ScoringVariant } from '@rikiki/shared';
import { DEFAULT_SCORING, GAME_FORMATS, MIN_PLAYERS, SCORING_VARIANTS, formatSummary, isBotId } from '@rikiki/shared';
import InviteButtons from '../components/InviteButtons';
import SoundToggle from '../components/SoundToggle';
import { useT } from '../i18n';

import { addBot, kickPlayer, leaveRoom, removeBot, setFormat, setScoring, startGame } from '../socket';
import { useGame } from '../store/game';
import PlayerAvatar from '../components/PlayerAvatar';

interface Props {
  view: GameView;
}

export default function Lobby({ view }: Props) {
  const t = useT();
  const navigate = useNav();
  const [busy, setBusy] = useState(false);
  // Format affiché en attendant l'aller-retour serveur (retour tactile immédiat).
  const [pendingFormat, setPendingFormat] = useState<GameFormat | null>(null);
  const [pendingScoring, setPendingScoring] = useState<ScoringVariant | null>(null);
  const isHost = view.hostId === view.you;
  const selectedFormat = pendingFormat ?? view.format;
  // Les parties créées avant l'arrivée des barèmes n'en portent aucun.
  const selectedScoring = pendingScoring ?? view.scoring ?? DEFAULT_SCORING;
  const missing = Math.max(0, MIN_PLAYERS - view.players.length);
  const canStart = missing === 0;
  const isFull = view.players.length >= view.maxPlayers;

  const onStart = async () => {
    const res = await startGame();
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  const onPickFormat = async (format: GameFormat) => {
    if (format === selectedFormat) return;
    setPendingFormat(format);
    const res = await setFormat(format);
    setPendingFormat(null);
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  const onPickScoring = async (scoring: ScoringVariant) => {
    if (scoring === selectedScoring) return;
    setPendingScoring(scoring);
    const res = await setScoring(scoring);
    setPendingScoring(null);
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
        <p className="text-xs uppercase tracking-widest text-paper-50/50">{t.gameCode}</p>
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
          {t.players} · {view.players.length}/{view.maxPlayers}
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
                <PlayerAvatar playerId={p.id} avatar={p.avatar} photo={p.photo} size={30} />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                  {p.pseudo}
                  {p.id === view.you && <span className="ml-1.5 text-xs text-paper-50/45">({t.you})</span>}
                  {bot && <span className="ml-1.5 text-xs text-paper-50/45">· {t.botTag}</span>}
                </span>
                {p.id === view.hostId && (
                  <span className="rounded-full bg-brass-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brass-300">
                    {t.host}
                  </span>
                )}
                {isHost && p.id !== view.you && (
                  <button
                    type="button"
                    onClick={() => (bot ? removeBot(p.id) : kickPlayer(p.id))}
                    aria-label={bot ? t.removeBot : t.kick}
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
              <span className="block text-[15px] font-medium text-paper-50/90">{t.addBot}</span>
              <span className="block text-[11px] text-paper-50/45">{t.addBotHint}</span>
            </span>
            <span className="text-lg text-paper-50/40">+</span>
          </button>
        )}
      </div>

      {/* Format de partie : l'hôte choisit la durée, les autres la voient */}
      <div className="pt-4" data-testid="format-picker" data-format={selectedFormat}>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-paper-50/50">{t.gameFormat}</p>
          <p className="text-[11px] text-paper-50/40">{isHost ? t.gameFormatHint : t.formatLocked}</p>
        </div>

        {isHost ? (
          <div className="grid grid-cols-3 gap-1.5">
            {GAME_FORMATS.map((f) => {
              const summary = formatSummary(view.players.length, f);
              const selected = f === selectedFormat;
              return (
                <button
                  key={f}
                  type="button"
                  data-testid={`format-${f}`}
                  aria-pressed={selected}
                  title={t.formatDescriptions[f]}
                  onClick={() => onPickFormat(f)}
                  className={`relative flex min-h-[68px] flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2 transition active:scale-95 ${
                    selected ? 'text-felt-950' : 'bg-felt-900/45 text-paper-50 ring-1 ring-white/6'
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="format-active"
                      aria-hidden="true"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-xl bg-linear-to-b from-brass-300 to-brass-500 ring-1 ring-brass-200/50"
                      style={{ boxShadow: '0 2px 8px -2px rgb(0 0 0 / 0.5)' }}
                    />
                  )}
                  <span className="relative text-[13px] font-bold leading-tight">{t.formatNames[f]}</span>
                  <span
                    className={`relative text-[10px] leading-tight tabular-nums ${
                      selected ? 'text-felt-900/75' : 'text-paper-50/50'
                    }`}
                  >
                    {t.formatRounds(summary.rounds)}
                  </span>
                  <span
                    className={`relative text-[10px] font-semibold leading-tight tabular-nums ${
                      selected ? 'text-felt-900/75' : 'text-brass-300/80'
                    }`}
                  >
                    {t.formatDuration(summary.minutes)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            data-testid={`format-${selectedFormat}`}
            className="flex items-center gap-3 rounded-xl bg-felt-900/45 px-3 py-2.5 ring-1 ring-white/6"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium text-paper-50">{t.formatNames[selectedFormat]}</span>
              <span className="block text-[11px] text-paper-50/45">{t.formatDescriptions[selectedFormat]}</span>
            </span>
            <span className="shrink-0 text-right text-[11px] tabular-nums text-paper-50/55">
              <span className="block">{t.formatRounds(formatSummary(view.players.length, selectedFormat).rounds)}</span>
              <span className="block font-semibold text-brass-300/80">
                {t.formatDuration(formatSummary(view.players.length, selectedFormat).minutes)}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Barème de score : chaque famille compte à sa façon, il faut pouvoir
          retrouver la sienne — sinon le jeu paraît « faux ». */}
      <div className="pt-3" data-testid="scoring-picker" data-scoring={selectedScoring}>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-paper-50/50">{t.scoringVariant}</p>
          <p className="text-[11px] text-paper-50/40">{isHost ? t.scoringHint : t.scoringLocked}</p>
        </div>

        {isHost ? (
          <div className="grid grid-cols-3 gap-1.5">
            {SCORING_VARIANTS.map((s) => {
              const selected = s === selectedScoring;
              return (
                <button
                  key={s}
                  type="button"
                  data-testid={`scoring-${s}`}
                  aria-pressed={selected}
                  title={t.scoringDescriptions[s]}
                  onClick={() => onPickScoring(s)}
                  className={`relative flex min-h-[44px] items-center justify-center rounded-xl px-1.5 py-2 text-center transition active:scale-95 ${
                    selected ? 'text-felt-950' : 'bg-felt-900/45 text-paper-50 ring-1 ring-white/6'
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="scoring-active"
                      aria-hidden="true"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-xl bg-linear-to-b from-brass-300 to-brass-500 ring-1 ring-brass-200/50"
                      style={{ boxShadow: '0 2px 8px -2px rgb(0 0 0 / 0.5)' }}
                    />
                  )}
                  <span className="relative text-[13px] font-bold leading-tight">{t.scoringNames[s]}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-felt-900/45 px-3 py-2.5 text-[15px] font-medium text-paper-50 ring-1 ring-white/6">
            {t.scoringNames[selectedScoring]}
          </p>
        )}

        {/* La règle en toutes lettres : c'est elle qu'on vient vérifier */}
        <p className="mt-1.5 text-[11px] leading-snug text-paper-50/50" data-testid="scoring-description">
          {t.scoringDescriptions[selectedScoring]}
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-3">
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
              {t.startGame}
            </button>
            {!canStart && (
              <p className="text-center text-xs text-paper-50/55">{t.needPlayers(missing)}</p>
            )}
          </>
        ) : (
          <p className="rk-shimmer rounded-xl py-3 text-center text-sm text-paper-50/65">
            {t.waitingForHost}
          </p>
        )}
        <button
          type="button"
          onClick={onLeave}
          className="w-full py-2.5 text-sm text-paper-50/50 transition active:scale-95"
        >
          {t.leave}
        </button>
      </div>
    </div>
  );
}
