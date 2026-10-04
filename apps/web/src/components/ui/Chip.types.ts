import type { ComponentProps } from 'react';
import type { IconName } from './Icon.types';

export interface ChipProps extends ComponentProps<'button'> {
  /** Puce sélectionnée dans un groupe de choix (annoncée via `aria-pressed`). */
  readonly selected?: boolean;
  readonly trailingIcon?: IconName;
}
