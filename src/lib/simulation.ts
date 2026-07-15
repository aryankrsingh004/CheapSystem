/**
 * ─── Recursive Simulation Engine ──────────────────────────────────────────────
 *
 * For each node, recursively walks its incoming edges back to source nodes
 * (clients) to compute total traffic arriving at that node.
 *
 * Traffic distribution uses independent percentages per edge:
 * - Each edge has a `pct` (0-100) stored in edge.data
 * - Traffic through an edge = sourceQps × (pct / 100)
 * - Percentages are independent — they don't need to sum to 100%
 */

import type { Node, Edge } from '@xyflow/react';
import type { ComponentType, ComponentConfig } from '@/types/simulator';

// ─── SimNodeData ──────────────────────────────────────────────────────────────

export interface SimNodeData extends Record<string, unknown> {
  componentType: ComponentType;
  config: ComponentConfig;
  /** Computed incoming QPS — filled in by the recursive engine */
  incomingQps?: number;
}

// ─── Edge percentage helpers ──────────────────────────────────────────────────

/** Get the percentage of an edge (defaults to 100) */
export function getEdgePct(edge: Edge): number {
  return (edge.data as Record<string, unknown>)?.pct as number ?? 100;
}

// ─── Recursive traffic calculator ─────────────────────────────────────────────

// ─── Recursive traffic calculator (Iterative Fixed-Point solver for robust cycle support) ──────────────────

export function computeAllTraffic(
  nodes: Node<SimNodeData>[],
  edges: Edge[],
): Map<string, number> {
  const currentQps = new Map<string, number>();

  // 1. Initialize all nodes to 0 QPS (except sources)
  const isCronActive = Math.floor(Date.now() / 1000) % 2 === 0;
  for (const node of nodes) {
    if (node.data?.componentType === 'client') {
      const config = node.data.config;
      currentQps.set(node.id, (config?.qpsLimit ?? 0) * (config?.replicas ?? 1));
    } else if (node.data?.componentType === 'cronJob') {
      const config = node.data.config;
      currentQps.set(node.id, isCronActive ? (config?.qpsLimit ?? 0) : 0);
    } else {
      currentQps.set(node.id, 0);
    }
  }

  // 2. Iterate to propagate traffic (fixed-point iteration / relaxation)
  const ITERATIONS = 20;
  for (let iter = 0; iter < ITERATIONS; iter++) {
    const nextQps = new Map<string, number>();

    for (const node of nodes) {
      const { componentType, config } = node.data ?? {};
      if (componentType === 'client') {
        nextQps.set(node.id, (config?.qpsLimit ?? 0) * (config?.replicas ?? 1));
        continue;
      }
      if (componentType === 'cronJob') {
        nextQps.set(node.id, isCronActive ? (config?.qpsLimit ?? 0) : 0);
        continue;
      }

      // Find all incoming edges
      const incomingEdges = edges.filter((e) => e.target === node.id);
      let totalQps = 0;

      for (const edge of incomingEdges) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (!sourceNode) continue;

        const sourceQps = currentQps.get(edge.source) ?? 0;
        let pct = getEdgePct(edge);

        // Load balancer override
        if (sourceNode.data?.componentType === 'loadBalancer') {
          const outgoingFromSource = edges.filter((e) => e.source === edge.source);
          pct = outgoingFromSource.length > 0 ? 100 / outgoingFromSource.length : 0;
        }

        let edgeTraffic = sourceQps * (pct / 100);

        // CDN reduction
        if (sourceNode.data?.componentType === 'cdn') {
          const reduction = sourceNode.data.config?.reduction ?? 80;
          edgeTraffic *= (1 - (reduction / 100));
        }

        // Async queue logic
        if (sourceNode.data?.componentType === 'asyncQueue') {
          const targetCap = (node.data?.config?.qpsLimit ?? 5000) * (node.data?.config?.replicas ?? 1);
          const bufferLevel = Number(sourceNode.data.bufferLevel ?? 0);
          if (bufferLevel > 0) {
            edgeTraffic = targetCap;
          } else {
            edgeTraffic = sourceQps * (pct / 100);
          }
        }

        totalQps += edgeTraffic;
      }

      nextQps.set(node.id, totalQps);
    }

    // Check convergence: if nothing changed, we can break early
    let converged = true;
    for (const [id, val] of nextQps.entries()) {
      const prevVal = currentQps.get(id) ?? 0;
      if (Math.abs(val - prevVal) > 0.1) {
        converged = false;
        break;
      }
    }

    // Update current QPS
    for (const [id, val] of nextQps.entries()) {
      currentQps.set(id, val);
    }

    if (converged) {
      break;
    }
  }

  return currentQps;
}
