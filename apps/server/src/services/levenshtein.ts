/** Distance d'édition (insertion, suppression, substitution) entre deux mots courts. */
export const levenshtein = (left: string, right: string): number => {
  let previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const currentRow = [row];
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      currentRow.push(
        Math.min(
          (previousRow[column] ?? Infinity) + 1,
          (currentRow[column - 1] ?? Infinity) + 1,
          (previousRow[column - 1] ?? Infinity) + substitutionCost,
        ),
      );
    }
    previousRow = currentRow;
  }
  return previousRow[right.length] ?? Math.max(left.length, right.length);
};
