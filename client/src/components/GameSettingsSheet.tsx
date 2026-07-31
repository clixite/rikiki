import { useState } from 'react';
import { m as motion } from 'motion/react';
import type { GameFormat, GamePace, GameView, ScoringVariant } from '@rikiki/shared';
import {
  DEFAULT_PACE,
  DEFAULT_SCORING,
  GAME_FORMATS,
  GAME_PACES,
  SCORING_VARIANTS,
  formatSummary,
} from '@rikiki/shared';
import { useT } from '../i18n';
import { setFormat, setPace, setScoring } from '../socket';
import { useGame } from '../store/game';

interface Props {
  view: GameView;
  onClose: () => void;
}

/**
 * Réglages de la partie : durée, rythme, barème.
 *
 * Ils vivaient à la suite dans le salon. Empilés, ils dépassaient de l'écran
 * d'un petit téléphone sans que rien ne le signale : deux réglages sur trois
 * étaient introuvables, et le troisième était coupé en deux par le bouton de
 * lancement. Ils tiennent maintenant dans une feuille dédiée, résumée en une
 * ligne dans le salon — le salon retrouve ce pour quoi on l'ouvre : le code,
 * les invitations et les joueurs.
 */
export default function GameSettingsSheet({ view, onClose }: Props) {
  const t = useT();
  const isHost = view.hostId === view.you;
  // Valeur affichée en attendant l'aller-retour serveur (retour tactile immédiat).
  const [pendingFormat, setPendingFormat] = useState<GameFormat | null>(null);
  const [pendingPace, setPendingPace] = useState<GamePace | null>(null);
  const [pendingScoring, setPendingScoring] = useState<ScoringVariant | null>(null);

  const selectedFormat = pendingFormat ?? view.format;
  // Les parties créées avant l'arrivée de ces réglages n'en portent aucun.
  const selectedPace = pendingPace ?? view.pace ?? DEFAULT_PACE;
  const selectedScoring = pendingScoring ?? view.scoring ?? DEFAULT_SCORING;

  const apply = async <T,>(value: T, current: T, hold: (v: T | null) => void, send: (v: T) => Promise<{ ok: boolean; error?: { message: string } }>) => {
    if (value === current) return;
    hold(value);
    const res = await send(value);
    hold(null);
    if (!res.ok && res.error) useGame.getState().showToast(res.error.message);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      data-testid="settings-sheet"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl bg-felt-800 ring-1 ring-white/10 sm:rounded-3xl"
        style={{ boxShadow: 'var(--shadow-panel)' }}
      >
        <div className="shrink-0 px-5 pt-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
          <h2 className="text-center text-lg font-bold">{t.gameSettings}</h2>
          <p className="mt-0.5 text-center text-xs text-paper-50/55">
            {isHost ? t.gameSettingsHint : t.gameSettingsLocked}
          </p>
        </div>

        <div className="rk-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Durée */}
          <Group testid="format" title={t.gameFormat} description={t.formatDescriptions[selectedFormat]}>
            <Choices
              testid="format"
              value={selectedFormat}
              values={GAME_FORMATS}
              label={(f) => t.formatNames[f]}
              hint={(f) => t.formatDuration(formatSummary(view.players.length, f).minutes)}
              title={(f) => t.formatDescriptions[f]}
              disabled={!isHost}
              onPick={(f) => apply(f, selectedFormat, setPendingFormat, setFormat)}
            />
          </Group>

          {/* Rythme */}
          <Group testid="pace" title={t.gamePace} description={t.paceDescriptions[selectedPace]}>
            <Choices
              testid="pace"
              value={selectedPace}
              values={GAME_PACES}
              label={(p) => t.paceNames[p]}
              title={(p) => t.paceDescriptions[p]}
              disabled={!isHost}
              onPick={(p) => apply(p, selectedPace, setPendingPace, setPace)}
            />
          </Group>

          {/* Barème */}
          <Group testid="scoring" title={t.scoringVariant} description={t.scoringDescriptions[selectedScoring]}>
            <Choices
              testid="scoring"
              value={selectedScoring}
              values={SCORING_VARIANTS}
              label={(s) => t.scoringNames[s]}
              title={(s) => t.scoringDescriptions[s]}
              disabled={!isHost}
              onPick={(s) => apply(s, selectedScoring, setPendingScoring, setScoring)}
            />
          </Group>
        </div>

        <div className="shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
          <button
            type="button"
            data-testid="settings-close"
            onClick={onClose}
            className="w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-3.5 text-base font-bold text-felt-950 transition hover:brightness-110 active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-cta)' }}
          >
            {t.settingsDone}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Group({
  testid,
  title,
  description,
  children,
}: {
  testid: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-paper-50/55">{title}</p>
      {children}
      {/* La règle en toutes lettres, sous les choix : c'est elle qu'on vient
          vérifier, et un libellé de deux mots ne la remplace pas. */}
      <p className="mt-1.5 text-[11px] leading-snug text-paper-50/55" data-testid={`${testid}-description`}>
        {description}
      </p>
    </section>
  );
}

function Choices<T extends string>({
  testid,
  value,
  values,
  label,
  hint,
  title,
  disabled,
  onPick,
}: {
  testid: string;
  value: T;
  values: readonly T[];
  label: (v: T) => string;
  hint?: (v: T) => string;
  title: (v: T) => string;
  disabled: boolean;
  onPick: (v: T) => void;
}) {
  return (
    <div
      className={`grid gap-1.5 ${values.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
      data-testid={`${testid}-picker`}
      data-value={value}
    >
      {values.map((v) => {
        const selected = v === value;
        return (
          <button
            key={v}
            type="button"
            data-testid={`${testid}-${v}`}
            aria-pressed={selected}
            disabled={disabled}
            title={title(v)}
            onClick={() => onPick(v)}
            className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2 text-center transition active:scale-95 disabled:active:scale-100 ${
              selected ? 'text-felt-950' : 'bg-felt-900/55 text-paper-50 ring-1 ring-white/8'
            } ${disabled && !selected ? 'opacity-45' : ''}`}
          >
            {selected && (
              <motion.span
                layoutId={`${testid}-active`}
                aria-hidden="true"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-linear-to-b from-brass-300 to-brass-500 ring-1 ring-brass-200/50"
                style={{ boxShadow: '0 2px 8px -2px rgb(0 0 0 / 0.5)' }}
              />
            )}
            <span className="relative text-[13px] font-bold leading-tight">{label(v)}</span>
            {hint && (
              <span
                className={`relative text-[10px] font-semibold leading-tight tabular-nums ${
                  selected ? 'text-felt-900/75' : 'text-brass-300/80'
                }`}
              >
                {hint(v)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
