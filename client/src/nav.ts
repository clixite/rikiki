import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, type NavigateOptions, type To } from 'react-router-dom';

/**
 * Navigation avec transitions natives (View Transitions API).
 *
 * Un changement d'écran instantané donne l'impression d'un site, pas d'une
 * application : on perd le sens de la direction, on ne sait plus si on avance
 * ou si on revient. Le navigateur sait faire ce fondu enchaîné lui-même, sans
 * bibliothèque ni double rendu — il suffit de lui confier la mise à jour.
 *
 * Là où l'API n'existe pas (Firefox, Safari ancien) ou si l'utilisateur a
 * demandé moins d'animations, on navigue normalement : aucun effet, aucune
 * régression.
 */

type StartViewTransition = (cb: () => void | Promise<void>) => { finished: Promise<void> };

function startViewTransition(): StartViewTransition | null {
  if (typeof document === 'undefined') return null;
  const fn = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
  if (typeof fn !== 'function') return null;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  return fn.bind(document);
}

/** Filet de sécurité : au-delà, on considère la navigation faite. */
const BACK_TIMEOUT_MS = 250;

/**
 * Attend que le retour dans l'historique ait été rendu.
 *
 * Pendant une transition, le navigateur suspend le rendu : `requestAnimationFrame`
 * ne se déclenche donc jamais tant que la mise à jour n'est pas terminée — s'y
 * fier bloquerait la transition indéfiniment. On s'appuie sur `popstate`, qui
 * lui continue d'être distribué ; le routeur y répond avant nous, si bien que
 * le nouvel écran est déjà en place quand notre écouteur s'exécute.
 */
function afterHistoryBack(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (): void => {
      if (done) return;
      done = true;
      window.removeEventListener('popstate', onPop);
      resolve();
    };
    const onPop = (): void => {
      // Une tâche de plus : React a alors purgé sa mise à jour
      setTimeout(finish, 0);
    };
    window.addEventListener('popstate', onPop);
    setTimeout(finish, BACK_TIMEOUT_MS);
  });
}

export interface Nav {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
}

/**
 * Remplace `useNavigate` : même signature, transition en plus.
 * La direction (aller / retour) est posée sur `<html>` pour que la feuille de
 * style choisisse le sens du glissement.
 */
export function useNav(): Nav {
  const navigate = useNavigate();

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      const back = typeof to === 'number' && to < 0;
      const go = () => {
        if (typeof to === 'number') navigate(to);
        else navigate(to, options);
      };

      const start = startViewTransition();
      if (!start) {
        go();
        return;
      }

      document.documentElement.dataset.nav = back ? 'back' : 'forward';
      const transition = start(() => {
        // Un retour passe par l'historique : le rendu arrive via `popstate`,
        // on ne peut pas le forcer, on attend simplement la peinture.
        if (back) {
          const rendered = afterHistoryBack();
          go();
          return rendered;
        }
        // Aller : la transition doit voir le DOM final tout de suite.
        flushSync(go);
      });
      void transition.finished.finally(() => {
        delete document.documentElement.dataset.nav;
      });
    },
    [navigate],
  ) as Nav;
}
