/**
 * ─── UndoRedoControls ─────────────────────────────────────────────────────────
 *
 * The undo / redo button pair shown at the bottom-left of the canvas,
 * next to the ReactFlow zoom controls.
 */

import { Undo2, Redo2 } from 'lucide-react';

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function UndoRedoControls({ canUndo, canRedo, onUndo, onRedo }: UndoRedoControlsProps) {
  return (
    <div className="absolute bottom-4 left-[68px] z-20 flex items-center gap-1 p-0.5 rounded-lg bg-[hsl(220_14%_12%)]/80 backdrop-blur-xl border border-white/10 shadow-2xl">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-1.5 rounded transition-all ${canUndo ? 'text-white/70 hover:text-white hover:bg-white/5 active:scale-90' : 'text-white/10 cursor-not-allowed'}`}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={14} />
      </button>
      <div className="w-px h-3 bg-white/10 mx-0.5" />
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-1.5 rounded transition-all ${canRedo ? 'text-white/70 hover:text-white hover:bg-white/5 active:scale-90' : 'text-white/10 cursor-not-allowed'}`}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={14} />
      </button>
    </div>
  );
}
