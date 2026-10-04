import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';
import type { SheetPanelProps, SheetProps } from './Sheet.types';

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function keepFocusInside(event: KeyboardEvent, container: HTMLElement): void {
  const focusables = [...container.querySelectorAll<HTMLElement>(focusableSelector)];
  const first = focusables[0];
  const last = focusables.at(-1);
  if (first === undefined || last === undefined) {
    event.preventDefault();
    return;
  }
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function SheetPanel({ onClose, title, description, closeLabel, children }: SheetPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const requestClose = useEffectEvent(onClose);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    panel?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      } else if (event.key === 'Tab' && panel !== null) {
        keepFocusInside(event, panel);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        role="presentation"
        className="absolute inset-0 animate-fade-in bg-table-deep/75 high-contrast:bg-table"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        tabIndex={-1}
        className="relative flex max-h-[90dvh] w-full max-w-4xl animate-sheet-rise flex-col overflow-y-auto rounded-t-[2rem] border-2 border-b-0 border-hairline bg-table-raised px-6 pt-4 pb-10 shadow-[0_-30px_80px_-30px_#000] outline-none sm:px-10"
      >
        <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-hairline" />
        <header className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="font-serif text-4xl font-semibold text-linen sm:text-5xl">
              {title}
            </h2>
            {description !== undefined && (
              <p id={descriptionId} className="text-xl text-linen-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton icon="close" label={closeLabel} showLabel onClick={onClose} />
        </header>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/** Feuille modale qui monte du bas de l'écran. Échap, le bouton ou un clic à côté la ferment. */
export function Sheet({ open, ...panelProps }: SheetProps) {
  if (!open) {
    return null;
  }
  return createPortal(<SheetPanel {...panelProps} />, document.body);
}
