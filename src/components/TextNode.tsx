import { useCallback, useState, useEffect, useRef } from 'react';
import { type NodeProps, useReactFlow } from '@xyflow/react';

export interface TextNodeData extends Record<string, unknown> {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
  color?: string;
  w?: number;
  h?: number | null;
  rotation?: number;
  opacity?: number;
  isWidthFixed?: boolean; // false = auto-width mode, true = fixed-width (wrap) mode
}

export const FONT_FAMILY_MAP: Record<string, string> = {
  sans: "'Inter', sans-serif",
  serif: "Georgia, serif",
  slab: "'Roboto Slab', serif",
  script: "'Dancing Script', cursive",
  handwritten: "'Architects Daughter', cursive",
  display: "'Graduate', serif",
  mono: "'JetBrains Mono', monospace",
};

const getFontFamily = (f: string) => FONT_FAMILY_MAP[f] || f;

const MIN_W = 20;
const MIN_H = 24;
const DEFAULT_FS = 14;

type HandlePos = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

const HANDLE_CONFIG: Record<HandlePos, {
  pos: React.CSSProperties;
  cursor: string;
  dw: 0 | 1 | -1;
  dh: 0 | 1 | -1;
  moveX: boolean;
  moveY: boolean;
}> = {
  nw: { pos: { top: -5, left: -5 }, cursor: 'nw-resize', dw: -1, dh: -1, moveX: true, moveY: true },
  n: { pos: { top: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 'n-resize', dw: 0, dh: -1, moveX: false, moveY: true },
  ne: { pos: { top: -5, right: -5 }, cursor: 'ne-resize', dw: 1, dh: -1, moveX: false, moveY: true },
  e: { pos: { top: '50%', right: -5, transform: 'translateY(-50%)' }, cursor: 'e-resize', dw: 1, dh: 0, moveX: false, moveY: false },
  se: { pos: { bottom: -5, right: -5 }, cursor: 'se-resize', dw: 1, dh: 1, moveX: false, moveY: false },
  s: { pos: { bottom: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 's-resize', dw: 0, dh: 1, moveX: false, moveY: false },
  sw: { pos: { bottom: -5, left: -5 }, cursor: 'sw-resize', dw: -1, dh: 1, moveX: true, moveY: false },
  w: { pos: { top: '50%', left: -5, transform: 'translateY(-50%)' }, cursor: 'w-resize', dw: -1, dh: 0, moveX: true, moveY: false },
};
const ALL_HANDLES = Object.keys(HANDLE_CONFIG) as HandlePos[];
const isCorner = (h: HandlePos) => h.length === 2;

export function TextNode({ id, data, selected, positionAbsoluteX, positionAbsoluteY }: NodeProps) {
  const d = data as TextNodeData;
  const { setNodes } = useReactFlow();

  const isWidthFixed = d.isWidthFixed ?? false;

  const [editing, setEditing] = useState(!d.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoWidthMirrorRef = useRef<HTMLSpanElement>(null); // for mode 1: measures single-line width
  const fixedMirrorRef = useRef<HTMLDivElement>(null);       // for mode 2: measures wrapped height
  const nodeRef = useRef<HTMLDivElement>(null);

  const [w, setW] = useState(d.w ?? MIN_W);
  const [h, setH] = useState<number | null>(d.h ?? null);
  const [autoH, setAutoH] = useState(MIN_H);
  const [rotation, setRotation] = useState(d.rotation ?? 0);

  const wRef = useRef(w);
  const autoHRef = useRef(autoH);

  useEffect(() => {
    wRef.current = w;
  }, [w]);

  useEffect(() => {
    autoHRef.current = autoH;
  }, [autoH]);

  const fontSize = d.fontSize ?? DEFAULT_FS;
  const fontFamily = d.fontFamily ?? 'sans';
  const align = d.align ?? 'left';
  const bold = d.bold ?? false;
  const italic = d.italic ?? false;
  const color = d.color ?? '#e2e8f0';
  const opacity = d.opacity ?? 100;

  const effectiveH = h !== null ? h : autoH;

  // Sync from data when externally changed
  useEffect(() => { setW(d.w ?? MIN_W); }, [d.w]);
  useEffect(() => { setH(d.h ?? null); }, [d.h]);
  useEffect(() => { setRotation(d.rotation ?? 0); }, [d.rotation]);

  // ── Mode 1: auto-width measurement ──────────────────────────────────────────
  const measureAutoWidth = useCallback(() => {
    if (isWidthFixed) return;
    if (autoWidthMirrorRef.current) {
      const measuredW = Math.max(MIN_W, autoWidthMirrorRef.current.scrollWidth + 2); // small buffer
      // Only update if difference is significant to avoid sub-pixel jitter
      if (Math.abs(measuredW - wRef.current) > 0.5) {
        setW(measuredW);
        setNodes(nds => nds.map(n =>
          n.id === id ? { ...n, data: { ...n.data, w: measuredW } } : n
        ));
      }
    }
    if (fixedMirrorRef.current) {
      const measuredH = Math.max(MIN_H, fixedMirrorRef.current.offsetHeight);
      if (Math.abs(measuredH - autoHRef.current) > 0.5) {
        setAutoH(measuredH);
      }
    }
  }, [isWidthFixed, id, setNodes]); // w and autoH are removed from dependencies to avoid measurement loops

  // ── Mode 2: fixed-width, auto-height measurement ─────────────────────────────
  const measureAutoHeight = useCallback(() => {
    if (!isWidthFixed) return;
    if (fixedMirrorRef.current) {
      const measuredH = Math.max(MIN_H, fixedMirrorRef.current.offsetHeight);
      if (Math.abs(measuredH - autoHRef.current) > 0.5) {
        setAutoH(measuredH);
      }
    }
  }, [isWidthFixed]); // autoH is removed from dependencies to avoid loops

  useEffect(() => {
    if (isWidthFixed) {
      measureAutoHeight();
    } else {
      measureAutoWidth();
    }
  }, [d.text, fontSize, fontFamily, bold, italic, isWidthFixed, measureAutoWidth, measureAutoHeight]);

  // Focus on mount / entering edit mode
  useEffect(() => {
    if (editing && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [editing]);

  const patchData = useCallback((patch: Partial<TextNodeData>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [id, setNodes]);

  // ── Switch back to auto-width mode ──────────────────────────────────────────
  const resetToAutoWidth = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setH(null);
    patchData({ isWidthFixed: false, h: null });
    // Width will auto-measure on next render
    requestAnimationFrame(measureAutoWidth);
  }, [patchData, measureAutoWidth]);

  // ── Resize logic ──────────────────────────────────────────────────────────
  const resizeState = useRef<{
    handle: HandlePos;
    startX: number; startY: number;
    startW: number; startH: number;
    startFs: number;
    startNodeX: number; startNodeY: number;
  } | null>(null);

  const onResizeDown = useCallback((e: React.PointerEvent, handle: HandlePos) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resizeState.current = {
      handle,
      startX: e.clientX, startY: e.clientY,
      startW: w, startH: effectiveH,
      startFs: fontSize,
      startNodeX: positionAbsoluteX ?? 0,
      startNodeY: positionAbsoluteY ?? 0,
    };
  }, [w, effectiveH, fontSize, positionAbsoluteX, positionAbsoluteY]);

  const onResizeMove = useCallback((e: React.PointerEvent, handle: HandlePos) => {
    const rs = resizeState.current;
    if (!rs || rs.handle !== handle) return;

    const cfg = HANDLE_CONFIG[handle];
    const dx = e.clientX - rs.startX;
    const dy = e.clientY - rs.startY;

    let newW = rs.startW;
    let newH = rs.startH;
    let newFs = rs.startFs;

    if (isCorner(handle)) {
      const diag = Math.sqrt((rs.startW * cfg.dw) ** 2 + (rs.startH * cfg.dh) ** 2) || 1;
      const proj = cfg.dw * dx + cfg.dh * dy;
      const scale = Math.max(MIN_W / (rs.startW || 1), MIN_H / (rs.startH || 1), 1 + proj / diag);
      newW = Math.round(rs.startW * scale);
      newH = Math.round(rs.startH * scale);
      newFs = Math.max(8, Math.round(rs.startFs * scale));
    } else {
      if (cfg.dw !== 0) newW = Math.max(MIN_W, rs.startW + cfg.dw * dx);
      if (cfg.dh !== 0) newH = Math.max(MIN_H, rs.startH + cfg.dh * dy);
    }

    let posX = rs.startNodeX;
    let posY = rs.startNodeY;
    if (cfg.moveX) { const dW = newW - rs.startW; posX = rs.startNodeX - dW; }
    if (cfg.moveY) { const dH = newH - rs.startH; posY = rs.startNodeY - dH; }

    const isWidthResize = cfg.dw !== 0; // E/W side handle — enters fixed mode

    setW(newW);
    if (isCorner(handle)) setH(newH);
    else if (cfg.dh !== 0) setH(newH);
    else setH(null); // E/W: auto-height

    setNodes(nds => nds.map(n => {
      if (n.id !== id) return n;
      let hPatch: number | null;
      if (isCorner(handle)) hPatch = newH;
      else if (cfg.dh !== 0) hPatch = newH;
      else hPatch = null;
      const currentData = n.data as TextNodeData;
      return {
        ...n,
        position: { x: posX, y: posY },
        data: {
          ...n.data,
          w: newW,
          h: hPatch,
          fontSize: newFs,
          // Only lock width on E/W side handles, not corners or N/S
          isWidthFixed: isWidthResize ? true : currentData.isWidthFixed,
        },
      };
    }));
  }, [id, setNodes]);

  const onResizeUp = useCallback((_e: React.PointerEvent) => {
    resizeState.current = null;
    if (isWidthFixed) measureAutoHeight();
    else measureAutoWidth();
  }, [isWidthFixed, measureAutoHeight, measureAutoWidth]);

  // ── Rotate logic ──────────────────────────────────────────────────────────
  const rotateState = useRef<{ startAngle: number; startRotation: number } | null>(null);

  const onRotateDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (!nodeRef.current) return;
    const rect = nodeRef.current.getBoundingClientRect();
    const angle = Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2)) * (180 / Math.PI);
    rotateState.current = { startAngle: angle, startRotation: rotation };
  }, [rotation]);

  const onRotateMove = useCallback((e: React.PointerEvent) => {
    if (!rotateState.current || !nodeRef.current) return;
    const rect = nodeRef.current.getBoundingClientRect();
    const angle = Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2)) * (180 / Math.PI);
    const newRot = (rotateState.current.startRotation + (angle - rotateState.current.startAngle) + 360) % 360;
    setRotation(newRot);
    patchData({ rotation: newRot });
  }, [patchData]);

  const onRotateUp = useCallback(() => { rotateState.current = null; }, []);

  const onBlur = useCallback(() => {
    setEditing(false);
    if (!d.text || d.text.trim() === '') {
      setNodes(nds => nds.filter(n => n.id !== id));
    }
  }, [id, d.text, setNodes]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); setEditing(true);
  }, []);

  // Shared text style
  const textStyle: React.CSSProperties = {
    color,
    fontSize,
    fontFamily: getFontFamily(fontFamily),
    fontWeight: bold ? '700' : '400',
    fontStyle: italic ? 'italic' : 'normal',
    textAlign: align,
    lineHeight: 1.5,
    padding: '4px 6px',
    opacity: opacity / 100,
    boxSizing: 'border-box',
    // Prevent some browser-specific font-smoothing variations that could affect measurement
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const HANDLE_COLOR = '#6965db';
  const BORDER_COLOR = 'rgba(105, 101, 219, 0.8)';

  return (
    <>
      {/* ── Mode 1: Single-line span mirror for measuring natural text width ─── */}
      {!isWidthFixed && (
        <span
          ref={autoWidthMirrorRef}
          aria-hidden
          style={{
            ...textStyle,
            position: 'fixed',
            visibility: 'hidden',
            pointerEvents: 'none',
            whiteSpace: 'pre',        // no wrap — measures single-line width
            width: 'max-content',
            top: -9999,
            left: -9999,
          }}
        >
          {d.text || '\u00a0'}
        </span>
      )}

      {/* ── Mirror for height measurement (both modes) ───────────────────────── */}
      <div
        ref={fixedMirrorRef}
        aria-hidden
        style={{
          ...textStyle,
          position: 'fixed',
          visibility: 'hidden',
          pointerEvents: 'none',
          width: isWidthFixed ? w : 'max-content',
          whiteSpace: isWidthFixed ? 'pre-wrap' : 'pre',
          overflowWrap: isWidthFixed ? 'break-word' : 'normal',
          wordBreak: isWidthFixed ? 'break-word' : 'normal',
          height: 'auto',
          top: -9999,
          left: -9999,
        }}
      >
        {d.text || '\u00a0'}
      </div>

      {/* ── Node root ────────────────────────────────────────────────────────── */}
      <div
        ref={nodeRef}
        style={{
          width: w,
          height: effectiveH,
          position: 'relative',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          overflow: 'visible',
          cursor: 'move',
        }}
        onDoubleClick={onDoubleClick}
      >
        {/* Selection border */}
        {selected && !editing && (
          <div style={{
            position: 'absolute',
            inset: -2,
            border: `1.5px solid ${BORDER_COLOR}`,
            borderRadius: 3,
            pointerEvents: 'none',
            zIndex: 5,
            boxSizing: 'content-box',
          }} />
        )}

        {editing ? (
          <textarea
            ref={textareaRef}
            className="nodrag nopan"
            style={{
              ...textStyle,
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              width: '100%',
              // Height is managed by the node root — we use overflow:hidden to suppress
              // scrollbars. We sync the node height synchronously via scrollHeight so
              // content is never actually clipped.
              height: '100%',
              resize: 'none',
              outline: 'none',
              background: 'transparent',
              border: 'none',
              caretColor: color,
              overflow: 'hidden',
              // Mode 1: no wrap (grow sideways). Mode 2: wrap.
              whiteSpace: isWidthFixed ? 'pre-wrap' : 'pre',
              overflowWrap: isWidthFixed ? 'break-word' : 'normal',
              wordBreak: isWidthFixed ? 'break-word' : 'normal',
            }}
            value={d.text ?? ''}
            onChange={e => {
              const el = e.currentTarget;
              patchData({ text: el.value });

              // Force the textarea to match its content height exactly
              // This prevents the browser from scrolling the content up and hiding the top.
              el.style.height = 'auto';
              const nextH = Math.max(MIN_H, el.scrollHeight);
              el.style.height = `${nextH}px`;

              // Sync the parent node height
              setAutoH(nextH);

              // Ensure the browser doesn't try to scroll the textarea internal view
              el.scrollTop = 0;

              if (!isWidthFixed) {
                // Width-auto mode: still need to measure width from mirror
                requestAnimationFrame(measureAutoWidth);
              }
            }}
            onBlur={onBlur}
            onKeyDown={e => {
              if (e.key === 'Escape') { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
            }}
          />
        ) : (
          <div
            style={{
              ...textStyle,
              position: 'absolute', inset: 0,
              overflow: 'visible',
              whiteSpace: isWidthFixed ? 'pre-wrap' : 'pre',
              overflowWrap: isWidthFixed ? 'break-word' : 'normal',
              wordBreak: isWidthFixed ? 'break-word' : 'normal',
              cursor: 'move',
            }}
          >
            {d.text}
          </div>
        )}

        {/* ── Resize handles ──────────────────────────────────────────────────── */}
        {selected && !editing && ALL_HANDLES.map(handle => {
          const cfg = HANDLE_CONFIG[handle];
          const corner = isCorner(handle);
          return (
            <div
              key={handle}
              style={{
                position: 'absolute',
                ...cfg.pos,
                width: corner ? 10 : 8,
                height: corner ? 10 : 8,
                background: '#fff',
                border: `2px solid ${HANDLE_COLOR}`,
                borderRadius: corner ? 2 : '50%',
                cursor: cfg.cursor,
                zIndex: 50,
                touchAction: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
              onPointerDown={e => onResizeDown(e, handle)}
              onPointerMove={e => onResizeMove(e, handle)}
              onPointerUp={e => onResizeUp(e)}
            />
          );
        })}

        {/* ── Rotate handle ────────────────────────────────────────────────────── */}
        {selected && !editing && (
          <div
            style={{
              position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
              width: 12, height: 12, background: '#fff', border: `2px solid ${HANDLE_COLOR}`,
              borderRadius: '50%', cursor: 'grab', zIndex: 50, touchAction: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
            onPointerDown={onRotateDown}
            onPointerMove={onRotateMove}
            onPointerUp={onRotateUp}
          />
        )}

        {/* ── "Reset to auto-width" button — only shown in fixed mode ─────────── */}
        {selected && !editing && isWidthFixed && (
          <div
            title="Reset to auto-width"
            style={{
              position: 'absolute',
              top: '50%',
              right: -30,
              transform: 'translateY(-50%)',
              width: 20,
              height: 20,
              background: 'hsl(220 14% 18%)',
              border: `1.5px solid ${HANDLE_COLOR}`,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 60,
              touchAction: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              color: '#a8a4ff',
            }}
            onPointerDown={resetToAutoWidth}
          >
            {/* ↔ icon */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M5 12l4-4m-4 4 4 4M19 12l-4-4m4 4-4 4" />
            </svg>
          </div>
        )}
      </div>
    </>
  );
}
