import { useCallback, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

interface UseExcalidrawZoomOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  minZoom?: number;
  maxZoom?: number;
  zoomInFactor?: number;
  zoomOutFactor?: number;
}

export function useExcalidrawZoom({
  containerRef,
  minZoom = 0.2,
  maxZoom = 4,
  zoomInFactor = 1.15,
  zoomOutFactor = 0.95,
}: UseExcalidrawZoomOptions) {
  const { getViewport, setViewport } = useReactFlow();

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // Only handle if mouse is over the container
      const rect = container.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      // Only zoom if ctrl/meta is held (standard trackpad/mouse behavior for canvas tools)
      // On trackpads, pinch-to-zoom emits wheel events with ctrlKey: true
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const { x, y, zoom } = getViewport();

      const delta = e.deltaY > 0 ? zoomOutFactor : zoomInFactor;
      const newZoom = Math.min(Math.max(zoom * delta, minZoom), maxZoom);

      if (newZoom === zoom) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - x) * (newZoom / zoom);
      const newY = mouseY - (mouseY - y) * (newZoom / zoom);

      setViewport({ x: newX, y: newY, zoom: newZoom }, { duration: 0 });
    },
    [getViewport, setViewport, minZoom, maxZoom, zoomInFactor, zoomOutFactor, containerRef]
  );

  useEffect(() => {
    // Add to window with capture to be absolutely sure we get it
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [handleWheel]);
}
