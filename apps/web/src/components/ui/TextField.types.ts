import type { ComponentProps } from 'react';

export interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  readonly label: string;
  readonly hint?: string;
  /** Message d'erreur affiché sous le champ, qui devient `aria-invalid`. */
  readonly error?: string | null;
  /** Masque visuellement le libellé quand le contexte le donne déjà (il reste lu). */
  readonly hideLabel?: boolean;
}
