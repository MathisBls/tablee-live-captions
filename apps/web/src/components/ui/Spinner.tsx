import { classNames } from './classNames';
import type { SpinnerProps } from './Spinner.types';

const emberDelays = ['0ms', '200ms', '400ms'] as const;

/** Trois braises qui s'allument tour à tour. */
export function Spinner({ label, className }: SpinnerProps) {
  const embers = (
    <span className={classNames('inline-flex items-center gap-1.5', className)} aria-hidden="true">
      {emberDelays.map((delay) => (
        <span
          key={delay}
          className="size-2.5 animate-ember rounded-full bg-current"
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );

  if (label === undefined) {
    return embers;
  }

  return (
    <span role="status" className="inline-flex items-center">
      {embers}
      <span className="sr-only">{label}</span>
    </span>
  );
}
