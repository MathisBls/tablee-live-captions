import { describe, expect, it } from 'vitest';
import { addNames } from './name-list';

describe('addNames', () => {
  it('adds several comma-separated names at once, trimmed', () => {
    expect(addNames(['Paul'], ' Inès ,  Lou,', 20)).toEqual(['Paul', 'Inès', 'Lou']);
  });

  it('ignores names already in the list, whatever their case', () => {
    expect(addNames(['Paul', 'Inès'], 'paul, INÈS, Jean', 20)).toEqual(['Paul', 'Inès', 'Jean']);
  });

  it('never goes past the maximum number of names', () => {
    expect(addNames(['Paul', 'Inès'], 'Lou, Jean', 3)).toEqual(['Paul', 'Inès', 'Lou']);
  });

  it('cuts names longer than the server accepts', () => {
    const [name] = addNames([], 'A'.repeat(60), 20);
    expect(name).toHaveLength(40);
  });
});
