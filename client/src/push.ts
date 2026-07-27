import { fetchPushPublicKey, removePushSubscription, savePushSubscription } from './api';
import { fr } from './i18n/fr';

/**
 * Notifications « c'est ton tour » (Web Push).
 *
 * Règle d'or : on ne demande JAMAIS la permission au chargement de la page —
 * uniquement sur une action explicite du joueur (interrupteur du profil).
 */

export type PushAvailability =
  /** Tout est disponible : on peut proposer l'interrupteur. */
  | 'ready'
  /** Navigateur sans Web Push (Safari iOS < 16.4, navigateurs anciens…). */
  | 'unsupported'
  /** iOS ≥ 16.4 : le push n'existe que dans l'application installée. */
  | 'needs-install'
  /** L'utilisateur a refusé les notifications : seuls les réglages du navigateur peuvent revenir dessus. */
  | 'denied';

export interface PushState {
  availability: PushAvailability;
  /** Abonnement réellement actif dans ce navigateur. */
  enabled: boolean;
}

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS se présente comme un Mac, mais avec un écran tactile.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Le trio nécessaire : service worker, PushManager et API Notification. */
function hasPushApis(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushAvailability(): PushAvailability {
  if (!hasPushApis()) {
    // Sur iOS, l'API n'apparaît qu'une fois l'app ajoutée à l'écran d'accueil.
    return isIos() && !isStandalone() ? 'needs-install' : 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  return 'ready';
}

/** Attend le service worker sans jamais bloquer l'interface (dev, SW absent…). */
async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(fr.notificationsNoServiceWorker)), 5000),
  );
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

/**
 * Clé publique VAPID (base64url) → format binaire attendu par PushManager.
 * Le tampon est alloué explicitement : `subscribe` attend un `BufferSource`,
 * ce qu'un `Uint8Array` au tampon indéterminé ne satisfait pas.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function toPayload(sub: PushSubscription): { endpoint: string; keys: { p256dh: string; auth: string } } {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
  };
}

/** État réel (et non le souhait de l'utilisateur) des notifications. */
export async function readPushState(): Promise<PushState> {
  const availability = pushAvailability();
  if (availability !== 'ready') return { availability, enabled: false };
  try {
    const registration = await getRegistration();
    const sub = await registration.pushManager.getSubscription();
    return { availability, enabled: sub !== null && Notification.permission === 'granted' };
  } catch {
    return { availability, enabled: false };
  }
}

/**
 * Active les notifications : permission, abonnement PushManager, envoi au
 * serveur. Lève une erreur (message en français) en cas de refus ou d'échec.
 */
export async function enablePush(): Promise<void> {
  if (pushAvailability() === 'needs-install') throw new Error(fr.notificationsNeedsInstall);
  if (!hasPushApis()) throw new Error(fr.notificationsUnsupported);

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(fr.notificationsDenied);

  const registration = await getRegistration();
  const { publicKey } = await fetchPushPublicKey();
  if (!publicKey) throw new Error(fr.notificationsServerOff);
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  let sub = await registration.pushManager.getSubscription();
  if (sub) {
    // Un abonnement créé avec une autre clé VAPID ne recevrait rien : on le refait.
    await sub.unsubscribe().catch(() => undefined);
    sub = null;
  }
  sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });

  await savePushSubscription(toPayload(sub));
}

/** Désactive les notifications : côté serveur puis côté navigateur. */
export async function disablePush(): Promise<void> {
  if (!hasPushApis()) return;
  let endpoint: string | null = null;
  try {
    const registration = await getRegistration();
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => undefined);
    }
  } catch {
    // Service worker indisponible : on coupe au moins côté serveur.
  }
  await removePushSubscription(endpoint);
}
