/**
 * ─── useDragAndDrop ──────────────────────────────────────────────────────────
 *
 * Handles all component drag-and-drop from the palette onto the canvas:
 *   - Pointer-based drag ghost (works on iPad / touch)
 *   - HTML5 drag events (onDrop, onDragOver) for desktop
 *   - Exposes `isDragging` / `pointerPos` for the drag ghost overlay
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { ComponentType } from '@/types/simulator';

interface UseDragAndDropOptions {
  flowContainerRef: React.RefObject<HTMLDivElement | null>;
  addSimNode: (type: ComponentType, position: { x: number; y: number }) => void;
  onDropSuccess: () => void;
}

export function useDragAndDrop({ flowContainerRef, addSimNode, onDropSuccess }: UseDragAndDropOptions) {
  const { screenToFlowPosition } = useReactFlow();

  const [dragType, setDragType] = useState<ComponentType | null>(null);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartPos = useRef({ x: 0, y: 0 });

  // Called by ComponentPalette on pointer-down
  const onDragStart = useCallback((type: ComponentType, e?: React.PointerEvent) => {
    setDragType(type);
    setIsDragging(false);
    if (e) {
      pointerStartPos.current = { x: e.clientX, y: e.clientY };
      setPointerPos({ x: e.clientX, y: e.clientY });
    }
  }, []);

  // Pointer-based drag (touch / iPad)
  useEffect(() => {
    if (!dragType) return;

    const handlePointerMove = (e: PointerEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY });
      
      const dx = e.clientX - pointerStartPos.current.x;
      const dy = e.clientY - pointerStartPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (isDragging) {
        if (e.cancelable) e.preventDefault();
      } else if (distance > 10) {
        const isTouch = e.pointerType === 'touch';
        const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.2;

        if (!isTouch || isHorizontal) {
          setIsDragging(true);
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDragging && flowContainerRef.current) {
        const rect = flowContainerRef.current.getBoundingClientRect();
        const isInCanvas =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isInCanvas) {
          const position = screenToFlowPosition({ x: e.clientX - 100, y: e.clientY - 40 });
          addSimNode(dragType, position);
          onDropSuccess();
        }
      }
      setDragType(null);
      setIsDragging(false);
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        setDragType(null);
        setIsDragging(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [dragType, isDragging, addSimNode, screenToFlowPosition, flowContainerRef, onDropSuccess]);

  // HTML5 drag-and-drop (desktop)
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!dragType) return;
      const position = screenToFlowPosition({ x: e.clientX - 100, y: e.clientY - 40 });
      addSimNode(dragType, position);
      setDragType(null);
    },
    [dragType, screenToFlowPosition, addSimNode],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return { dragType, pointerPos, isDragging, onDragStart, onDrop, onDragOver };
}
