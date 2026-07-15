/**
 * ─── CanvasToolbar ────────────────────────────────────────────────────────────
 *
 * Top-center floating bar: Draw / Run mode toggle + Text annotation tool.
 */

import { Pen, Play, Type, Square } from 'lucide-react';

interface CanvasToolbarProps {
  appMode: 'draw' | 'simulate';
  onSetMode: (mode: 'draw' | 'simulate') => void;
  textMode: boolean;
  onToggleTextMode: () => void;
  frameMode: boolean;
  onToggleFrameMode: () => void;
  selectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export function CanvasToolbar({ 
  appMode, 
  onSetMode, 
  textMode, 
  onToggleTextMode,
  frameMode,
  onToggleFrameMode,
  selectionMode,
  onToggleSelectionMode
}: CanvasToolbarProps) {
  const isTouch = typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);

  return (
    <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-3">
      {/* Premium Large Mode Toggle */}
      <div className="flex items-center rounded-xl border border-white/10 bg-[hsl(220_14%_10%)]/95 backdrop-blur-xl p-1 shadow-2xl">
        <button
          id="canvas-draw-mode-btn"
          onClick={() => onSetMode('draw')}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2 rounded-[10px] text-[13px] font-black tracking-wide transition-all duration-300 ${
            appMode === 'draw' 
              ? 'bg-white text-[hsl(220_14%_10%)] shadow-md scale-[1.02]' 
              : 'text-white/40 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Pen size={14} strokeWidth={2.5} />
          <span className="hidden sm:inline">DRAW</span>
        </button>
        <button
          id="canvas-run-mode-btn"
          onClick={() => onSetMode('simulate')}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2 rounded-[10px] text-[13px] font-black tracking-wide transition-all duration-300 ${
            appMode === 'simulate'
              ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-[1.02]'
              : 'text-white/40 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Play size={14} strokeWidth={2.5} fill={appMode === 'simulate' ? 'currentColor' : 'none'} />
          <span className="hidden sm:inline">RUN</span>
        </button>
      </div>

      {/* Text tool — visible in both modes */}
      <button
        id="canvas-text-tool-btn"
        title={textMode ? 'Click on the canvas to place a text box (Esc to cancel)' : 'Add text annotation'}
        onClick={onToggleTextMode}
        className={`flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 rounded-xl text-[13px] font-black tracking-wide border transition-all duration-300 shadow-xl backdrop-blur-xl ${
          textMode
            ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] scale-[1.02]'
            : 'bg-[hsl(220_14%_10%)]/95 border-white/10 text-white/50 hover:text-white/90 hover:bg-white/5'
        }`}
      >
        <Type size={14} strokeWidth={2.5} />
        <span className="hidden sm:inline">{textMode ? 'PLACING…' : 'TEXT'}</span>
      </button>

      {/* Frame tool — visible in both modes */}
      <button
        id="canvas-frame-tool-btn"
        title={frameMode ? 'Click on the canvas to place a frame/group box (Esc to cancel)' : 'Add frame/group'}
        onClick={onToggleFrameMode}
        className={`flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 rounded-xl text-[13px] font-black tracking-wide border transition-all duration-300 shadow-xl backdrop-blur-xl ${
          frameMode
            ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] scale-[1.02]'
            : 'bg-[hsl(220_14%_10%)]/95 border-white/10 text-white/50 hover:text-white/90 hover:bg-white/5'
        }`}
      >
        <Square size={14} strokeWidth={2.5} />
        <span className="hidden sm:inline">{frameMode ? 'PLACING…' : 'FRAME'}</span>
      </button>

      {/* Selection Tool — draw mode only, touch devices only */}
      {appMode === 'draw' && onToggleSelectionMode && isTouch && (
        <button
          id="canvas-select-tool-btn"
          title={selectionMode ? 'Click and drag to select multiple nodes (Esc to cancel)' : 'Multi-select tool'}
          onClick={onToggleSelectionMode}
          className={`flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 rounded-xl text-[13px] font-black tracking-wide border transition-all duration-300 shadow-xl backdrop-blur-xl ${
            selectionMode
              ? 'bg-violet-500 border-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-[1.02]'
              : 'bg-[hsl(220_14%_10%)]/95 border-white/10 text-white/50 hover:text-white/90 hover:bg-white/5'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h18v18H3zM3 9h18M9 3v18" strokeDasharray="4 4" />
          </svg>
          <span className="hidden sm:inline">SELECT</span>
        </button>
      )}
    </div>
  );
}
