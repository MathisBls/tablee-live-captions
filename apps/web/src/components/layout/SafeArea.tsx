import { classNames } from '@/components/ui/classNames';
import type { SafeAreaProps } from './SafeArea.types';

/** Conteneur de page : marges généreuses, encoches et barres système respectées. */
export function SafeArea({ className, children, ...rest }: SafeAreaProps) {
  return (
    <main
      {...rest}
      className={classNames(
        'min-h-dvh pt-[max(1.5rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))]',
        'pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))]',
        'md:pt-[max(2rem,env(safe-area-inset-top))] md:pr-[max(2.5rem,env(safe-area-inset-right))]',
        'md:pb-[max(2rem,env(safe-area-inset-bottom))] md:pl-[max(2.5rem,env(safe-area-inset-left))]',
        className,
      )}
    >
      {children}
    </main>
  );
}
