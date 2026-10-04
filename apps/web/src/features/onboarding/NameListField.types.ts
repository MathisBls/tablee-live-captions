import type { NameListState } from '@/interfaces/session';

export interface NameListFieldProps {
  readonly label: string;
  readonly hint: string;
  readonly inputLabel: string;
  readonly placeholder?: string;
  readonly addLabel: string;
  readonly removeLabel: (name: string) => string;
  readonly max: number;
  readonly value: NameListState;
  readonly onChange: (value: NameListState) => void;
}
