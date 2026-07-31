import { useSyncExternalStore } from 'react';
import {
  isColorblindMode,
  isLeftHanded,
  setColorblindMode,
  setLeftHanded,
  subscribeA11y,
  subscribeLeftHanded,
} from '../a11y';
import { vibrate } from '../haptics';
import { useT } from '../i18n';

/**
 * Réglages d'accessibilité.
 *
 * Le mode « couleurs distinctes » donne une teinte propre à chaque enseigne
 * (paquet à quatre couleurs). Sans lui, ♥ et ♠ sont indiscernables pour une
 * personne qui perçoit mal le rouge — soit environ un homme sur douze.
 *
 * « Commandes à gauche » répond à un autre besoin, tout aussi silencieux :
 * Rikiki se joue à une main, mais les commandes de la table sont posées par
 * défaut sur le bord droit. Un gaucher les atteint en traversant l'écran à
 * chaque geste ; ce réglage leur donne le bord gauche à la place.
 */
export default function AccessibilitySection({ className = '' }: { className?: string }) {
  const t = useT();
  const colorblind = useSyncExternalStore(subscribeA11y, isColorblindMode, isColorblindMode);
  const leftHanded = useSyncExternalStore(subscribeLeftHanded, isLeftHanded, isLeftHanded);

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="rounded-xl bg-felt-900/40 p-3.5 ring-1 ring-white/6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-paper-50/90">{t.colorblindMode}</p>
            <p className="mt-0.5 text-xs leading-snug text-paper-50/55">{t.colorblindHint}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={colorblind}
            aria-label={t.colorblindMode}
            data-testid="colorblind-toggle"
            onClick={() => {
              vibrate('select');
              setColorblindMode(!colorblind);
            }}
            className="flex h-11 w-12 shrink-0 items-center"
          >
            {/* Le rail garde ses vingt-huit pixels — c'est le bon dessin. C'est
                le BOUTON qui monte à quarante-quatre : un interrupteur haut
                comme son rail se rate au pouce une fois sur trois. */}
            <span
              aria-hidden="true"
              className={`relative block h-7 w-12 rounded-full transition ${
                colorblind ? 'bg-success' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-paper-50 shadow transition-all ${
                  colorblind ? 'left-6' : 'left-1'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-felt-900/40 p-3.5 ring-1 ring-white/6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-paper-50/90">{t.leftHandedMode}</p>
            <p className="mt-0.5 text-xs leading-snug text-paper-50/55">{t.leftHandedHint}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={leftHanded}
            aria-label={t.leftHandedMode}
            data-testid="left-handed-toggle"
            onClick={() => {
              vibrate('select');
              setLeftHanded(!leftHanded);
            }}
            className="flex h-11 w-12 shrink-0 items-center"
          >
            {/* Le rail garde ses vingt-huit pixels — c'est le bon dessin. C'est
                le BOUTON qui monte à quarante-quatre : un interrupteur haut
                comme son rail se rate au pouce une fois sur trois. */}
            <span
              aria-hidden="true"
              className={`relative block h-7 w-12 rounded-full transition ${
                leftHanded ? 'bg-success' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-paper-50 shadow transition-all ${
                  leftHanded ? 'left-6' : 'left-1'
                }`}
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
