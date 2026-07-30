import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m as motion } from 'motion/react';
import { EMOTES, PHRASES, type EmoteId, type PhraseId } from '@rikiki/shared';
import { vibrate } from '../haptics';
import { useT } from '../i18n';
import { sendEmote, sendPhrase } from '../socket';

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
 * Réactions et petites phrases à la table.
 *
 * Une partie entre amis se joue aussi en chambrant : sans un moyen de réagir,
 * il ne reste que les cartes, et le jeu à distance devient silencieux. Les
 * réactions disent l'humeur, les phrases disent ce qu'un emoji ne sait pas
 * dire — « je reviens », « on t'attend », « belle partie ».
 *
 * Les deux listes sont FERMÉES : traduites comme le reste du jeu, elles
 * n'appellent ni modération ni signalement, là où un champ de saisie libre
 * ferait de Rikiki une messagerie et l'exposerait aux obligations qui vont
 * avec.
 *
 * Le bouton reste petit et à l'écart de la main : personne ne doit envoyer un
 * bisou en voulant jouer une carte.
 */
export default function EmoteBar() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'emotes' | 'phrases'>('emotes');
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

  const say = (phrase: PhraseId) => {
    vibrate('select');
    sendPhrase(phrase);
    // Une phrase, elle, se suffit : on referme tout de suite pour rendre le
    // tapis, au lieu de laisser un panneau posé sur la table.
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(false);
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
            className="pointer-events-auto w-56 rounded-2xl bg-felt-900/95 p-1.5 ring-1 ring-white/10"
            style={{ boxShadow: 'var(--shadow-panel)' }}
            data-testid="emote-palette"
          >
            {/* Deux onglets plutôt qu'une longue liste : les réactions se
                choisissent d'un geste, les phrases se lisent — les mélanger
                ralentirait les deux. */}
            <div className="mb-1.5 flex gap-1 rounded-xl bg-felt-950/60 p-0.5">
              <TabButton
                active={tab === 'emotes'}
                onClick={() => setTab('emotes')}
                label={t.emotes}
                glyph="😀"
                testId="tab-emotes"
              />
              <TabButton
                active={tab === 'phrases'}
                onClick={() => setTab('phrases')}
                label={t.phrases}
                glyph="💬"
                testId="tab-phrases"
              />
            </div>

            {tab === 'emotes' ? (
              <div className="grid grid-cols-4 gap-1">
                {EMOTES.map((emote) => (
                  <button
                    key={emote}
                    type="button"
                    data-testid={`emote-${emote}`}
                    onClick={() => send(emote)}
                    aria-label={emote}
                    className="flex h-12 items-center justify-center rounded-xl text-2xl transition active:scale-90"
                  >
                    <span aria-hidden="true">{EMOTE_GLYPH[emote]}</span>
                  </button>
                ))}
              </div>
            ) : (
              // La liste défile : dix phrases lisibles ne tiennent pas dans la
              // hauteur qu'on peut voler au tapis sans masquer le pli.
              <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto overscroll-contain">
                {PHRASES.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    data-testid={`phrase-${phrase}`}
                    onClick={() => say(phrase)}
                    className="min-h-11 rounded-xl px-2.5 text-left text-[13px] font-medium leading-tight text-paper-50 transition active:scale-[0.98] active:bg-white/10"
                  >
                    {t.phraseTexts[phrase]}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        data-testid="open-emotes"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${t.emotes} · ${t.phrases}`}
        aria-expanded={open}
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-felt-900/70 text-xl ring-1 ring-white/10 transition active:scale-90"
      >
        <span aria-hidden="true">{open ? '✕' : '😀'}</span>
      </button>
    </div>
  );
}

/** Onglet de la palette : glyphe seul, mais nommé pour les lecteurs d'écran. */
function TabButton({
  active,
  onClick,
  label,
  glyph,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  glyph: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`min-h-9 flex-1 rounded-lg text-lg transition ${
        active ? 'bg-white/12' : 'opacity-55'
      }`}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
