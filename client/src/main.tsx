import React from 'react';
import ReactDOM from 'react-dom/client';
import { LazyMotion } from 'motion/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initA11y } from './a11y';
import { initI18n } from './i18n';
import './styles/index.css';
import { initErrorReporting } from './errorReporting';

// La langue est résolue avant le premier rendu : pas de bascule visible.
void initI18n();
initA11y();

// Avant le premier rendu : une erreur survenue au montage doit aussi remonter.
initErrorReporting();

/*
 * Moteur d'animation chargé APRÈS le premier écran.
 *
 * Les composants du jeu utilisent `m` plutôt que `motion` : `m` ne tire pas
 * derrière lui l'intégralité de la bibliothèque d'animation, qui pesait à elle
 * seule plus du quart du premier téléchargement. `domMax` — gestes, glissement
 * et animations de disposition (le vol d'une carte de la main vers le tapis en
 * dépend) — arrive dans un second temps, pendant que le joueur lit l'accueil.
 *
 * Avant son arrivée, les éléments s'affichent sans transition : c'est le bon
 * compromis, l'accueil n'anime rien de vital et la table n'apparaît jamais
 * dans les premières centaines de millisecondes.
 */
const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LazyMotion>
  </React.StrictMode>,
);
