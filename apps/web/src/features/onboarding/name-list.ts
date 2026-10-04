import { PERSON_NAME_MAX_LENGTH } from '@tablee/shared';

/**
 * Ajoute les prénoms tapés (séparés par des virgules) à la liste : espaces retirés, doublons
 * ignorés sans tenir compte de la casse, longueur et nombre plafonnés comme côté serveur.
 */
export function addNames(names: readonly string[], typed: string, max: number): readonly string[] {
  const known = new Set(names.map((name) => name.toLocaleLowerCase()));
  const added: string[] = [];
  for (const candidate of typed.split(',')) {
    const name = candidate.trim().slice(0, PERSON_NAME_MAX_LENGTH);
    const key = name.toLocaleLowerCase();
    if (name !== '' && !known.has(key)) {
      known.add(key);
      added.push(name);
    }
  }
  return [...names, ...added].slice(0, max);
}
