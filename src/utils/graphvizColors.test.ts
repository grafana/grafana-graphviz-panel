import { isDefaultColor } from './graphvizColors';

describe('graphvizColors', () => {
  describe('isDefaultColor', () => {
    it('should return true for null', () => {
      expect(isDefaultColor(null)).toBe(true);
    });

    it('should return true for black', () => {
      expect(isDefaultColor('black')).toBe(true);
    });

    it('should return true for BLACK (case insensitive)', () => {
      expect(isDefaultColor('BLACK')).toBe(true);
    });

    it('should return true for white', () => {
      expect(isDefaultColor('white')).toBe(true);
    });

    it('should return true for none', () => {
      expect(isDefaultColor('none')).toBe(true);
    });

    it('should return true for #000000', () => {
      expect(isDefaultColor('#000000')).toBe(true);
    });

    it('should return true for #ffffff', () => {
      expect(isDefaultColor('#ffffff')).toBe(true);
    });

    it('should return true for #FFFFFF (uppercase)', () => {
      expect(isDefaultColor('#FFFFFF')).toBe(true);
    });

    it('should return false for custom color red', () => {
      expect(isDefaultColor('red')).toBe(false);
    });

    it('should return false for hex color #ff0000', () => {
      expect(isDefaultColor('#ff0000')).toBe(false);
    });

    it('should return false for rgb color', () => {
      expect(isDefaultColor('rgb(255, 0, 0)')).toBe(false);
    });

    it('should return false for custom color names', () => {
      expect(isDefaultColor('blue')).toBe(false);
      expect(isDefaultColor('green')).toBe(false);
      expect(isDefaultColor('yellow')).toBe(false);
    });
  });
});
