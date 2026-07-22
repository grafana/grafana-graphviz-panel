import {
  IDENTITY_TRANSFORM,
  DEFAULT_ZOOM_LIMITS,
  isIdentityTransform,
  clampScale,
  wheelDeltaToZoomFactor,
  zoomAtPoint,
  panBy,
  toCssTransform,
} from './zoomPan';

describe('isIdentityTransform', () => {
  it('returns true for the identity transform', () => {
    expect(isIdentityTransform(IDENTITY_TRANSFORM)).toBe(true);
  });

  it('returns false when scaled or translated', () => {
    expect(isIdentityTransform({ scale: 2, translateX: 0, translateY: 0 })).toBe(false);
    expect(isIdentityTransform({ scale: 1, translateX: 5, translateY: 0 })).toBe(false);
  });
});

describe('clampScale', () => {
  it('returns the scale when inside the limits', () => {
    expect(clampScale(2)).toBe(2);
  });

  it('clamps to the minimum scale', () => {
    expect(clampScale(0.01)).toBe(DEFAULT_ZOOM_LIMITS.minScale);
  });

  it('clamps to the maximum scale', () => {
    expect(clampScale(100)).toBe(DEFAULT_ZOOM_LIMITS.maxScale);
  });
});

describe('wheelDeltaToZoomFactor', () => {
  it('zooms in on negative wheel delta', () => {
    expect(wheelDeltaToZoomFactor(-100)).toBeGreaterThan(1);
  });

  it('zooms out on positive wheel delta', () => {
    expect(wheelDeltaToZoomFactor(100)).toBeLessThan(1);
  });

  it('is symmetric for opposite deltas', () => {
    expect(wheelDeltaToZoomFactor(-100) * wheelDeltaToZoomFactor(100)).toBeCloseTo(1);
  });
});

describe('zoomAtPoint', () => {
  it('scales around the given point so the point stays fixed', () => {
    const result = zoomAtPoint(IDENTITY_TRANSFORM, { x: 100, y: 50 }, 2);

    expect(result.scale).toBe(2);
    expect(result.translateX).toBe(-100);
    expect(result.translateY).toBe(-50);
  });

  it('keeps the anchor point stable across successive zooms', () => {
    const point = { x: 40, y: 60 };
    const once = zoomAtPoint(IDENTITY_TRANSFORM, point, 1.5);
    const twice = zoomAtPoint(once, point, 1.5);

    const anchorAfterOnce = { x: point.x * once.scale + once.translateX, y: point.y * once.scale + once.translateY };
    const anchorBefore = { x: point.x, y: point.y };
    const anchorContentCoordinate = {
      x: (anchorBefore.x - IDENTITY_TRANSFORM.translateX) / IDENTITY_TRANSFORM.scale,
      y: (anchorBefore.y - IDENTITY_TRANSFORM.translateY) / IDENTITY_TRANSFORM.scale,
    };
    const anchorAfterTwice = {
      x: anchorContentCoordinate.x * twice.scale + twice.translateX,
      y: anchorContentCoordinate.y * twice.scale + twice.translateY,
    };

    expect(anchorAfterOnce.x).toBeCloseTo(point.x);
    expect(anchorAfterOnce.y).toBeCloseTo(point.y);
    expect(anchorAfterTwice.x).toBeCloseTo(point.x);
    expect(anchorAfterTwice.y).toBeCloseTo(point.y);
  });

  it('respects the scale limits and adjusts translation accordingly', () => {
    const zoomedOut = zoomAtPoint(IDENTITY_TRANSFORM, { x: 10, y: 10 }, 0.001);

    expect(zoomedOut.scale).toBe(DEFAULT_ZOOM_LIMITS.minScale);
    expect(zoomedOut.translateX).toBeCloseTo(10 - 10 * DEFAULT_ZOOM_LIMITS.minScale);
  });

  it('returns an unchanged transform when already at the limit', () => {
    const atMax = { scale: DEFAULT_ZOOM_LIMITS.maxScale, translateX: -20, translateY: -30 };
    const result = zoomAtPoint(atMax, { x: 0, y: 0 }, 4);

    expect(result).toEqual(atMax);
  });
});

describe('panBy', () => {
  it('offsets the translation without changing the scale', () => {
    const result = panBy({ scale: 2, translateX: 10, translateY: 20 }, 5, -8);

    expect(result).toEqual({ scale: 2, translateX: 15, translateY: 12 });
  });
});

describe('toCssTransform', () => {
  it('serializes translation before scale', () => {
    expect(toCssTransform({ scale: 2, translateX: 10, translateY: -4 })).toBe('translate(10px, -4px) scale(2)');
  });
});
