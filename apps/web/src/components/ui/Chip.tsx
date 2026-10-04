import type { ChipProps } from './Chip.types';
import { classNames } from './classNames';
import { Icon } from './Icon';

export function Chip({
  selected,
  trailingIcon,
  type = 'button',
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-pressed={selected}
      className={classNames(
        'inline-flex min-h-14 items-center gap-2 rounded-full border-2 px-5 text-xl font-bold',
        'transition-colors duration-200 ease-candle active:scale-[0.97]',
        selected === true
          ? 'border-candle-fill bg-candle-fill text-on-candle'
          : 'border-hairline bg-table-raised text-linen hover:border-candle',
        trailingIcon !== undefined && 'pe-3',
        className,
      )}
    >
      <span>{children}</span>
      {trailingIcon !== undefined && <Icon name={trailingIcon} className="size-6 opacity-80" />}
    </button>
  );
}
