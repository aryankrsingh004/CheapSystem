/**
 * ─── SimulatorCanvas ──────────────────────────────────────────────────────────
 *
 * The ReactFlow canvas wrapper — responsible only for rendering the graph.
 * All data (displayNodes, displayEdges) and event handlers flow in as props.
 */

import { forwardRef, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  PanOnScrollMode,
  SelectionMode,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SimNode } from '@/components/SimNode';
import { SimEdge } from '@/components/SimEdge';
import { TextNode } from '@/components/TextNode';
import { FrameNode } from '@/components/FrameNode';
import { BEHAVIORS } from '@/lib/behaviors';
import { type SimNodeData } from '@/lib/simulation';

// Stable references — defined once outside any component
const nodeTypes = { simNode: SimNode, textNode: TextNode, frameNode: FrameNode };
const edgeTypes = { simEdge: SimEdge };

interface SimulatorCanvasProps {
  displayNodes: Node<any>[];
  displayEdges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (e: React.MouseEvent, node: Node) => void;
  onNodeDragStart: () => void;
  onPaneClick: (e: React.MouseEvent) => void;
  onInit: () => void;
  onMoveEnd: (_: unknown, viewport: { x: number; y: number; zoom: number }) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  forceSelection: boolean;
}

export const SimulatorCanvas = forwardRef<HTMLDivElement, SimulatorCanvasProps>(
  (
    {
      displayNodes,
      displayEdges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onNodeClick,
      onNodeDragStart,
      onPaneClick,
      onInit,
      onMoveEnd,
      onDrop,
      onDragOver,
      forceSelection,
    },
    ref,
  ) => {
    const [isTouchInteraction, setIsTouchInteraction] = useState(false);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      // If the pointer is touch or pen, treat as touch interaction
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        setIsTouchInteraction(true);
      } else {
        setIsTouchInteraction(false);
      }
    };

    return (
      <div 
        ref={ref} 
        className="flex-1 relative" 
        onDrop={onDrop} 
        onDragOver={onDragOver}
        onPointerDownCapture={handlePointerDown}
      >
        {forceSelection && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none animate-in slide-in-from-top-2">
            Selection Mode Active
          </div>
        )}
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStart={onNodeDragStart}
          onPaneClick={onPaneClick}
          onInit={onInit}
          onMoveEnd={onMoveEnd}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          panOnScroll={true}
          panOnScrollMode={PanOnScrollMode.Free}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={true}
          selectionOnDrag={forceSelection || !isTouchInteraction}
          selectionMode={SelectionMode.Partial}
          panOnDrag={forceSelection ? false : (isTouchInteraction ? true : [1, 2])}
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Control"
          preventScrolling={true}
          fitView
          fitViewOptions={{ padding: 1.2, minZoom: 0.1, maxZoom: 0.8 }}
          minZoom={0.05}
          maxZoom={4}
          defaultEdgeOptions={{
            type: 'simEdge',
            markerEnd: { type: MarkerType.Arrow, width: 30, height: 12, color: '#334155' },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const node = n as Node<SimNodeData>;
              return BEHAVIORS[node.data?.componentType]?.meta.color ?? '#334155';
            }}
            maskColor="rgba(0,0,0,0.4)"
            style={{
              width: typeof window !== 'undefined' && window.innerWidth < 640 ? 100 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 140 : 180,
              height: typeof window !== 'undefined' && window.innerWidth < 640 ? 65 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 90 : 120,
            }}
            className="!hidden sm:!block"
          />
        </ReactFlow>
      </div>
    );
  },
);

SimulatorCanvas.displayName = 'SimulatorCanvas';
