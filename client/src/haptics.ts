/**
 * Retour haptique.
 *
 * Une vibration courte au bon moment fait plus pour la sensation de « vrai
 * jeu » que n'importe quelle animation : le geste devient tangible. On reste
 * volontairement sobre — de brèves impulsions, jamais de vibration longue.
 *
 * Le réglage suit celui du son : couper le son coupe aussi les vibrations,
 * c'est ce qu'attend un joueur qui met son téléphone en discrétion.
 */
import { isMuted } from './audio';

export type HapticPattern =
  | 'tap' // pose d'une carte, appui sur une pastille
  | 'select' // sélection légère (changement d'onglet, choix d'avatar)
  | 'success' // contrat tenu, pli remporté
  | 'failure' // contrat manqué
  | 'celebrate'; // victoire finale

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 12,
  select: 8,
  success: [14, 40, 22],
  failure: [30, 60, 30],
  celebrate: [18, 50, 18, 50, 40],
};

export function vibrate(pattern: HapticPattern): void {
  if (isMuted()) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Certains navigateurs exposent l'API sans l'implémenter : sans gravité.
  }
}
