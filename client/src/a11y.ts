/**
 * Réglages d'accessibilité.
 *
 * Le European Accessibility Act s'applique aux services numériques depuis
 * juin 2025 : un jeu diffusé dans l'Union doit être utilisable par tous.
 * Au-delà de l'obligation, un joueur sur douze environ perçoit mal le rouge —
 * or rouge et noir sont, dans un jeu de cartes, le seul repère entre enseignes.
 */

const KEY = 'rikiki-colorblind';

let colorblind = false;
const listeners = new Set<() => void>();

try {
  colorblind = localStorage.getItem(KEY) === '1';
} catch {
  colorblind = false;
}

function apply(): void {
  if (typeof document === 'undefined') return;
  if (colorblind) {
    document.documentElement.setAttribute('data-colorblind', 'true');
  } else {
    document.documentElement.removeAttribute('data-colorblind');
  }
}

/** À appeler au démarrage, avant le premier rendu. */
export function initA11y(): void {
  apply();
}

export function isColorblindMode(): boolean {
  return colorblind;
}

export function setColorblindMode(next: boolean): void {
  colorblind = next;
  try {
    localStorage.setItem(KEY, next ? '1' : '0');
  } catch {
    // sans stockage, le réglage vaut pour la session
  }
  apply();
  listeners.forEach((cb) => cb());
}

export function subscribeA11y(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
