import { useSyncExternalStore } from 'react';
import { isColorblindMode, setColorblindMode, subscribeA11y } from '../a11y';
import { vibrate } from '../haptics';
import { useT } from '../i18n';

/**
 * Réglages d'accessibilité.
 *
 * Le mode « couleurs distinctes » donne une teinte propre à chaque enseigne
 * (paquet à quatre couleurs). Sans lui, ♥ et ♠ sont indiscernables pour une
 * personne qui perçoit mal le rouge — soit environ un homme sur douze.
 */
export default function AccessibilitySection({ className = '' }: { className?: string }) {
  const t = useT();
  const enabled = useSyncExternalStore(subscribeA11y, isColorblindMode, isColorblindMode);

  return (
    <div className={`rounded-xl bg-felt-900/40 p-3.5 ring-1 ring-white/6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-paper-50/90">{t.colorblindMode}</p>
          <p className="mt-0.5 text-xs leading-snug text-paper-50/45">{t.colorblindHint}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t.colorblindMode}
          data-testid="colorblind-toggle"
          onClick={() => {
            vibrate('select');
            setColorblindMode(!enabled);
          }}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            enabled ? 'bg-success' : 'bg-white/15'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-1 h-5 w-5 rounded-full bg-paper-50 shadow transition-all ${
              enabled ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
