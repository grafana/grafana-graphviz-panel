import { useEffect, useRef, RefObject } from 'react';
import {
  ZoomTransform,
  IDENTITY_TRANSFORM,
  isIdentityTransform,
  wheelDeltaToZoomFactor,
  zoomAtPoint,
  panBy,
  toCssTransform,
} from '../core/zoomPan';

const DRAG_SUPPRESS_CLICK_THRESHOLD_PX = 4;

export function useZoomPan(svgRef: RefObject<HTMLDivElement | null>, enabled = true, triggerUpdate?: number): void {
  const transformRef = useRef<ZoomTransform>(IDENTITY_TRANSFORM);

  useEffect(() => {
    const container = svgRef.current;
    if (!enabled || !container) {
      return;
    }

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      return;
    }

    const applyTransform = () => {
      const transform = transformRef.current;
      svgElement.style.transformOrigin = '0 0';
      svgElement.style.transform = isIdentityTransform(transform) ? '' : toCssTransform(transform);
    };

    const pointFromEvent = (event: { clientX: number; clientY: number }) => {
      const transform = transformRef.current;
      const svgRect = svgElement.getBoundingClientRect();
      return {
        x: event.clientX - (svgRect.left - transform.translateX),
        y: event.clientY - (svgRect.top - transform.translateY),
      };
    };

    const previousOverflow = container.style.overflow;
    const previousCursor = container.style.cursor;
    container.style.overflow = 'hidden';
    container.style.cursor = 'grab';
    applyTransform();

    let activePointerId: number | null = null;
    let lastPointerPosition = { x: 0, y: 0 };
    let dragDistance = 0;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      transformRef.current = zoomAtPoint(
        transformRef.current,
        pointFromEvent(event),
        wheelDeltaToZoomFactor(event.deltaY)
      );
      applyTransform();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || activePointerId !== null) {
        return;
      }
      activePointerId = event.pointerId;
      lastPointerPosition = { x: event.clientX, y: event.clientY };
      dragDistance = 0;
      container.setPointerCapture(event.pointerId);
      container.style.cursor = 'grabbing';
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - lastPointerPosition.x;
      const deltaY = event.clientY - lastPointerPosition.y;
      lastPointerPosition = { x: event.clientX, y: event.clientY };
      dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
      transformRef.current = panBy(transformRef.current, deltaX, deltaY);
      applyTransform();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) {
        return;
      }
      activePointerId = null;
      container.releasePointerCapture(event.pointerId);
      container.style.cursor = 'grab';
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (dragDistance > DRAG_SUPPRESS_CLICK_THRESHOLD_PX) {
        event.stopPropagation();
        event.preventDefault();
        dragDistance = 0;
      }
    };

    const handleDoubleClick = (event: MouseEvent) => {
      event.preventDefault();
      transformRef.current = IDENTITY_TRANSFORM;
      applyTransform();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);
    container.addEventListener('click', handleClickCapture, { capture: true });
    container.addEventListener('dblclick', handleDoubleClick);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      container.removeEventListener('click', handleClickCapture, { capture: true });
      container.removeEventListener('dblclick', handleDoubleClick);
      container.style.overflow = previousOverflow;
      container.style.cursor = previousCursor;
      svgElement.style.transform = '';
    };
  }, [svgRef, enabled, triggerUpdate]);
}
