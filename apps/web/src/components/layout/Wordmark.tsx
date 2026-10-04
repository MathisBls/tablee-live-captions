import { classNames } from '@/components/ui/classNames';
import { FLAME_CORE_PATH, FLAME_OUTER_PATH } from './flame-paths';
import type { WordmarkProps } from './Wordmark.types';

export function Wordmark({ name, className }: WordmarkProps) {
  return (
    <span className={classNames('inline-flex items-end gap-2 text-linen', className)}>
      <svg viewBox="0 0 40 56" aria-hidden="true" focusable="false" className="h-[1.1em] w-auto">
        <path d={FLAME_OUTER_PATH} className="fill-candle-fill" />
        <path d={FLAME_CORE_PATH} className="fill-table opacity-60" />
      </svg>
      <span className="font-serif font-semibold italic font-wonk leading-none">{name}</span>
    </span>
  );
}
