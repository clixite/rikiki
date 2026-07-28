/**
 * Masquage et signalement de joueurs.
 *
 * Dès lors qu'un joueur peut mettre sa photo, l'App Store exige un moyen de
 * signaler un contenu choquant et de s'en protéger (règle 1.2). Le masquage
 * est local et immédiat : personne n'a à attendre qu'une modération se
 * prononce pour ne plus voir une image. Le signalement, lui, part au serveur
 * pour relecture.
 */

const HIDDEN_KEY = 'rikiki-hidden-players';

function read(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

let hidden = new Set(read());
const listeners = new Set<() => void>();

export function isHidden(playerId: string): boolean {
  return hidden.has(playerId);
}

export function hidePlayer(playerId: string): void {
  hidden = new Set([...hidden, playerId]);
  persist();
}

export function unhidePlayer(playerId: string): void {
  const next = new Set(hidden);
  next.delete(playerId);
  hidden = next;
  persist();
}

function persist(): void {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]));
  } catch {
    // sans stockage, le masquage vaut pour la session
  }
  listeners.forEach((cb) => cb());
}

export function subscribeHidden(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function hiddenSnapshot(): ReadonlySet<string> {
  return hidden;
}
