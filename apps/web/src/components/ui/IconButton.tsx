import { classNames } from './classNames';
import { Icon } from './Icon';
import type { IconButtonProps } from './IconButton.types';

export function IconButton({
  icon,
  label,
  showLabel = false,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={showLabel ? undefined : label}
      className={classNames(
        'inline-flex min-h-14 min-w-14 items-center justify-center gap-3 rounded-2xl',
        'border-2 border-transparent text-linen-muted transition-colors duration-200 ease-candle',
        'hover:border-hairline hover:text-linen active:scale-[0.97]',
        showLabel && 'px-4 text-xl font-bold',
        className,
      )}
    >
      <Icon name={icon} />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
