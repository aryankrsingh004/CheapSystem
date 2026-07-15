/**
 * ─── AsyncQueueNode ──────────────────────────────────────────────────────────
 *
 * Visual component for the Async/Streaming Queue node.
 * Shows a horizontal buffer fill bar that fills as excess traffic accumulates,
 * with a wave animation and color transitions: cyan → amber → red.
 */

import { Handle, Position } from '@xyflow/react';
import type { SimNodeData } from '@/lib/simulation';
import { formatQps } from '@/lib/utils';

interface AsyncQueueData extends SimNodeData {
  bufferFillPct?: number;
  bufferLevel?: number;
  bufferCapacity?: number;
  maxOutflow?: number;
  isOverflowing?: boolean;
  simMode?: boolean;
}

interface Props {
  data: AsyncQueueData;
  selected?: boolean;
}

const COLOR_CYAN   = '#06b6d4';
const COLOR_AMBER  = '#f59e0b';
const COLOR_RED    = '#ef4444';

function getFillColor(pct: number): string {
  if (pct >= 90) return COLOR_RED;
  if (pct >= 60) return COLOR_AMBER;
  return COLOR_CYAN;
}

export function AsyncQueueNode({ data, selected }: Props) {
  const isSimMode   = data.simMode ?? false;
  const fillPct     = Math.min(100, Math.max(0, data.bufferFillPct ?? 0));
  const inQps       = data.incomingQps ?? 0;
  const maxOutflow  = data.maxOutflow ?? data.config.qpsLimit;
  const capacity    = data.bufferCapacity ?? maxOutflow * 100;
  const label       = data.config.label;
  const isOverflow  = data.isOverflowing ?? false;
  const fillColor   = getFillColor(fillPct);

  // ── Derived states ──
  const isAccumulating = isSimMode && inQps > maxOutflow;
  const isDraining     = isSimMode && inQps < maxOutflow && fillPct > 0;

  // ── Border / shadow ──
  const borderColor = !isSimMode
    ? (selected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)')
    : isOverflow
      ? '#ef4444'
      : selected
        ? 'rgba(56,189,248,0.7)'
        : `${COLOR_CYAN}55`;

  const boxShadow = selected
    ? `0 0 0 1px ${isSimMode ? COLOR_CYAN : '#ffffff'}30, 0 8px 32px rgba(0,0,0,0.6)`
    : isOverflow
      ? `0 0 0 2px rgba(239,68,68,0.3), 0 8px 32px rgba(0,0,0,0.5)`
      : '0 4px 20px rgba(0,0,0,0.4)';

  // ── Slot segments inside the fill bar ──
  const SEGMENTS = 20;

  return (
    <div
      className="relative flex flex-col transition-all duration-300"
      style={{
        width: 190,
        minHeight: 100,
        transform: 'skewX(-12deg)',
        zIndex: selected ? 50 : 1,
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-5 !h-5 !border-2 !bg-slate-950 transition-all duration-200 shadow-lg ${
          isSimMode ? '!border-white/30 hover:!bg-sky-400 hover:!scale-125' : '!border-white/20 hover:!bg-white hover:!scale-125'
        }`}
        style={{ transform: 'translate(-50%, -50%) skewX(12deg)', zIndex: 100, cursor: 'crosshair' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-5 !h-5 !border-2 !bg-slate-950 transition-all duration-200 shadow-lg ${
          isSimMode ? '!border-white/30 hover:!bg-sky-400 hover:!scale-125' : '!border-white/20 hover:!bg-white hover:!scale-125'
        }`}
        style={{ transform: 'translate(50%, -50%) skewX(12deg)', zIndex: 100, cursor: 'crosshair' }}
      />

      <div
        className="relative flex flex-col flex-1 rounded-2xl transition-all duration-300 overflow-hidden"
        style={{
          width: '100%',
          height: '100%',
          background: isSimMode
            ? `linear-gradient(135deg, rgba(6,182,212,0.12), rgba(255,255,255,0.02))`
            : 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(8px)',
          border: `2.5px solid ${borderColor}`,
          boxShadow,
        }}
      >
        {/* ── Overflow shimmer overlay ── */}
        {isOverflow && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, transparent 60%)',
              animation: 'queue-overflow-pulse 1s ease-in-out infinite',
            }}
          />
        )}

      <div className="flex-1 flex flex-col h-full w-full select-none" style={{ transform: 'skewX(12deg)' }}>
        {/* ── Header row ── */}
        {isSimMode && (
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isSimMode && (
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${COLOR_CYAN}18`,
                    border: `1px solid ${COLOR_CYAN}35`,
                  }}
                >
                  {/* Custom layered queue icon */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="9" width="12" height="3" rx="1.5" fill={COLOR_CYAN} opacity="0.5"/>
                    <rect x="1" y="5.5" width="12" height="3" rx="1.5" fill={COLOR_CYAN} opacity="0.7"/>
                    <rect x="1" y="2" width="12" height="3" rx="1.5" fill={COLOR_CYAN}/>
                  </svg>
                </div>
              )}
              <span
                className="transition-all duration-300 text-left font-bold text-white/90 break-words min-w-0 flex-1 leading-tight"
                style={{ fontSize: 12 }}
              >
                {label}
              </span>
            </div>

            {/* Fill percentage badge */}
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all duration-500"
              style={{
                background: `${fillColor}20`,
                border: `1px solid ${fillColor}50`,
                color: fillColor,
              }}
            >
              {isOverflow && <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full opacity-75" style={{ background: fillColor }} />}
              {Math.round(fillPct)}%
            </div>
          </div>
        )}

        {/* ── Buffer fill bar (simulation mode only) ── */}
        {isSimMode && (
          <div className="px-3 pb-1.5">
            {/* Segmented fill bar */}
            <div
              className="relative w-full overflow-hidden"
              style={{
                height: 20,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Fill layer */}
              <div
                className="absolute left-0 top-0 h-full"
                style={{
                  width: `${fillPct}%`,
                  background: `linear-gradient(90deg, ${fillColor}99 0%, ${fillColor}cc 60%, ${fillColor} 100%)`,
                  backgroundSize: '200% 100%',
                  animation: isAccumulating
                    ? 'queue-shimmer 1.2s linear infinite'
                    : isDraining
                      ? 'queue-shimmer-slow 3s linear infinite'
                      : undefined,
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease',
                  borderRadius: '5px 0 0 5px',
                }}
              />

              {/* Segment dividers */}
              {Array.from({ length: SEGMENTS - 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full pointer-events-none"
                  style={{
                    left: `${((i + 1) / SEGMENTS) * 100}%`,
                    width: 1,
                    background: 'rgba(0,0,0,0.25)',
                  }}
                />
              ))}

              {/* Quarter markers (thicker) */}
              {[25, 50, 75].map((pct) => (
                <div
                  key={pct}
                  className="absolute top-0 h-full pointer-events-none"
                  style={{
                    left: `${pct}%`,
                    width: 1.5,
                    background: 'rgba(0,0,0,0.4)',
                  }}
                />
              ))}

              {/* FULL label when overflowing */}
              {isOverflow && (
                <div
                  className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tracking-widest"
                  style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.8)', zIndex: 10 }}
                >
                  ⚠ OVERFLOW
                </div>
              )}
            </div>

            {/* Capacity label + exact requests count */}
            <div className="flex justify-between mt-0.5 text-[9px] font-mono">
              <span className="text-white/20">0</span>
              <span className="font-bold tracking-wider" style={{ color: fillColor }}>
                {Math.round(data.bufferLevel ?? 0).toLocaleString()} reqs
              </span>
              <span className="text-white/20">{formatQps(capacity)}</span>
            </div>
          </div>
        )}



        {/* Draw mode: just show label centered */}
        {!isSimMode && (
          <div className="flex-1 flex items-center justify-center pb-3">
            <span
              className="transition-all duration-300 text-center font-mono text-white/70 tracking-tight px-2"
              style={{ fontSize: 15 }}
            >
              {label}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
