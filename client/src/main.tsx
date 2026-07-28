import React from 'react';
import ReactDOM from 'react-dom/client';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
