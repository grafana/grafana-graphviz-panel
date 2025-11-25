import { RefObject } from 'react';
import { parseEdgesFromDot } from '../builderMode';

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface EdgePosition {
  source: string;
  target: string;
  x: number;
  y: number;
  id?: string;
  label?: string;
}

const NODE_ID_PREFIX = 'Node ID: ';
const EDGE_ID_PREFIX = 'Edge ID: ';
const EDGE_ID_SEPARATOR = '__to__';

export function calculateNodePositions(
  svgRef: RefObject<HTMLDivElement>,
  dotDiagram: string,
  menuXRatio: number,
  menuYRatio: number
): NodePosition[] {
  const svgElement = svgRef.current?.querySelector('svg');

  if (!svgElement || !dotDiagram || dotDiagram.trim() === '') {
    return [];
  }

  const titleElements = svgElement.querySelectorAll('g.node title');
  const positions: NodePosition[] = [];

  titleElements.forEach((titleEl) => {
    let nodeId = titleEl.textContent || '';

    if (nodeId.startsWith(NODE_ID_PREFIX)) {
      nodeId = nodeId.substring(NODE_ID_PREFIX.length);
    }

    if (!nodeId) {
      return;
    }

    const nodeGroup = titleEl.parentElement;

    if (!nodeGroup) {
      return;
    }

    try {
      const bbox = (nodeGroup as unknown as SVGGraphicsElement).getBBox();
      const ctm = (nodeGroup as unknown as SVGGraphicsElement).getScreenCTM();

      if (!ctm) {
        return;
      }

      const svgPoint = svgElement.createSVGPoint();
      svgPoint.x = bbox.x;
      svgPoint.y = bbox.y;
      const screenTopLeft = svgPoint.matrixTransform(ctm);

      svgPoint.x = bbox.x + bbox.width;
      svgPoint.y = bbox.y + bbox.height;
      const screenBottomRight = svgPoint.matrixTransform(ctm);

      const containerRect = svgRef.current!.getBoundingClientRect();

      const nodeWidth = screenBottomRight.x - screenTopLeft.x;
      const nodeHeight = screenBottomRight.y - screenTopLeft.y;
      const menuX = screenTopLeft.x + nodeWidth * menuXRatio - containerRect.left;
      const menuY = screenTopLeft.y + nodeHeight * menuYRatio - containerRect.top;
      const centerX = menuX - nodeWidth * menuXRatio + nodeWidth / 2;
      const centerY = menuY - nodeHeight * menuYRatio + nodeHeight / 2;

      positions.push({
        id: nodeId,
        x: menuX,
        y: menuY,
        width: nodeWidth,
        height: nodeHeight,
        centerX,
        centerY,
      });
    } catch (error) {
      console.error(`[svgPositionCalculator] Error calculating position for node ${nodeId}:`, error);
    }
  });

  return positions;
}

export function calculateEdgePositions(svgRef: RefObject<HTMLDivElement>, dotDiagram: string): EdgePosition[] {
  const svgElement = svgRef.current?.querySelector('svg');

  if (!svgElement || !dotDiagram || dotDiagram.trim() === '') {
    return [];
  }

  const edgeTitleElements = svgElement.querySelectorAll('g.edge title');
  const edgePositions: EdgePosition[] = [];
  const edgesData = parseEdgesFromDot(dotDiagram);

  edgeTitleElements.forEach((titleEl) => {
    const titleText = titleEl.textContent || '';

    let source: string;
    let target: string;

    if (titleText.startsWith(EDGE_ID_PREFIX)) {
      const edgeId = titleText.substring(EDGE_ID_PREFIX.length);
      const parts = edgeId.split(EDGE_ID_SEPARATOR);
      if (parts.length !== 2) {
        return;
      }
      [source, target] = parts;
    } else {
      const parts = titleText.split('->').map((p) => p.trim());
      if (parts.length !== 2) {
        return;
      }
      [source, target] = parts;
    }

    const edgeGroup = titleEl.parentElement;

    if (!edgeGroup) {
      return;
    }

    try {
      const pathElement = edgeGroup.querySelector('path');
      if (!pathElement) {
        return;
      }

      const pathLength = pathElement.getTotalLength();
      const midPoint = pathElement.getPointAtLength(pathLength / 2);

      const ctm = (edgeGroup as unknown as SVGGraphicsElement).getScreenCTM();
      if (!ctm) {
        return;
      }

      const svgPoint = svgElement.createSVGPoint();
      svgPoint.x = midPoint.x;
      svgPoint.y = midPoint.y;
      const screenPoint = svgPoint.matrixTransform(ctm);

      const containerRect = svgRef.current!.getBoundingClientRect();
      const edgeData = edgesData.find((e) => e.source === source && e.target === target);

      edgePositions.push({
        source,
        target,
        x: screenPoint.x - containerRect.left,
        y: screenPoint.y - containerRect.top,
        id: edgeData?.id,
        label: edgeData?.label,
      });
    } catch (error) {
      console.error(`[svgPositionCalculator] Error calculating position for edge ${source}->${target}:`, error);
    }
  });

  return edgePositions;
}
