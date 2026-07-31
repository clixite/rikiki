/**
 * Remontée des erreurs du client.
 *
 * Sans cela, un plantage chez un joueur ne laisse aucune trace : il ferme
 * l'application, ne dit rien, et le défaut vit sa vie. On envoie donc au
 * serveur le strict nécessaire pour reproduire — message, pile, écran, version
 * — et rien qui identifie la personne : ni pseudo, ni e-mail, ni contenu de
 * partie.
 *
 * Le débit est bridé : une boucle de rendu en échec produirait des milliers
 * d'événements identiques en quelques secondes.
 */
import { API_BASE } from './config';

const MAX_REPORTS_PER_SESSION = 5;
let sent = 0;
const seen = new Set<string>();

function report(kind: string, message: string, stack?: string): void {
  if (sent >= MAX_REPORTS_PER_SESSION) return;
  // Une même erreur qui se répète n'apporte rien de plus.
  const key = `${kind}:${message}`.slice(0, 200);
  if (seen.has(key)) return;
  seen.add(key);
  sent++;

  const body = JSON.stringify({
    kind,
    message: String(message).slice(0, 500),
    stack: stack ? String(stack).slice(0, 2000) : undefined,
    route: location.pathname,
    version: __APP_VERSION__,
    userAgent: navigator.userAgent.slice(0, 200),
  });

  // `keepalive` : le rapport part même si la page se ferme dans la foulée,
  // ce qui est précisément le cas après un plantage.
  fetch(`${API_BASE}/api/client-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function initErrorReporting(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    report('error', event.message, event.error?.stack);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { message?: string; stack?: string } | string | undefined;
    const message = typeof reason === 'string' ? reason : (reason?.message ?? 'rejet non traité');
    report('unhandledrejection', message, typeof reason === 'object' ? reason?.stack : undefined);
  });
}
