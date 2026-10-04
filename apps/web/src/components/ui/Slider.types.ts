export interface SliderProps {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
  /** Valeur lisible annoncée et affichée (« Très grand » plutôt que « 3 »). */
  readonly valueText: string;
  readonly className?: string;
}
