/**
 * ─── Node ID Generator ────────────────────────────────────────────────────────
 *
 * A module-level counter used to generate stable, unique node IDs.
 * Exposed via `nextNodeId()` so it can be imported anywhere without
 * relying on a React ref (which can't be shared across hooks/files).
 *
 * `syncNodeIdCounter` must be called on init and after any persistence
 * restore so the counter stays ahead of existing IDs.
 */

let _counter = 1000;

/** Returns the next unique node ID string (e.g. "node-1001"). */
export function nextNodeId(): string {
  return `node-${++_counter}`;
}

/**
 * Bumps the internal counter to be at least `maxId`.
 * Call this after restoring nodes from localStorage so new IDs
 * never collide with persisted ones.
 */
export function syncNodeIdCounter(nodes: { id: string }[]): void {
  for (const n of nodes) {
    const num = parseInt(n.id.replace('node-', ''), 10);
    if (!isNaN(num) && num > _counter) {
      _counter = num;
    }
  }
}
