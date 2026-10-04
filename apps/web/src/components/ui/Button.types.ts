import type { ComponentProps } from 'react';
import type { IconName } from './Icon.types';

export type ButtonVariant = 'primary' | 'quiet' | 'danger';

/** `hero` : le grand bouton d'action principal (≥ 72 px de haut). */
export type ButtonSize = 'regular' | 'hero';

export interface ButtonProps extends ComponentProps<'button'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: IconName;
  /** Action en cours : le bouton est désactivé et affiche un indicateur. */
  readonly busy?: boolean;
}
