import { useState, useCallback, useEffect, useRef } from 'react';

export interface DragState {
  isDragging: boolean;
  sourceNodeId: string | null;
  currentPosition: { x: number; y: number } | null;
  targetNodeId: string | null;
}

export function useDragEdge() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    sourceNodeId: null,
    currentPosition: null,
    targetNodeId: null,
  });

  const dragStateRef = useRef<DragState>(dragState);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const startDrag = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setDragState({
      isDragging: true,
      sourceNodeId: nodeId,
      currentPosition: position,
      targetNodeId: null,
    });
  }, []);

  const updateDragPosition = useCallback((position: { x: number; y: number }, targetNodeId: string | null = null) => {
    setDragState((prev) => ({
      ...prev,
      currentPosition: position,
      targetNodeId,
    }));
  }, []);

  const endDrag = useCallback(() => {
    const currentState = dragStateRef.current;

    const result = {
      sourceNodeId: currentState.sourceNodeId,
      targetNodeId: currentState.targetNodeId,
    };

    setDragState({
      isDragging: false,
      sourceNodeId: null,
      currentPosition: null,
      targetNodeId: null,
    });

    return result;
  }, []);

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      sourceNodeId: null,
      currentPosition: null,
      targetNodeId: null,
    });
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
