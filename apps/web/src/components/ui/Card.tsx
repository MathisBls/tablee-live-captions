import type { CardProps, CardVariant } from './Card.types';
import { classNames } from './classNames';

const variantClasses: Readonly<Record<CardVariant, string>> = {
  paper: 'paper-card rounded-md',
  raised: 'rounded-3xl border-2 border-hairline bg-table-raised text-linen',
};

export function Card({ variant = 'raised', className, children, ...rest }: CardProps) {
  return (
    <div {...rest} className={classNames(variantClasses[variant], className)}>
      {children}
    </div>
  );
}
