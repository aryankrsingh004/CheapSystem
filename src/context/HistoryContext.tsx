import { createContext, useContext, ReactNode } from 'react';

interface HistoryContextType {
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

export function HistoryProvider({ children, value }: { children: ReactNode; value: HistoryContextType }) {
  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
