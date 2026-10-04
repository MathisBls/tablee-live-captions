import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';
import { classNames } from './classNames';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

const variantClasses: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-candle-fill text-on-candle shadow-glow hover:brightness-105',
  quiet: 'bg-table-raised text-linen border-2 border-hairline hover:border-candle',
  danger: 'bg-transparent text-terracotta border-2 border-terracotta hover:bg-terracotta/10',
};

const sizeClasses: Readonly<Record<ButtonSize, string>> = {
  regular: 'min-h-14 px-6 text-xl rounded-2xl gap-3',
  hero: 'min-h-[5.5rem] px-8 py-4 text-[1.75rem] leading-tight rounded-[1.375rem] gap-4',
};

export function Button({
  variant = 'primary',
  size = 'regular',
  icon,
  busy = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy}
      className={classNames(
        'inline-flex items-center justify-center text-center font-bold select-none',
        'transition-[transform,filter,background-color,border-color] duration-200 ease-candle',
        'active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {busy ? <Spinner /> : icon !== undefined && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}
