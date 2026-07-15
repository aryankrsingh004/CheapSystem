import { useState, useCallback, useRef } from 'react';
import { BaseEdge, EdgeLabelRenderer, useReactFlow, type EdgeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { formatQps } from '@/lib/utils';
import { useHistory } from '@/context/HistoryContext';

interface SimEdgeData extends Record<string, unknown> {
  pct?: number;
  qps?: number;
  isBidirectional?: boolean;
  isBottleneck?: boolean;
  isWarning?: boolean;
  /** Control-point offset from the straight-line midpoint (flow coords) */
  cpDx?: number;
  cpDy?: number;
  /** User-authored label */
  label?: string;
}

export function SimEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
  markerStart,
  selected,
}: EdgeProps) {
  const d = (data ?? {}) as SimEdgeData;
  const pct = (d.pct ?? 100) as number;
  const qps = (d.qps ?? 0) as number;
  const isBidirectional = (d.isBidirectional ?? false) as boolean;
  const isBottleneck = (d.isBottleneck ?? false) as boolean;
  const isWarning = (d.isWarning ?? false) as boolean;
  const cpDx = (d.cpDx ?? 0) as number;
  const cpDy = (d.cpDy ?? 0) as number;
  const label = (d.label ?? '') as string;
  const simMode = (d.simMode ?? false) as boolean;

  const { setEdges, getViewport, getNode } = useReactFlow();
  const { takeSnapshot } = useHistory();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Drag state stored in a ref to avoid stale-closure issues
  const dragRef = useRef<{ startX: number; startY: number; baseCpDx: number; baseCpDy: number } | null>(null);

  // 1. Get nodes and their true centers (Flow coordinates)
  const targetNode = getNode(target);
  const sourceNode = getNode(source);

  if (!targetNode || !sourceNode) return null;

  const tw = targetNode.measured?.width ?? 180;
  const th = targetNode.measured?.height ?? 80;
  const sw = sourceNode.measured?.width ?? 180;
  const sh = sourceNode.measured?.height ?? 80;

  // True Centers
  const targetCenter = {
    x: targetNode.position.x + tw / 2,
    y: targetNode.position.y + th / 2
  };
  const sourceCenter = {
    x: sourceNode.position.x + sw / 2,
    y: sourceNode.position.y + sh / 2
  };

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const cpX = midX + cpDx;
  const cpY = midY + cpDy;

  // 2. Solve Target Intersection (Arrow End)
  // Vector from CP to TRUE center
  const vt = { dx: targetCenter.x - cpX, dy: targetCenter.y - cpY };
  const lenT = Math.sqrt(vt.dx * vt.dx + vt.dy * vt.dy) || 1;
  const unitT = { x: vt.dx / lenT, y: vt.dy / lenT };

  const distT = Math.min(
    Math.abs((tw / 2) / unitT.x),
    Math.abs((th / 2) / unitT.y)
  );

  const tX = targetCenter.x - unitT.x * (distT + 2);
  const tY = targetCenter.y - unitT.y * (distT + 2);

  // 3. Solve Source Intersection (Edge Start)
  // Vector from TRUE center to CP
  const vs = { dx: cpX - sourceCenter.x, dy: cpY - sourceCenter.y };
  const lenS = Math.sqrt(vs.dx * vs.dx + vs.dy * vs.dy) || 1;
  const unitS = { x: vs.dx / lenS, y: vs.dy / lenS };

  const distS = Math.min(
    Math.abs((sw / 2) / unitS.x),
    Math.abs((sh / 2) / unitS.y)
  );

  const sX = sourceCenter.x + unitS.x * (distS + 2);
  const sY = sourceCenter.y + unitS.y * (distS + 2);

  // 4. Visual Knob Position (t=0.5 on the Quadratic Bézier)
  // B(0.5) = 0.25*P0 + 0.5*P1 + 0.25*P2
  const knobX = 0.25 * sX + 0.5 * cpX + 0.25 * tX;
  const knobY = 0.25 * sY + 0.5 * cpY + 0.25 * tY;

  // Final Quad Bézier path
  const edgePath = `M ${sX} ${sY} Q ${cpX} ${cpY} ${tX} ${tY}`;

  // Use visual knob position for label as well
  const labelX = knobX;
  const labelY = knobY;

  // ── Styling ───────────────────────────────────────────────────────────────
  const TRAFFIC_LEVELS = [
    { threshold: 0, color: '#334155' }, // Idle / Inactive
    { threshold: 50, color: '#BFDBFE' }, // Low
    { threshold: 500, color: '#60A5FA' }, // Normal
    { threshold: 2000, color: '#3B82F6' }, // Growing
    { threshold: 10000, color: '#2563EB' }, // High
    { threshold: 50000, color: '#F59E0B' }, // Peak
    { threshold: 100000, color: '#EF4444' }, // Extreme
    { threshold: 1000000, color: '#7F1D1D' }, // Hyperscale
  ];

  const getTrafficColor = (q: number) => {
    // Find the highest level that is <= current qps
    const level = [...TRAFFIC_LEVELS].reverse().find(l => q >= l.threshold);
    return level ? level.color : '#334155';
  };

  const getTrafficSpeed = (q: number) => {
    if (q >= 100000) return '0.4s';
    if (q >= 10000) return '0.6s';
    if (q >= 1000) return '0.9s';
    if (q >= 100) return '1.2s';
    return '1.8s';
  };

  const hasTraffic = qps > 0;
  const strokeColor = !simMode
    ? '#ffffff'
    : isBottleneck
      ? '#ef4444'
      : isWarning
        ? '#f59e0b'
        : !hasTraffic
          ? '#ffffff'
          : getTrafficColor(qps);

  const strokeWidth = !simMode ? 2.5 : isBottleneck ? 3 : isWarning ? 2.5 : hasTraffic ? 2 : 1.5;

  const effectiveMarkerStart = markerStart;
  const effectiveMarkerEnd = markerEnd;

  // ── Draggable control-point knob ──────────────────────────────────────────
  const onKnobPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    takeSnapshot();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseCpDx: cpDx, baseCpDy: cpDy };
  }, [cpDx, cpDy, takeSnapshot]);

  const onKnobPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { startX, startY, baseCpDx, baseCpDy } = dragRef.current;

    const { zoom } = getViewport();
    // To move the PEAK (t=0.5) by N pixels, the Control Point must move by 2*N
    const dx = ((e.clientX - startX) / zoom) * 2;
    const dy = ((e.clientY - startY) / zoom) * 2;

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: {
              ...edge.data,
              cpDx: baseCpDx + dx,
              cpDy: baseCpDy + dy,
            },
          };
        }
        return edge;
      })
    );
  }, [id, getViewport, setEdges]);

  const onKnobPointerUp = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }, []);

  // ── Double-click to edit label ────────────────────────────────────────────
  const onLabelAreaDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(label);
    setEditing(true);
  }, [label]);

  const commitLabel = useCallback(() => {
    takeSnapshot();
    setEdges((eds) =>
      eds.map((ed) =>
        ed.id === id
          ? { ...ed, data: { ...(ed.data as Record<string, unknown>), label: editValue } }
          : ed,
      ),
    );
    setEditing(false);
  }, [id, editValue, setEdges, takeSnapshot]);

  const onInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setEditing(false);
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      commitLabel();
    }
  }, [commitLabel]);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={effectiveMarkerEnd}
        markerStart={effectiveMarkerStart}
        style={{
          stroke: strokeColor,
          strokeWidth,
          opacity: ((!simMode && !selected) || (simMode && !hasTraffic && !selected)) ? 0.4 : 1,
          strokeDasharray: simMode && hasTraffic ? '8 4' : undefined,
          animation: simMode && hasTraffic ? `flow-dash ${getTrafficSpeed(qps)} linear infinite` : undefined,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease',
          filter: simMode && hasTraffic ? `drop-shadow(0 0 4px ${strokeColor}88)` : undefined,
        }}
      />

      <EdgeLabelRenderer>
        {/* ─── Draggable control-point knob (only when edge is selected) ────────────── */}
        {selected && (
          <div
            className="nodrag nopan absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${knobX}px, ${knobY}px)`,
              pointerEvents: 'all',
              cursor: 'grab',
              zIndex: 10,
            }}
            onPointerDown={onKnobPointerDown}
            onPointerMove={onKnobPointerMove}
            onPointerUp={onKnobPointerUp}
          >
            <div
              className="rounded-full border-2 border-sky-400/50 shadow-lg shadow-sky-500/20 hover:scale-125 transition-all duration-150"
              style={{
                width: 12,
                height: 12,
                background: '#38bdf8',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = strokeColor;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${strokeColor}22`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${strokeColor}60`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px transparent`;
              }}
            />
          </div>
        )}

        {/* ─── Label area (click = select, double-click = edit) ─────────────── */}
        <div
          className="absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onDoubleClick={onLabelAreaDoubleClick}
        >
          <div className="flex flex-col items-center gap-1">
            {/* Inline label editor */}
            {editing ? (
              <textarea
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className="nodrag nopan px-2 py-1 rounded text-[11px] font-mono border outline-none resize-none overflow-hidden"
                style={{
                  background: 'hsl(220 14% 8%)',
                  color: '#ffffff',
                  borderColor: strokeColor,
                  minWidth: 80,
                  minHeight: 32,
                  boxShadow: `0 0 0 2px ${strokeColor}33, 0 4px 12px rgba(0,0,0,0.6)`,
                }}
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  // auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onBlur={commitLabel}
                onKeyDown={onInputKeyDown}
              />
            ) : (
              <div
                className="px-1.5 py-0.5 text-[11px] font-mono cursor-text min-w-[40px] min-h-[18px] flex items-center justify-center transition-all hover:ring-1 hover:ring-white/10 rounded whitespace-pre-wrap text-center"
                style={{
                  color: '#ffffff',
                  background: (label || (selected && !simMode)) ? 'hsl(220 14% 8%)' : 'transparent',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}
              >
                {label || (selected && !simMode ? 'type...' : '')}
              </div>
            )}

            {/* Badge row: pct + qps — only in simulation mode */}
            {simMode && (
              <div className="flex items-center gap-1 pointer-events-none">
                {pct !== 100 && (
                  <div
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border"
                    style={{
                      background: 'hsl(220 14% 11%)',
                      color: '#c084fc',
                      borderColor: '#c084fc44',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    }}
                  >
                    {pct}%
                  </div>
                )}
                {hasTraffic && (
                  <div
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border"
                    style={{
                      background: 'hsl(220 14% 13%)',
                      color: strokeColor,
                      borderColor: `${strokeColor}44`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    }}
                  >
                    {formatQps(qps)}/s
                  </div>
                )}
              </div>
            )}
            {/* Delete button (for touch screens) — only when selected in draw mode */}
            {selected && !simMode && !editing && (
              <button
                className="nodrag nopan flex items-center justify-center w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-lg border border-red-400/50 active:scale-90 mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  takeSnapshot();
                  setEdges((es) => es.filter((edge) => edge.id !== id));
                }}
              >
                <Trash2 size={12} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
