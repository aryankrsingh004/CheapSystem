/**
 * ─── useCanvasState ───────────────────────────────────────────────────────────
 *
 * Owns the canonical nodes/edges state via useUndoRedo.
 * Provides stable setNodes / setEdges wrappers, plus all mutation helpers
 * (updateNodeConfig, deleteNode, updateEdgePct, updateEdgeOutRate, resetCanvas).
 */

import { useCallback } from 'react';
import { addEdge, type Node, type Edge, type Connection, type NodeChange, type EdgeChange, applyNodeChanges, applyEdgeChanges, MarkerType } from '@xyflow/react';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { BEHAVIORS } from '@/lib/behaviors';
import { type SimNodeData } from '@/lib/simulation';
import { nextNodeId } from '@/lib/nodeIds';
import type { ComponentType } from '@/types/simulator';

export type CanvasState = { nodes: Node<any>[]; edges: Edge[] };

export function useCanvasState(initialState: CanvasState) {
  const {
    present,
    setPresent,
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useUndoRedo<CanvasState>(initialState);

  const { nodes, edges } = present;

  // ── Stable primitive setters ─────────────────────────────────────────────
  const setNodes = useCallback(
    (updater: Node<any>[] | ((prev: Node<any>[]) => Node<any>[])) => {
      setPresent((curr) => ({
        ...curr,
        nodes: typeof updater === 'function' ? updater(curr.nodes) : updater,
      }));
    },
    [setPresent],
  );

  const setEdges = useCallback(
    (updater: Edge[] | ((prev: Edge[]) => Edge[])) => {
      setPresent((curr) => ({
        ...curr,
        edges: typeof updater === 'function' ? updater(curr.edges) : updater,
      }));
    },
    [setPresent],
  );

  // ── ReactFlow change handlers ─────────────────────────────────────────────
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  // ── New connection ────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      takeSnapshot();
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...connection,
            type: 'simEdge',
            data: { pct: 100 },
            markerEnd: { type: MarkerType.Arrow, width: 16, height: 12, color: '#334155' },
          },
          eds,
        );
        const sourceId = connection.source;
        if (sourceId) {
          const outgoing = newEdges.filter((e) => e.source === sourceId);
          const equalPct = Math.round(100 / outgoing.length);
          return newEdges.map((e) =>
            e.source === sourceId
              ? { ...e, data: { ...(e.data as Record<string, unknown> ?? {}), pct: equalPct } }
              : e,
          );
        }
        return newEdges;
      });
    },
    [takeSnapshot, setEdges],
  );

  // ── Node drag start (snapshot for undo) ──────────────────────────────────
  const onNodeDragStart = useCallback(() => takeSnapshot(), [takeSnapshot]);

  // ── Add a sim node at a given canvas position ────────────────────────────
  const addSimNode = useCallback(
    (type: ComponentType, position: { x: number; y: number }) => {
      takeSnapshot();
      const id = nextNodeId();
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: 'simNode',
          position,
          data: { componentType: type, config: { ...BEHAVIORS[type].defaultConfig } },
        },
      ]);
    },
    [takeSnapshot, setNodes],
  );

  // ── Add a text node ──────────────────────────────────────────────────────
  const addTextNode = useCallback(
    (position: { x: number; y: number }) => {
      takeSnapshot();
      const id = nextNodeId();
      setNodes((nds) => [
        ...nds.map(n => ({ ...n, selected: false })),
        {
          id,
          type: 'textNode',
          position,
          selected: true,
          data: {
            text: '',
            fontSize: 14,
            w: 0,
            h: null,
            rotation: 0,
            color: '#e9ecef',
            opacity: 100,
            align: 'left',
            fontFamily: 'sans',
            isWidthFixed: false,
          },
          style: { overflow: 'visible', background: 'transparent', border: 'none' },
        },
      ]);
    },
    [takeSnapshot, setNodes],
  );

  // ── Add a frame node ──────────────────────────────────────────────────────
  const addFrameNode = useCallback(
    (position: { x: number; y: number }) => {
      takeSnapshot();
      const id = nextNodeId();
      setNodes((nds) => [
        ...nds.map(n => ({ ...n, selected: false })),
        {
          id,
          type: 'frameNode',
          position,
          selected: true,
          zIndex: -10,
          data: {
            label: 'Group Frame',
            w: 320,
            h: 220,
            color: '#ffffff',
            borderStyle: 'dashed',
            opacity: 5,
          },
          style: {
            width: 320,
            height: 220,
            overflow: 'visible',
            background: 'transparent',
            border: 'none',
          },
        },
      ]);
    },
    [takeSnapshot, setNodes],
  );

  // ── Update a node's config ───────────────────────────────────────────────
  const updateNodeConfig = useCallback(
    (id: string, patch: Partial<SimNodeData['config']>) => {
      takeSnapshot();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patch } } } : n,
        ),
      );
    },
    [takeSnapshot, setNodes],
  );

  // ── Delete a node + its connected edges ──────────────────────────────────
  const deleteNode = useCallback(
    (id: string, onDeselect: () => void) => {
      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      onDeselect();
    },
    [takeSnapshot, setNodes, setEdges],
  );

  // ── Update edge traffic percentage ───────────────────────────────────────
  const updateEdgePct = useCallback(
    (edgeId: string, pct: number) => {
      takeSnapshot();
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId
            ? { ...e, data: { ...(e.data as Record<string, unknown> ?? {}), pct } }
            : e,
        ),
      );
    },
    [takeSnapshot, setEdges],
  );

  // ── Update edge out-rate ─────────────────────────────────────────────────
  const updateEdgeOutRate = useCallback(
    (edgeId: string, outRate: number) => {
      takeSnapshot();
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId
            ? { ...e, data: { ...(e.data as Record<string, unknown> ?? {}), outRate } }
            : e,
        ),
      );
    },
    [takeSnapshot, setEdges],
  );

  // ── Clear the canvas ─────────────────────────────────────────────────────
  const resetCanvas = useCallback(
    (onDeselect: () => void) => {
      takeSnapshot();
      setNodes([]);
      setEdges([]);
      onDeselect();
      clearHistory();
      try { localStorage.removeItem('sim_canvas_v1'); } catch { /* ignore */ }
    },
    [takeSnapshot, setNodes, setEdges, clearHistory],
  );

  const setNodesAndEdges = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      setPresent({ nodes: newNodes, edges: newEdges });
    },
    [setPresent],
  );

  return {
    // State
    nodes,
    edges,
    // Primitives
    setNodes,
    setEdges,
    setNodesAndEdges,
    // History
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    // ReactFlow handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStart,
    // Mutations
    addSimNode,
    addTextNode,
    addFrameNode,
    updateNodeConfig,
    deleteNode,
    updateEdgePct,
    updateEdgeOutRate,
    resetCanvas,
  };
}
