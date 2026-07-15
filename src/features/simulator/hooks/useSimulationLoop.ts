/**
 * ─── useSimulationLoop ────────────────────────────────────────────────────────
 *
 * Drives the real-time simulation:
 *   - 500 ms tick that animates Cron Job and AsyncQueue buffer fill
 *   - Computes the traffic map (QPS per node) via the recursive engine
 *   - Produces `displayNodes` and `displayEdges` (enriched with QPS data)
 *     that are passed directly to ReactFlow
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { type Node, type Edge, MarkerType } from '@xyflow/react';
import { computeAllTraffic, getEdgePct } from '@/lib/simulation';

interface UseSimulationLoopOptions {
  nodes: Node<any>[];
  edges: Edge[];
  appMode: 'draw' | 'simulate';
}

export function useSimulationLoop({ nodes, edges, appMode }: UseSimulationLoopOptions) {
  // ── Async Queue buffer state ─────────────────────────────────────────────
  /** Maps nodeId → accumulated message/request count in the buffer */
  const bufferLevels = useRef<Map<string, number>>(new Map());
  /** Bumped to force displayNodes to re-read the ref */
  const [bufferTick, setBufferTick] = useState(0);

  // Clear buffer when leaving simulate mode
  useEffect(() => {
    if (appMode !== 'simulate') {
      bufferLevels.current.clear();
      setBufferTick(0);
    }
  }, [appMode]);

  // 500 ms ticker (Cron Job, buffer accumulation)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (appMode !== 'simulate') return;
    const interval = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, [appMode]);

  // ── Recursive traffic computation ────────────────────────────────────────
  const trafficMap = useMemo(() => {
    const updatedNodes = (Array.isArray(nodes) ? nodes : []).map((n) => ({
      ...n,
      data: { ...n.data, bufferLevel: bufferLevels.current.get(n.id) ?? 0 },
    }));
    return computeAllTraffic(updatedNodes, Array.isArray(edges) ? edges : []);
  }, [nodes, edges, tick]);

  // ── Buffer accumulation for asyncQueue nodes ─────────────────────────────
  useEffect(() => {
    if (appMode !== 'simulate') return;
    let hasAsyncQueue = false;
    (Array.isArray(nodes) ? nodes : []).forEach((node) => {
      if (node.data?.componentType !== 'asyncQueue') return;
      hasAsyncQueue = true;
      const inQps = trafficMap.get(node.id) ?? 0;
      const outgoingEdges = (Array.isArray(edges) ? edges : []).filter((e) => e.source === node.id);
      const maxOutflow = outgoingEdges.reduce((sum, e) => {
        const targetNode = (Array.isArray(nodes) ? nodes : []).find((tn) => tn.id === e.target);
        const targetCap = (targetNode?.data?.config?.qpsLimit ?? 5000) * (targetNode?.data?.config?.replicas ?? 1);
        return sum + targetCap;
      }, 0);
      const capacity = Math.max(1, (node.data.config.qpsLimit ?? 5000) * (node.data.config.replicas ?? 1) * 100);
      const excess = inQps - maxOutflow;
      const current = bufferLevels.current.get(node.id) ?? 0;
      const updated = Math.max(0, Math.min(capacity, current + excess * 0.5));
      bufferLevels.current.set(node.id, updated);
    });
    if (hasAsyncQueue) setBufferTick((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, appMode, edges]);

  // ── Inject QPS into node data for display ────────────────────────────────
  const displayNodes = useMemo(
    () =>
      (Array.isArray(nodes) ? nodes : []).map((n) => {
        const inQps = trafficMap.get(n.id) ?? 0;
        const isSimMode = appMode === 'simulate';

        if (n.data?.componentType === 'asyncQueue') {
          const outgoingEdges = (Array.isArray(edges) ? edges : []).filter((e) => e.source === n.id);
          const maxOutflow = outgoingEdges.reduce((sum, e) => {
            const targetNode = (Array.isArray(nodes) ? nodes : []).find((tn) => tn.id === e.target);
            const targetCap = (targetNode?.data?.config?.qpsLimit ?? 5000) * (targetNode?.data?.config?.replicas ?? 1);
            return sum + targetCap;
          }, 0);
          const capacity = Math.max(1, (n.data.config.qpsLimit ?? 5000) * (n.data.config.replicas ?? 1) * 100);
          const bufferLevel = bufferLevels.current.get(n.id) ?? 0;
          const fillPct = (bufferLevel / capacity) * 100;
          return {
            ...n,
            data: {
              ...n.data,
              incomingQps: inQps,
              simMode: isSimMode,
              maxOutflow,
              bufferLevel,
              bufferCapacity: capacity,
              bufferFillPct: Math.min(100, fillPct),
              isOverflowing: fillPct >= 100,
            },
          };
        }

        return { ...n, data: { ...n?.data, incomingQps: inQps, simMode: isSimMode } };
      }),
    // bufferTick forces re-read of the ref when buffer levels change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, trafficMap, appMode, edges, bufferTick],
  );

  // ── Inject QPS + bidirectional into edge data ────────────────────────────
  const displayEdges = useMemo(
    () =>
      (Array.isArray(edges) ? edges : []).map((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source);
        const sourceQps = trafficMap.get(e.source) ?? 0;
        const pct = getEdgePct(e);
        let qps = sourceQps * (pct / 100);

        if (sourceNode?.data?.componentType === 'asyncQueue') {
          const targetNode = nodes.find((n) => n.id === e.target);
          const targetCap = (targetNode?.data?.config?.qpsLimit ?? 5000) * (targetNode?.data?.config?.replicas ?? 1);
          const bufferLevel = bufferLevels.current.get(sourceNode.id) ?? 0;
          qps = bufferLevel > 0 ? targetCap : qps;
        }

        const targetNode = nodes.find((n) => n.id === e.target);
        const isBidirectional = targetNode?.data?.componentType === 'cache';
        const isSimMode = appMode === 'simulate';

        return {
          ...e,
          markerEnd: (isSimMode && isBidirectional)
            ? undefined
            : { type: MarkerType.Arrow, width: 16, height: 12, color: isSimMode ? '#334155' : '#ffffff' },
          markerStart: (!isSimMode && isBidirectional)
            ? { type: MarkerType.Arrow, width: 16, height: 12, color: '#ffffff' }
            : undefined,
          data: { ...(e.data as Record<string, unknown> ?? {}), pct, qps, isBidirectional, simMode: isSimMode },
        };
      }),
    [edges, trafficMap, nodes, appMode, bufferTick],
  );

  return { displayNodes, displayEdges, bufferLevels };
}
