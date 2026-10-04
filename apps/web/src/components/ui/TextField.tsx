import { useId } from 'react';
import { classNames } from './classNames';
import type { TextFieldProps } from './TextField.types';

export function TextField({
  label,
  hint,
  error = null,
  hideLabel = false,
  className,
  type = 'text',
  ...rest
}: TextFieldProps) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const describedBy = [hint === undefined ? null : hintId, error === null ? null : errorId]
    .filter((id) => id !== null)
    .join(' ');

  return (
    <div className={classNames('flex flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        className={classNames('text-xl font-bold text-linen', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        type={type}
        aria-invalid={error !== null}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        className={classNames(
          'min-h-16 w-full rounded-2xl border-2 bg-table-deep px-5 text-2xl text-linen',
          'placeholder:text-linen-muted/70 transition-colors duration-200 ease-candle',
          'focus-visible:border-candle focus-visible:outline-none',
          error === null ? 'border-hairline' : 'border-terracotta',
        )}
      />
      {hint !== undefined && (
        <p id={hintId} className="text-lg text-linen-muted">
          {hint}
        </p>
      )}
      {error !== null && (
        <p id={errorId} className="text-lg font-bold text-terracotta">
          {error}
        </p>
      )}
    </div>
  );
}
