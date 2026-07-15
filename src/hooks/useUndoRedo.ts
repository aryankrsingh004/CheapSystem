import { useState, useCallback } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initialPresent: T, maxHistory = 50) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  // Updates the live state without saving history (e.g. for drag events)
  const setPresent = useCallback((updater: T | ((prev: T) => T)) => {
    setState((curr) => ({
      ...curr,
      present: typeof updater === 'function' ? (updater as Function)(curr.present) : updater,
    }));
  }, []);

  // Takes a snapshot of the current state and adds it to history
  const takeSnapshot = useCallback(() => {
    setState((curr) => {
      // Deep clone to ensure immutability
      const snap = structuredClone(curr.present);
      const newPast = [...curr.past, snap];
      
      // Limit history length
      if (newPast.length > maxHistory) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: curr.present,
        future: [], // Clear future on new action
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setState((curr) => {
      if (curr.past.length === 0) return curr;

      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, -1);
      const currentSnap = structuredClone(curr.present);

      return {
        past: newPast,
        present: previous,
        future: [currentSnap, ...curr.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((curr) => {
      if (curr.future.length === 0) return curr;

      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      const currentSnap = structuredClone(curr.present);

      return {
        past: [...curr.past, currentSnap],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setState((curr) => ({
      past: [],
      present: curr.present,
      future: [],
    }));
  }, []);

  return {
    present: state.present,
    setPresent,
    takeSnapshot,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    clearHistory,
  };
}
