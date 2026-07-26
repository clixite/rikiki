import { useEffect } from 'react';

/** Garde l'écran allumé pendant la partie (si le navigateur le permet). */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // refusé (économie d'énergie…) — sans gravité
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => undefined);
    };
  }, [active]);
}
