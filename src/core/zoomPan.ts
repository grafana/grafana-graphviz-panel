export interface ZoomTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface ZoomLimits {
  minScale: number;
  maxScale: number;
}

export const IDENTITY_TRANSFORM: ZoomTransform = { scale: 1, translateX: 0, translateY: 0 };

export const DEFAULT_ZOOM_LIMITS: ZoomLimits = { minScale: 0.25, maxScale: 10 };

const WHEEL_ZOOM_SENSITIVITY = 0.002;

export function isIdentityTransform(transform: ZoomTransform): boolean {
  return transform.scale === 1 && transform.translateX === 0 && transform.translateY === 0;
}

export function clampScale(scale: number, limits: ZoomLimits = DEFAULT_ZOOM_LIMITS): number {
  return Math.min(limits.maxScale, Math.max(limits.minScale, scale));
}

export function wheelDeltaToZoomFactor(deltaY: number): number {
  return Math.pow(2, -deltaY * WHEEL_ZOOM_SENSITIVITY);
}

export function zoomAtPoint(
  transform: ZoomTransform,
  point: { x: number; y: number },
  zoomFactor: number,
  limits: ZoomLimits = DEFAULT_ZOOM_LIMITS
): ZoomTransform {
  const targetScale = clampScale(transform.scale * zoomFactor, limits);
  const appliedFactor = targetScale / transform.scale;

  return {
    scale: targetScale,
    translateX: point.x - (point.x - transform.translateX) * appliedFactor,
    translateY: point.y - (point.y - transform.translateY) * appliedFactor,
  };
}

export function panBy(transform: ZoomTransform, deltaX: number, deltaY: number): ZoomTransform {
  return {
    scale: transform.scale,
    translateX: transform.translateX + deltaX,
    translateY: transform.translateY + deltaY,
  };
}

export function toCssTransform(transform: ZoomTransform): string {
  return `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`;
}
