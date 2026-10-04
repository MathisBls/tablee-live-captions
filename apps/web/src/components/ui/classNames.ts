/** Assemble des classes CSS en ignorant les valeurs vides : `classNames('a', isOn && 'b')`. */
export function classNames(...classes: readonly (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
