import { useState, useCallback, useEffect, useRef } from 'react';

export interface DragNodeState {
  isDragging: boolean;
  nodeId: string | null;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  offset: { x: number; y: number } | null;
}

const initialState: DragNodeState = {
  isDragging: false,
  nodeId: null,
  startPosition: null,
  currentPosition: null,
  offset: null,
};

/**
 * Hook for managing node drag state with delta-based positioning.
 * Uses ref pattern to avoid stale closures in callbacks.
 */
export function useDragNode() {
  const [dragState, setDragState] = useState<DragNodeState>(initialState);
  const dragStateRef = useRef<DragNodeState>(dragState);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const startDrag = useCallback(
    (nodeId: string, mousePosition: { x: number; y: number }, nodeCenter: { x: number; y: number }) => {
      const offset = {
        x: mousePosition.x - nodeCenter.x,
        y: mousePosition.y - nodeCenter.y,
      };

      setDragState({
        isDragging: true,
        nodeId,
        startPosition: mousePosition,
        currentPosition: mousePosition,
        offset,
      });
    },
    []
  );

  const updateDragPosition = useCallback((position: { x: number; y: number }) => {
    setDragState((prev) => ({
      ...prev,
      currentPosition: position,
    }));
  }, []);

  const endDrag = useCallback((): { nodeId: string | null; position: { x: number; y: number } | null } => {
    const currentState = dragStateRef.current;

    const result = {
      nodeId: currentState.nodeId,
      position: currentState.currentPosition,
    };

    setDragState(initialState);

    return result;
  }, []);

  const cancelDrag = useCallback(() => {
    setDragState(initialState);
  }, []);

  useEffect(() => {
    if (!dragState.isDragging) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelDrag();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [dragState.isDragging, cancelDrag]);

  return {
    dragState,
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
  };
}
