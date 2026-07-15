/**
 * ─── ComponentPalette ────────────────────────────────────────────────────────
 * Floating menu for dragging system components onto the canvas.
 */

import { X, Monitor, Server, Database, Zap, Shield, Shuffle, Clock, Globe, HardDrive, Layers } from 'lucide-react';
import type { ComponentType } from '@/types/simulator';
import { BEHAVIORS } from '@/lib/behaviors';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  monitor: Monitor,
  server: Server,
  database: Database,
  zap: Zap,
  shield: Shield,
  shuffle: Shuffle,
  clock: Clock,
  globe: Globe,
  hardDrive: HardDrive,
  layers: Layers,
};

const CATEGORIES: { label: string; types: ComponentType[] }[] = [
  { label: 'Ingress', types: ['client'] },
  { label: 'Network', types: ['apiGateway', 'loadBalancer', 'cdn'] },
  { label: 'Compute', types: ['appServer'] },
  { label: 'Cache', types: ['cache'] },
  { label: 'Store', types: ['database', 'objectStorage'] },
  { label: 'Async', types: ['asyncQueue'] },
  { label: 'Background', types: ['cronJob'] },
];

interface ComponentPaletteProps {
  onDragStart: (type: ComponentType, e?: React.PointerEvent) => void;
  onAddComponent: (type: ComponentType) => void;
  onClose: () => void;
}

export function ComponentPalette({ onDragStart, onAddComponent, onClose }: ComponentPaletteProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h2 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em] pl-1">Components</h2>
        <button
          onClick={onClose}
          className="p-1 px-1.5 rounded-md hover:bg-white/5 text-white/20 hover:text-white/60 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll p-2.5 space-y-4">
        {CATEGORIES.map(({ label, types }) => (
          <div key={label} className="space-y-1.5">
            <div className="text-[8px] font-bold text-white/15 uppercase tracking-widest px-1.5">{label}</div>
            <div className="space-y-1">
              {types.map((type) => {
                const behavior = BEHAVIORS[type];
                const { meta } = behavior;
                const IconComp = ICON_MAP[meta.icon] ?? Server;
                const isTouch = typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);

                return (
                  <div
                    key={type}
                    draggable={!isTouch}
                    onClick={() => {
                      onAddComponent(type);
                      onClose();
                    }}
                    onPointerDown={(e) => {
                      onDragStart(type, e);
                    }}
                    onDragStart={() => {
                      onDragStart(type);
                      setTimeout(onClose, 100);
                    }}
                    title={meta.description} // Show description on hover
                    className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-white/[0.04] bg-white/[0.01] cursor-pointer hover:border-white/20 hover:bg-white/[0.05] transition-all duration-150 select-none touch-pan-y"
                    style={{ touchAction: 'pan-y' }}
                  >
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110"
                      style={{ background: `${meta.color}10` }}
                    >
                      <IconComp size={13} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white/70 group-hover:text-white leading-tight truncate">
                        {behavior.defaultConfig.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
