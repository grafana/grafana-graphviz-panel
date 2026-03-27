import { addStyleToCommaList } from './color';

describe('overrides/color', () => {
  describe('addStyleToCommaList', () => {
    const testCases = [
      {
        name: 'should add style to empty string',
        existingStyle: '',
        newStyle: 'filled',
        expected: 'filled',
      },
      {
        name: 'should add style to null',
        existingStyle: null,
        newStyle: 'filled',
        expected: 'filled',
      },
      {
        name: 'should add style to existing single style',
        existingStyle: 'rounded',
        newStyle: 'filled',
        expected: 'rounded,filled',
      },
      {
        name: 'should add style to existing comma-separated styles',
        existingStyle: 'rounded,bold',
        newStyle: 'filled',
        expected: 'rounded,bold,filled',
      },
      {
        name: 'should not duplicate style if already present',
        existingStyle: 'rounded,filled',
        newStyle: 'filled',
        expected: 'rounded,filled',
      },
      {
        name: 'should not duplicate style if only style',
        existingStyle: 'filled',
        newStyle: 'filled',
        expected: 'filled',
      },
      {
        name: 'should detect style as substring (prevents adding "round" when "rounded" exists)',
        existingStyle: 'rounded',
        newStyle: 'round',
        expected: 'rounded',
      },
      {
        name: 'should detect style anywhere in comma list',
        existingStyle: 'rounded,filled,bold',
        newStyle: 'filled',
        expected: 'rounded,filled,bold',
      },
    ];

    testCases.forEach(({ name, existingStyle, newStyle, expected }) => {
      it(name, () => {
        expect(addStyleToCommaList(existingStyle, newStyle)).toBe(expected);
      });
    });
  });
});
