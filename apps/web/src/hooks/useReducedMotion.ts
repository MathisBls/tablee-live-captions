import { useSettings } from './useSettings';

/** Vrai si la personne a demandé moins d'animations, dans Tablée ou dans son système. */
export function useReducedMotion(): boolean {
  return useSettings().reducedMotion;
}
