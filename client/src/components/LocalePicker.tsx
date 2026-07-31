import { useState } from 'react';
import { AnimatePresence, m as motion } from 'motion/react';
import { LOCALES, LOCALE_NAMES, setLocale, useLocale, useT, type Locale } from '../i18n';
import { vibrate } from '../haptics';

interface Props {
  /** Compacte : une ligne cliquable (réglages). Sinon : liste dépliée. */
  variant?: 'row' | 'inline';
  className?: string;
}

/**
 * Choix de la langue de l'interface.
 *
 * La langue de l'appareil est appliquée d'office au premier lancement : ce
 * sélecteur ne sert qu'à corriger ce choix, il ne doit donc pas monopoliser
 * l'écran. Les langues sont écrites dans leur propre langue — c'est la seule
 * façon pour quelqu'un de les reconnaître quand l'interface est dans une
 * langue qu'il ne lit pas.
 */
export default function LocalePicker({ variant = 'row', className = '' }: Props) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(variant === 'inline');

  const choose = (next: Locale) => {
    vibrate('select');
    void setLocale(next);
    if (variant === 'row') setOpen(false);
  };

  const list = (
    <div
      className="rk-scroll grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto"
      role="listbox"
      aria-label={t.language}
    >
      {LOCALES.map((code) => {
        const selected = code === locale;
        return (
          <button
            key={code}
            type="button"
            role="option"
            aria-selected={selected}
            data-testid={`locale-${code}`}
            onClick={() => choose(code)}
            className={`flex h-11 items-center gap-2 rounded-xl px-3 text-left text-sm transition active:scale-95 ${
              selected
                ? 'bg-brass-400/20 font-semibold text-brass-200 ring-1 ring-brass-400/40'
                : 'bg-felt-900/45 text-paper-50/80 ring-1 ring-white/6'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wide text-paper-50/55">{code}</span>
            <span className="min-w-0 flex-1 truncate">{LOCALE_NAMES[code]}</span>
            {selected && <span aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );

  if (variant === 'inline') {
    return <div className={className}>{list}</div>;
  }

  return (
    <div className={`rounded-xl bg-felt-900/40 p-3.5 ring-1 ring-white/6 ${className}`}>
      <button
        type="button"
        data-testid="locale-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-3 text-left"
      >
        <span aria-hidden="true" className="text-lg">
          🌍
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-paper-50/90">{t.language}</span>
          <span className="block text-xs text-paper-50/55">{LOCALE_NAMES[locale]}</span>
        </span>
        <span className={`text-paper-50/40 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ⌄
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{list}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
