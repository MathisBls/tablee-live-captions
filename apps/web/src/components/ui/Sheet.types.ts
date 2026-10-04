import type { ReactNode } from 'react';

export interface SheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  /** Libellé du bouton de fermeture, dans la langue de l'interface. */
  readonly closeLabel: string;
  readonly children: ReactNode;
}

export type SheetPanelProps = Omit<SheetProps, 'open'>;
