import type { ComponentProps } from 'react';
import type { IconName } from './Icon.types';

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  readonly icon: IconName;
  /** Nom accessible du bouton, affiché à côté de l'icône si `showLabel` est vrai. */
  readonly label: string;
  readonly showLabel?: boolean;
}
