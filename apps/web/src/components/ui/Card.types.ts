import type { ComponentProps } from 'react';

/** `paper` : le carton crème des éléments signature. `raised` : une surface posée sur la nappe. */
export type CardVariant = 'paper' | 'raised';

export interface CardProps extends ComponentProps<'div'> {
  readonly variant?: CardVariant;
}
