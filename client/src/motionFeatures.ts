/**
 * Fonctionnalités d'animation, isolées dans leur propre module.
 *
 * Ce fichier n'existe que pour donner à l'empaqueteur un point de coupe : c'est
 * lui, et lui seul, qui tire le gros du moteur d'animation. `main.tsx` l'importe
 * dynamiquement, ce qui le sort du premier téléchargement. Importer `domMax`
 * directement depuis `main.tsx` remettrait tout dans le paquet initial — la
 * frontière de chargement se dessine par fichier, pas par instruction.
 *
 * `domMax` plutôt que `domAnimation` : le vol d'une carte de la main vers le
 * tapis repose sur les animations de disposition, et l'éventail étalé se
 * parcourt au doigt. Les deux vivent ici.
 */
import { domMax } from 'motion/react';

export default domMax;
