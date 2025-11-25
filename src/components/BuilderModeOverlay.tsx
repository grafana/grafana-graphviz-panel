import React, { RefObject, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Button, ConfirmModal, Box, Dropdown, Menu, useTheme2 } from '@grafana/ui';
import {
  deleteNodeFromDot,
  deleteEdgeFromDot,
  addNodeToDot,
  addEdgeToDot,
  updateNodeInDot,
  updateEdgeInDot,
  parseNodesFromDot,
  parseEdgesFromDot,
  getExistingEdgeIds,
  isDirectedGraph,
} from '../builderMode';
import { NodeFormModal } from './NodeFormModal';
import { EdgeFormModal } from './EdgeFormModal';
import { NodeEditModal } from './NodeEditModal';
import { EdgeEditModal } from './EdgeEditModal';
import { useConfirmation } from '../hooks/useConfirmation';
import { useDragEdge } from '../hooks/useDragEdge';
import {
  calculateNodePositions,
  calculateEdgePositions,
  NodePosition,
  EdgePosition,
} from '../utils/svgPositionCalculator';

const MENU_POSITION_X_RATIO = 0.75;
const MENU_POSITION_Y_RATIO = 0.25;
const POSITION_CALCULATION_DELAY_MS = 100;
const MENU_FADE_DURATION_S = 0.15;
const DRAG_LINE_STROKE_WIDTH = 2;
const DRAG_OVERLAY_Z_INDEX = 1000;

const BUTTON_CONTAINER_STYLE: React.CSSProperties = {
  pointerEvents: 'auto',
  transform: 'translate(-50%, -50%)',
};

export interface BuilderModeOverlayProps {
  svgRef: RefObject<HTMLDivElement>;
  dotDiagram: string;
  onChange: (newDotDiagram: string) => void;
  onClearTriggers?: () => void;
  addNodeTrigger?: number;
  addEdgeTrigger?: number;
}

export const BuilderModeOverlay: React.FC<BuilderModeOverlayProps> = ({
  svgRef,
  dotDiagram,
  onChange,
  onClearTriggers,
  addNodeTrigger,
  addEdgeTrigger,
}) => {
  const theme = useTheme2();
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [edgePositions, setEdgePositions] = useState<EdgePosition[]>([]);

  const dotDiagramRef = useRef(dotDiagram);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    dotDiagramRef.current = dotDiagram;
    onChangeRef.current = onChange;
  }, [dotDiagram, onChange]);

  const nodeDeleteConfirmation = useConfirmation<string>((nodeId) => {
    const newDot = deleteNodeFromDot(dotDiagramRef.current, nodeId);
    onChangeRef.current(newDot);
  });

  const edgeDeleteConfirmation = useConfirmation<{ source: string; target: string }>((edge) => {
    const newDot = deleteEdgeFromDot(dotDiagramRef.current, edge.source, edge.target);
    onChangeRef.current(newDot);
  });

  const { dragState, startDrag, updateDragPosition, endDrag, cancelDrag } = useDragEdge();

  const [showNodeForm, setShowNodeForm] = useState(false);
  const [showEdgeForm, setShowEdgeForm] = useState(false);
  const [edgeSourceNodeId, setEdgeSourceNodeId] = useState<string | null>(null);
  const [edgeTargetNodeId, setEdgeTargetNodeId] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<{ id: string; label?: string; shape?: string } | null>(null);

  const [showEdgeEditModal, setShowEdgeEditModal] = useState(false);
  const [edgeToEdit, setEdgeToEdit] = useState<{ source: string; target: string; id?: string; label?: string } | null>(
    null
  );

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeKey, setHoveredEdgeKey] = useState<string | null>(null);

  useEffect(() => {
    if (addNodeTrigger) {
      setShowNodeForm(true);
      onClearTriggers?.();
    }
  }, [addNodeTrigger, onClearTriggers]);

  useEffect(() => {
    if (addEdgeTrigger) {
      setEdgeSourceNodeId(null);
      setShowEdgeForm(true);
      onClearTriggers?.();
    }
  }, [addEdgeTrigger, onClearTriggers]);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const updatePositions = () => {
      const nodes = calculateNodePositions(svgRef, dotDiagram, MENU_POSITION_X_RATIO, MENU_POSITION_Y_RATIO);
      const edges = calculateEdgePositions(svgRef, dotDiagram);
      setNodePositions(nodes);
      setEdgePositions(edges);
    };

    const timeoutId = setTimeout(updatePositions, POSITION_CALCULATION_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [svgRef, dotDiagram]);

  const handleNodeFormSubmit = (id: string, label?: string, shape?: string) => {
    const newDot = addNodeToDot(dotDiagram, { id, label, shape });
    onChange(newDot);
    setShowNodeForm(false);
  };

  const handleNodeFormCancel = () => {
    setShowNodeForm(false);
  };

  const handleEdgeFormSubmit = (sourceNodeId: string, targetNodeId: string, edgeId?: string, edgeLabel?: string) => {
    const newDot = addEdgeToDot(dotDiagram, {
      source: sourceNodeId,
      target: targetNodeId,
      id: edgeId,
      label: edgeLabel,
    });
    onChange(newDot);

    setShowEdgeForm(false);
    setEdgeSourceNodeId(null);
    setEdgeTargetNodeId(null);
  };

  const handleEdgeFormCancel = () => {
    setShowEdgeForm(false);
    setEdgeSourceNodeId(null);
    setEdgeTargetNodeId(null);
  };

  const handleEditNodeClick = useCallback((nodeId: string) => {
    const nodes = parseNodesFromDot(dotDiagramRef.current);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setNodeToEdit(node);
      setShowEditModal(true);
    }
  }, []);

  const handleEditNodeSubmit = useCallback(
    (label?: string, shape?: string) => {
      if (nodeToEdit) {
        const newDot = updateNodeInDot(dotDiagramRef.current, nodeToEdit.id, { label, shape });
        onChangeRef.current(newDot);
      }
      setShowEditModal(false);
      setNodeToEdit(null);
    },
    [nodeToEdit]
  );

  const handleEditNodeCancel = () => {
    setShowEditModal(false);
    setNodeToEdit(null);
  };

  const handleEditEdgeClick = useCallback((source: string, target: string) => {
    const edges = parseEdgesFromDot(dotDiagramRef.current);
    const edge = edges.find((e) => e.source === source && e.target === target);
    if (edge) {
      setEdgeToEdit(edge);
      setShowEdgeEditModal(true);
    }
  }, []);

  const handleDeleteNodeClick = useCallback(
    (nodeId: string) => {
      nodeDeleteConfirmation.request(nodeId);
    },
    [nodeDeleteConfirmation]
  );

  const handleDeleteEdgeClick = useCallback(
    (source: string, target: string) => {
      edgeDeleteConfirmation.request({ source, target });
    },
    [edgeDeleteConfirmation]
  );

  const handleEditEdgeSubmit = useCallback(
    (id?: string, label?: string) => {
      if (edgeToEdit) {
        const newDot = updateEdgeInDot(dotDiagramRef.current, edgeToEdit.source, edgeToEdit.target, { id, label });
        onChangeRef.current(newDot);
      }
      setShowEdgeEditModal(false);
      setEdgeToEdit(null);
    },
    [edgeToEdit]
  );

  const handleEditEdgeCancel = () => {
    setShowEdgeEditModal(false);
    setEdgeToEdit(null);
  };

  const handleDragIconMouseDown = useCallback(
    (nodeId: string, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const containerRect = svgRef.current?.getBoundingClientRect();
      if (!containerRect) {
        return;
      }

      const position = {
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
      };

      startDrag(nodeId, position);
    },
    [svgRef, startDrag]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!dragState.isDragging) {
        return;
      }

      const containerRect = svgRef.current?.getBoundingClientRect();
      if (!containerRect) {
        return;
      }

      const position = {
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
      };

      const hoveredNode = nodePositions.find((node) => {
        const dx = position.x - node.centerX;
        const dy = position.y - node.centerY;
        const isInsideNodeBounds = Math.abs(dx) <= node.width / 2 && Math.abs(dy) <= node.height / 2;
        const isNotSourceNode = node.id !== dragState.sourceNodeId;
        return isInsideNodeBounds && isNotSourceNode;
      });

      let targetNodeId = hoveredNode?.id || null;

      const hasValidDragContext = hoveredNode && dragState.sourceNodeId;
      if (hasValidDragContext) {
        const edges = parseEdgesFromDot(dotDiagramRef.current);
        const isExistingEdge = edges.some(
          (edge) => edge.source === dragState.sourceNodeId && edge.target === hoveredNode.id
        );
        if (isExistingEdge) {
          targetNodeId = null;
        }
      }

      updateDragPosition(position, targetNodeId);
    },
    [dragState.isDragging, dragState.sourceNodeId, svgRef, nodePositions, updateDragPosition]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging) {
      return;
    }

    const { sourceNodeId, targetNodeId } = endDrag();

    if (sourceNodeId && targetNodeId && sourceNodeId !== targetNodeId) {
      setEdgeSourceNodeId(sourceNodeId);
      setEdgeTargetNodeId(targetNodeId);
      setShowEdgeForm(true);
    }
  }, [dragState.isDragging, endDrag]);

  useEffect(() => {
    if (!dragState.isDragging) {
      return;
    }

    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) {
        cancelDrag();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragState.isDragging, cancelDrag]);

  const existingNodeIds = useMemo(() => parseNodesFromDot(dotDiagram).map((node) => node.id), [dotDiagram]);
  const existingEdgeIds = useMemo(() => getExistingEdgeIds(dotDiagram), [dotDiagram]);
  const isDirected = useMemo(() => isDirectedGraph(dotDiagram), [dotDiagram]);

  const sourceNodePos = nodePositions.find((n) => n.id === dragState.sourceNodeId);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: dragState.isDragging ? 'auto' : 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {dragState.isDragging && sourceNodePos && dragState.currentPosition && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: DRAG_OVERLAY_Z_INDEX,
          }}
        >
          <defs>
            <marker
              id="drag-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M0,0 L0,6 L9,3 z"
                fill={dragState.targetNodeId ? theme.colors.text.primary : theme.colors.text.disabled}
              />
            </marker>
          </defs>
          <line
            x1={sourceNodePos.centerX}
            y1={sourceNodePos.centerY}
            x2={dragState.currentPosition.x}
            y2={dragState.currentPosition.y}
            stroke={dragState.targetNodeId ? theme.colors.text.primary : theme.colors.text.disabled}
            strokeWidth={DRAG_LINE_STROKE_WIDTH}
            strokeDasharray={dragState.targetNodeId ? undefined : '2,2'}
            markerEnd={isDirected ? 'url(#drag-arrow)' : undefined}
          />
        </svg>
      )}

      {nodePositions.map((pos) => {
        const isTargetCandidate = dragState.isDragging && dragState.sourceNodeId !== pos.id;
        const isHoveredTarget = isTargetCandidate && dragState.targetNodeId === pos.id;

        return (
          <React.Fragment key={pos.id}>
            <div
              style={{
                position: 'absolute',
                left: pos.centerX - pos.width / 2,
                top: pos.centerY - pos.height / 2,
                width: pos.width,
                height: pos.height,
                pointerEvents: 'auto',
              }}
              onMouseEnter={() => setHoveredNodeId(pos.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            />

            {hoveredNodeId === pos.id && !dragState.isDragging && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.centerX,
                  top: pos.centerY,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={() => setHoveredNodeId(pos.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                <Box backgroundColor="canvas" padding={0.5} borderRadius="default" boxShadow="z1">
                  <div onMouseDown={(e) => handleDragIconMouseDown(pos.id, e)}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="upload"
                      aria-label={`Drag to create edge from ${pos.id}`}
                      title="Drag to create edge"
                    />
                  </div>
                </Box>
              </div>
            )}

            {!dragState.isDragging && (
              <div
                style={{
                  ...BUTTON_CONTAINER_STYLE,
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  opacity: hoveredNodeId === pos.id ? 1 : 0,
                  transition: `opacity ${MENU_FADE_DURATION_S}s ease-in-out`,
                }}
                onMouseEnter={() => setHoveredNodeId(pos.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                <Box
                  backgroundColor="canvas"
                  padding={0.5}
                  borderRadius="default"
                  boxShadow="z1"
                  display="flex"
                  gap={0.5}
                >
                  <Dropdown
                    key={`node-dropdown-${pos.id}-${dotDiagram.length}`}
                    overlay={
                      <Menu>
                        <Menu.Item
                          label="Edit node"
                          description="Update label and shape"
                          icon="pen"
                          onClick={() => handleEditNodeClick(pos.id)}
                        />
                        <Menu.Divider />
                        <Menu.Item
                          label="Delete node"
                          description="Remove node and edges"
                          icon="trash-alt"
                          destructive
                          onClick={() => handleDeleteNodeClick(pos.id)}
                        />
                      </Menu>
                    }
                  >
                    <Button variant="secondary" size="sm" icon="ellipsis-v" aria-label={`Node ${pos.id} actions`} />
                  </Dropdown>
                </Box>
              </div>
            )}

            {isHoveredTarget && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.centerX,
                  top: pos.centerY,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <Box backgroundColor="canvas" padding={0.5} borderRadius="default" boxShadow="z1">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="download-alt"
                    aria-label={`Drop to connect to ${pos.id}`}
                  />
                </Box>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {edgePositions.map((edge) => {
        const edgeKey = `${edge.source}-${edge.target}`;
        return (
          <div
            key={edgeKey}
            style={{
              ...BUTTON_CONTAINER_STYLE,
              position: 'absolute',
              left: edge.x,
              top: edge.y,
              opacity: hoveredEdgeKey === edgeKey ? 1 : 0,
              transition: `opacity ${MENU_FADE_DURATION_S}s ease-in-out`,
            }}
            onMouseEnter={() => setHoveredEdgeKey(edgeKey)}
            onMouseLeave={() => setHoveredEdgeKey(null)}
          >
            <Box backgroundColor="canvas" padding={0.5} borderRadius="default" boxShadow="z1" display="flex">
              <Dropdown
                key={`edge-dropdown-${edge.source}-${edge.target}-${dotDiagram.length}`}
                overlay={
                  <Menu>
                    <Menu.Item
                      label="Edit edge"
                      description="Update label"
                      icon="pen"
                      onClick={() => handleEditEdgeClick(edge.source, edge.target)}
                    />
                    <Menu.Divider />
                    <Menu.Item
                      label="Delete edge"
                      description="Remove connection"
                      icon="trash-alt"
                      destructive
                      onClick={() => handleDeleteEdgeClick(edge.source, edge.target)}
                    />
                  </Menu>
                }
              >
                <Button
                  variant="secondary"
                  size="sm"
                  icon="ellipsis-v"
                  aria-label={`Edge ${edge.source} → ${edge.target} actions`}
                />
              </Dropdown>
            </Box>
          </div>
        );
      })}

      {showNodeForm && (
        <NodeFormModal
          isOpen={showNodeForm}
          existingNodeIds={existingNodeIds}
          onSubmit={handleNodeFormSubmit}
          onDismiss={handleNodeFormCancel}
        />
      )}

      {showEdgeForm && (
        <EdgeFormModal
          isOpen={showEdgeForm}
          sourceNodeId={edgeSourceNodeId}
          targetNodeId={edgeTargetNodeId}
          existingNodeIds={existingNodeIds}
          existingEdgeIds={existingEdgeIds}
          onSubmit={handleEdgeFormSubmit}
          onDismiss={handleEdgeFormCancel}
        />
      )}

      {showEditModal && nodeToEdit && (
        <NodeEditModal
          isOpen={showEditModal}
          nodeId={nodeToEdit.id}
          currentLabel={nodeToEdit.label}
          currentShape={nodeToEdit.shape}
          onSubmit={handleEditNodeSubmit}
          onDismiss={handleEditNodeCancel}
        />
      )}

      {showEdgeEditModal && edgeToEdit && (
        <EdgeEditModal
          isOpen={showEdgeEditModal}
          sourceNodeId={edgeToEdit.source}
          targetNodeId={edgeToEdit.target}
          currentId={edgeToEdit.id}
          currentLabel={edgeToEdit.label}
          onSubmit={handleEditEdgeSubmit}
          onDismiss={handleEditEdgeCancel}
        />
      )}

      {nodeDeleteConfirmation.isOpen && nodeDeleteConfirmation.itemToConfirm && (
        <ConfirmModal
          isOpen={nodeDeleteConfirmation.isOpen}
          title="Delete Node"
          body={`Are you sure you want to delete node "${nodeDeleteConfirmation.itemToConfirm}"? All connected edges will also be removed.`}
          confirmText="Delete"
          onConfirm={nodeDeleteConfirmation.confirm}
          onDismiss={nodeDeleteConfirmation.cancel}
        />
      )}

      {edgeDeleteConfirmation.isOpen && edgeDeleteConfirmation.itemToConfirm && (
        <ConfirmModal
          isOpen={edgeDeleteConfirmation.isOpen}
          title="Delete Edge"
          body={`Are you sure you want to delete the edge from "${edgeDeleteConfirmation.itemToConfirm.source}" to "${edgeDeleteConfirmation.itemToConfirm.target}"?`}
          confirmText="Delete"
          onConfirm={edgeDeleteConfirmation.confirm}
          onDismiss={edgeDeleteConfirmation.cancel}
        />
      )}
    </div>
  );
};
