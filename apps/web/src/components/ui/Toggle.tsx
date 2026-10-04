import { useId } from 'react';
import { classNames } from './classNames';
import type { ToggleProps } from './Toggle.types';

/** Interrupteur : toute la ligne est cliquable, l'état est dit par le texte et la position. */
export function Toggle({ label, hint, checked, onChange, className }: ToggleProps) {
  const hintId = useId();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={hint === undefined ? undefined : hintId}
      onClick={() => {
        onChange(!checked);
      }}
      className={classNames(
        'flex min-h-16 w-full items-center justify-between gap-6 rounded-2xl px-1 py-2 text-start',
        className,
      )}
    >
      <span className="flex flex-col">
        <span className="text-xl font-bold text-linen">{label}</span>
        {hint !== undefined && (
          <span id={hintId} className="text-lg text-linen-muted">
            {hint}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={classNames(
          'relative inline-flex h-10 w-[4.5rem] shrink-0 items-center rounded-full border-2',
          'transition-colors duration-200 ease-candle',
          checked ? 'border-candle-fill bg-candle-fill' : 'border-hairline bg-table-deep',
        )}
      >
        <span
          className={classNames(
            'absolute size-7 rounded-full transition-transform duration-200 ease-candle',
            checked ? 'translate-x-[2.125rem] bg-on-candle' : 'translate-x-1 bg-linen-muted',
          )}
        />
      </span>
    </button>
  );
}
