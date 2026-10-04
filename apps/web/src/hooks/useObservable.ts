import type { Observable } from 'rxjs';
import { useEffect, useState } from 'react';

/**
 * Dernière valeur émise par un Observable. Abonnement au montage (ou quand la source change),
 * désabonnement au démontage : aucun composant ne s'abonne à la main.
 */
export function useObservable<T>(source$: Observable<T>, initial: T): T {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const subscription = source$.subscribe({
      next: (next) => {
        setValue(() => next);
      },
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [source$]);

  return value;
}
