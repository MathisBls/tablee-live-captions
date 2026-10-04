import { useEffect } from 'react';

/**
 * Empêche l'écran de s'éteindre pendant le repas. Le navigateur relâche le verrou quand l'onglet
 * passe en arrière-plan : on le redemande à chaque retour au premier plan.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) {
      return undefined;
    }
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const request = async (): Promise<void> => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (disposed) {
          await lock.release();
        } else {
          sentinel = lock;
        }
      } catch {
        // Refusé (économie d'énergie, onglet caché) : l'écran suivra simplement sa mise en veille.
        sentinel = null;
      }
    };
    const handleVisibility = (): void => {
      void request();
    };

    void request();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      void sentinel?.release();
    };
  }, [active]);
}
