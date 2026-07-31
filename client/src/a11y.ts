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
  applyHand();
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

/*
 * Commandes à gauche.
 *
 * Rikiki se joue à une main, et les commandes de la table (réactions, etc.)
 * sont posées par défaut sur le bord droit — naturel pour un droitier qui
 * tient son téléphone de la main gauche et touche de la droite, mais qui
 * oblige un gaucher à traverser l'écran à chaque geste. Même mécanique que le
 * mode daltonien ci-dessus : un attribut sur `<html>`, que chaque composant
 * concerné lit pour choisir son bord.
 */
const HAND_KEY = 'rikiki-left-handed';

let leftHanded = false;
const handListeners = new Set<() => void>();

try {
  leftHanded = localStorage.getItem(HAND_KEY) === '1';
} catch {
  leftHanded = false;
}

function applyHand(): void {
  if (typeof document === 'undefined') return;
  if (leftHanded) {
    document.documentElement.setAttribute('data-left-handed', 'true');
  } else {
    document.documentElement.removeAttribute('data-left-handed');
  }
}

export function isLeftHanded(): boolean {
  return leftHanded;
}

export function setLeftHanded(next: boolean): void {
  leftHanded = next;
  try {
    localStorage.setItem(HAND_KEY, next ? '1' : '0');
  } catch {
    // sans stockage, le réglage vaut pour la session
  }
  applyHand();
  handListeners.forEach((cb) => cb());
}

export function subscribeLeftHanded(cb: () => void): () => void {
  handListeners.add(cb);
  return () => handListeners.delete(cb);
}
