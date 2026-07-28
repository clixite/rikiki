import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EMOTES, type EmoteId } from '@rikiki/shared';
import { vibrate } from '../haptics';
import { useT } from '../i18n';
import { sendEmote } from '../socket';

/** Représentation visuelle de chaque réaction. */
export const EMOTE_GLYPH: Record<EmoteId, string> = {
  clap: '👏',
  slap: '🤚',
  kiss: '😘',
  laugh: '😂',
  cry: '😭',
  fire: '🔥',
  think: '🤔',
  wow: '😮',
};

/**
 * Réactions à la table.
 *
 * Une partie entre amis se joue aussi en chambrant : sans un moyen de réagir,
 * il ne reste que les cartes, et le jeu à distance devient silencieux. Une
 * palette fermée de huit réactions suffit — elle n'a besoin d'aucune
 * traduction, d'aucune modération, et ne peut pas se détourner en messagerie.
 *
 * Le bouton reste petit et à l'écart de la main : personne ne doit envoyer un
 * bisou en voulant jouer une carte.
 */
export default function EmoteBar() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const send = (emote: EmoteId) => {
    vibrate('select');
    sendEmote(emote);
    // On laisse la palette ouverte un instant : les réactions s'enchaînent.
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 1200);
  };

  return (
    <div className="pointer-events-none absolute bottom-2 right-3 flex flex-col items-end gap-1.5">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="pointer-events-auto grid grid-cols-4 gap-1 rounded-2xl bg-felt-900/90 p-1.5 ring-1 ring-white/10"
            style={{ boxShadow: 'var(--shadow-panel)' }}
            data-testid="emote-palette"
          >
            {EMOTES.map((emote) => (
              <button
                key={emote}
                type="button"
                data-testid={`emote-${emote}`}
                onClick={() => send(emote)}
                aria-label={emote}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition active:scale-90"
              >
                <span aria-hidden="true">{EMOTE_GLYPH[emote]}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        data-testid="open-emotes"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.emotes}
        aria-expanded={open}
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-felt-900/70 text-xl ring-1 ring-white/10 transition active:scale-90"
      >
        <span aria-hidden="true">{open ? '✕' : '😀'}</span>
      </button>
    </div>
  );
}
