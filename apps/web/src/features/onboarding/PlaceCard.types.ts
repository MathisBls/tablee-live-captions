export interface PlaceCardProps {
  readonly brand: string;
  readonly name: string;
  readonly emptyName: string;
  /** Phrase déjà formatée (« à table avec Paul, Inès et Lou »), ou null s'il n'y a pas de convives. */
  readonly guestsLine: string | null;
  readonly className?: string;
}
