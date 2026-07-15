/**
 * ─── useCanvasPersistence ────────────────────────────────────────────────────
 *
 * Handles all localStorage read/write for the canvas.
 *   - Loads initial nodes + edges from storage (or returns empty state)
 *   - Provides `onInit` to restore the saved viewport
 *   - Auto-saves nodes + edges (debounced 300 ms) on every change
 *   - Saves viewport on pan / zoom end via `onMoveEnd`
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import { syncNodeIdCounter } from '@/lib/nodeIds';

const STORAGE_KEY = 'sim_canvas_v1';

export type PersistedState = { nodes: Node<any>[]; edges: Edge[] };

/** Call once at module level — returns the initial nodes/edges from localStorage. */
export function loadPersistedCanvas(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { nodes: [], edges: [] };
    const parsed = JSON.parse(raw);

    const parsedNodes: Node<any>[] = parsed.nodes ?? [];
    const initialNodes = parsedNodes
      .filter((n) => n.type === 'simNode' || n.type === 'textNode' || n.type === 'frameNode')
      .map((n) =>
        n.type === 'textNode'
          ? { ...n, style: { overflow: 'visible', background: 'transparent', border: 'none', ...n.style } }
          : n,
      );

    syncNodeIdCounter(initialNodes);
    return { nodes: initialNodes, edges: parsed.edges ?? [] };
  } catch {
    return { nodes: [], edges: [] };
  }
}

interface UseCanvasPersistenceOptions {
  nodes: Node<any>[];
  edges: Edge[];
}

export function useCanvasPersistence({ nodes, edges }: UseCanvasPersistenceOptions) {
  const { setViewport } = useReactFlow();

  // Restore viewport once ReactFlow is mounted
  const onInit = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { viewport } = JSON.parse(raw);
        if (viewport) setViewport(viewport, { duration: 0 });
      }
    } catch { /* ignore */ }
  }, [setViewport]);

  // Auto-save nodes + edges (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, nodes, edges }));
        syncNodeIdCounter(nodes);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  // Save viewport on pan / zoom end
  const onMoveEnd = useCallback((_: unknown, viewport: { x: number; y: number; zoom: number }) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, viewport }));
    } catch { /* ignore */ }
  }, []);

  return { onInit, onMoveEnd };
}

/** Helpers for save-to-file and import-from-file (used by ActionsMenu). */
export function useCanvasFileIO(
  nodes: Node<any>[],
  edges: Edge[],
  setNodes: (n: Node<any>[]) => void,
  setEdges: (e: Edge[]) => void,
  takeSnapshot: () => void,
  onDone: () => void,
) {
  const { getViewport, setViewport } = useReactFlow();

  const handleSave = useCallback(() => {
    try {
      const data = { nodes, edges, viewport: getViewport(), version: '1.0' };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `architecture-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      onDone();
    } catch (err) {
      console.error('Failed to save architecture:', err);
      alert('Failed to save file.');
    }
  }, [nodes, edges, getViewport, onDone]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fileInputRef: React.RefObject<HTMLInputElement | null>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          const data = JSON.parse(content);
          if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
            throw new Error('Invalid file format');
          }
          takeSnapshot();
          setNodes(data.nodes);
          setEdges(data.edges);
          if (data.viewport) setViewport(data.viewport, { duration: 800 });
          onDone();
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
          console.error('Failed to import architecture:', err);
          alert('Invalid or corrupted architecture file.');
        }
      };
      reader.readAsText(file);
    },
    [takeSnapshot, setNodes, setEdges, setViewport, onDone],
  );

  return { handleSave, handleImport };
}
