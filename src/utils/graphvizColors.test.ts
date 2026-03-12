import { isDefaultColor } from './graphvizColors';

describe('graphvizColors', () => {
  describe('isDefaultColor', () => {
    const testCases = [
      { name: 'should return true for null', input: null, expected: true },
      { name: 'should return true for black (case insensitive)', input: 'black', expected: true },
      { name: 'should return true for white', input: 'white', expected: true },
      { name: 'should return true for none', input: 'none', expected: true },
      { name: 'should return true for #000000', input: '#000000', expected: true },
      { name: 'should return true for #ffffff (case insensitive)', input: '#ffffff', expected: true },
      { name: 'should return false for custom colors', input: 'red', expected: false },
      { name: 'should return false for custom hex', input: '#ff0000', expected: false },
      { name: 'should return false for rgb syntax', input: 'rgb(255, 0, 0)', expected: false },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(isDefaultColor(input)).toBe(expected);
      });
    });
  });
});
