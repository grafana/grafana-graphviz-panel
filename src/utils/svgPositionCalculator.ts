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

/**
 * Graphviz uses a coordinate system where 1 unit = 1 inch = 72 points.
 * SVG uses points as the default unit, so we need to convert.
 */
const POINTS_PER_INCH = 72;

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

/**
 * Converts container-relative coordinates to Graphviz coordinate space.
 *
 * Graphviz coordinate system:
 * - Origin at bottom-left (Y increases upward)
 * - Units in inches (1 inch = 72 points)
 *
 * Browser/SVG coordinate system:
 * - Origin at top-left (Y increases downward)
 * - Units in points/pixels
 *
 * This function is primarily used for delta calculations in drag operations.
 *
 * @param containerRelativeX - X coordinate relative to container element
 * @param containerRelativeY - Y coordinate relative to container element
 * @param svgElement - The SVG element containing the graph
 * @returns Coordinates in Graphviz space (inches, Y-inverted)
 */
export function browserToGraphvizCoordinates(
  containerRelativeX: number,
  containerRelativeY: number,
  svgElement: SVGSVGElement
): { x: number; y: number } {
  const svgRect = svgElement.getBoundingClientRect();
  const viewBox = svgElement.viewBox.baseVal;

  if (!viewBox || viewBox.width === 0 || viewBox.height === 0) {
    return { x: 0, y: 0 };
  }

  const containerRect = svgElement.parentElement?.getBoundingClientRect();
  if (!containerRect) {
    return { x: 0, y: 0 };
  }

  const svgRelativeX = containerRelativeX + (containerRect.left - svgRect.left);
  const svgRelativeY = containerRelativeY + (containerRect.top - svgRect.top);

  const scaleX = viewBox.width / svgRect.width;
  const scaleY = viewBox.height / svgRect.height;

  const svgX = svgRelativeX * scaleX;
  const svgY = svgRelativeY * scaleY;

  const graphvizX = svgX / POINTS_PER_INCH;
  const graphvizY = -svgY / POINTS_PER_INCH;

  return { x: graphvizX, y: graphvizY };
}

/**
 * Calculates the delta in Graphviz coordinates from a mouse movement.
 * Converts the zero point to account for coordinate system offsets.
 *
 * @param startPosition - Starting mouse position (container-relative)
 * @param endPosition - Ending mouse position (container-relative)
 * @param svgElement - The SVG element containing the graph
 * @returns Delta in Graphviz coordinate space
 */
export function calculateGraphvizDelta(
  startPosition: { x: number; y: number },
  endPosition: { x: number; y: number },
  svgElement: SVGSVGElement
): { x: number; y: number } {
  const deltaX = endPosition.x - startPosition.x;
  const deltaY = endPosition.y - startPosition.y;

  const deltaSvg = browserToGraphvizCoordinates(deltaX, deltaY, svgElement);
  const zeroOffset = browserToGraphvizCoordinates(0, 0, svgElement);

  return {
    x: deltaSvg.x - zeroOffset.x,
    y: deltaSvg.y - zeroOffset.y,
  };
}

export function graphvizToBrowserCoordinates(
  graphvizX: number,
  graphvizY: number,
  svgElement: SVGSVGElement
): { x: number; y: number } {
  const viewBox = svgElement.viewBox.baseVal;
  const hasViewBox = viewBox.width > 0 && viewBox.height > 0;

  let svgHeight: number;
  let svgX: number;
  let svgY: number;

  if (hasViewBox) {
    svgHeight = viewBox.height;
  } else {
    svgHeight = svgElement.height.baseVal.value || svgElement.clientHeight;
  }

  svgX = graphvizX;
  svgY = svgHeight - graphvizY;

  if (hasViewBox) {
    const rect = svgElement.getBoundingClientRect();
    const scaleX = rect.width / viewBox.width;
    const scaleY = rect.height / viewBox.height;

    const browserX = (svgX - viewBox.x) * scaleX;
    const browserY = (svgY - viewBox.y) * scaleY;

    return { x: browserX, y: browserY };
  }

  return { x: svgX, y: svgY };
}
