import { useEffect, useState, RefObject } from 'react';
import * as d3 from 'd3-selection';

export interface HoverState {
  type: 'node' | 'edge' | null;
  id: string | null;
  position: { x: number; y: number };
  isPinned: boolean;
}

export interface UseNodeEdgeHoverResult {
  hoverState: HoverState;
  clearPinned: () => void;
}

export function useNodeEdgeHover(
  svgRef: RefObject<HTMLDivElement | null>,
  enabled = true,
  triggerUpdate?: any
): UseNodeEdgeHoverResult {
  const [hoverState, setHoverState] = useState<HoverState>({
    type: null,
    id: null,
    position: { x: 0, y: 0 },
    isPinned: false,
  });

  const clearPinned = () => {
    setHoverState({
      type: null,
      id: null,
      position: { x: 0, y: 0 },
      isPinned: false,
    });
  };

  useEffect(() => {
    if (!enabled || !svgRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current).select('svg');

    if (svg.empty()) {
      return;
    }

    svg.selectAll('g.node').on('mouseenter', null).on('mouseleave', null).on('click', null);
    svg.selectAll('g.edge').on('mouseenter', null).on('mouseleave', null).on('click', null);

    svg.selectAll('g.node').on('mouseenter', function (event) {
      const nodeGroup = d3.select(this);
      const nodeId = nodeGroup.attr('id');

      if (!nodeId) {
        return;
      }

      setHoverState((current) => {
        if (current.isPinned) {
          return current;
        }
        return {
          type: 'node',
          id: nodeId,
          position: { x: event.clientX, y: event.clientY },
          isPinned: false,
        };
      });
    });

    svg.selectAll('g.node').on('mouseleave', function () {
      setHoverState((current) => {
        if (current.isPinned) {
          return current;
        }
        return { type: null, id: null, position: { x: 0, y: 0 }, isPinned: false };
      });
    });

    svg.selectAll('g.node').on('click', function (event) {
      const nodeGroup = d3.select(this);
      const nodeId = nodeGroup.attr('id');

      if (!nodeId) {
        return;
      }

      event.stopPropagation();
      setHoverState((current) => {
        if (current.isPinned && current.id === nodeId) {
          return { type: null, id: null, position: { x: 0, y: 0 }, isPinned: false };
        }
        return {
          type: 'node',
          id: nodeId,
          position: { x: event.clientX, y: event.clientY },
          isPinned: true,
        };
      });
    });

    svg.selectAll('g.edge').on('mouseenter', function (event) {
      const edgeGroup = d3.select(this);
      const edgeId = edgeGroup.attr('id');

      if (!edgeId) {
        return;
      }

      setHoverState((current) => {
        if (current.isPinned) {
          return current;
        }
        return {
          type: 'edge',
          id: edgeId,
          position: { x: event.clientX, y: event.clientY },
          isPinned: false,
        };
      });
    });

    svg.selectAll('g.edge').on('mouseleave', function () {
      setHoverState((current) => {
        if (current.isPinned) {
          return current;
        }
        return { type: null, id: null, position: { x: 0, y: 0 }, isPinned: false };
      });
    });

    svg.selectAll('g.edge').on('click', function (event) {
      const edgeGroup = d3.select(this);
      const edgeId = edgeGroup.attr('id');

      if (!edgeId) {
        return;
      }

      event.stopPropagation();
      setHoverState((current) => {
        if (current.isPinned && current.id === edgeId) {
          return { type: null, id: null, position: { x: 0, y: 0 }, isPinned: false };
        }
        return {
          type: 'edge',
          id: edgeId,
          position: { x: event.clientX, y: event.clientY },
          isPinned: true,
        };
      });
    });

    return () => {
      if (!svg.empty()) {
        svg.selectAll('g.node').on('mouseenter', null).on('mouseleave', null).on('click', null);
        svg.selectAll('g.edge').on('mouseenter', null).on('mouseleave', null).on('click', null);
      }
    };
  }, [svgRef, enabled, triggerUpdate]);

  return { hoverState, clearPinned };
}
