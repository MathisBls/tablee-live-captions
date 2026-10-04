import { Card } from '@/components/ui/Card';
import { classNames } from '@/components/ui/classNames';
import type { PlaceCardProps } from './PlaceCard.types';

/** Carton de placement qui s'écrit pendant la saisie : il double le formulaire, donc reste muet. */
export function PlaceCard({ brand, name, emptyName, guestsLine, className }: PlaceCardProps) {
  const trimmed = name.trim();

  return (
    <div aria-hidden="true" className={classNames('relative isolate', className)}>
      <div className="absolute -inset-20 -z-10 rounded-full bg-[radial-gradient(closest-side,#f2a93b2e,transparent)] high-contrast:hidden midday:opacity-60" />
      <Card
        variant="paper"
        className="place-fold flex min-h-64 -rotate-2 flex-col items-center px-8 pt-5 pb-9 text-center md:min-h-80 md:px-12"
      >
        <p className="eyebrow text-ink-muted">{brand}</p>
        <p
          className={classNames(
            'mt-auto w-full font-serif text-[clamp(2.75rem,7vw,4.75rem)] leading-[1.02] font-medium italic font-wonk [overflow-wrap:anywhere]',
            trimmed === '' ? 'text-ink-muted/60' : 'text-ink',
          )}
        >
          {trimmed === '' ? emptyName : trimmed}
        </p>
        <span className="mt-5 h-0.5 w-20 rounded-full bg-card-edge" />
        <p className="mt-4 min-h-7 text-lg text-ink-muted">{guestsLine}</p>
      </Card>
    </div>
  );
}
