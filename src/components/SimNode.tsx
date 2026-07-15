import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Monitor, Server, Database, Zap, Shield, Shuffle, Clock, HardDrive } from 'lucide-react';
import type { SimNodeData } from '@/lib/simulation';
import { BEHAVIORS } from '@/lib/behaviors';
import { formatQps } from '@/lib/utils';
import { AsyncQueueNode } from '@/components/AsyncQueueNode';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>> = {
  monitor: Monitor,
  server: Server,
  database: Database,
  zap: Zap,
  shield: Shield,
  shuffle: Shuffle,
  clock: Clock,
  hardDrive: HardDrive,
};

function ReplicaLayers({
  replicas,
  width,
  height,
  bgStyle,
  borderStyle,
  borderRadius
}: any) {
  if (!replicas || replicas <= 1) return null;
  const extraLayers = Math.min(replicas - 1, 3);
  return (
    <>
      {Array.from({ length: extraLayers }).map((_, i) => {
        const offset = (i + 1) * 6;
        const scale = 1 - (i + 1) * 0.02;
        return (
          <div
            key={i}
            className="absolute pointer-events-none transition-all duration-500 ease-out"
            style={{
              ...bgStyle,
              border: borderStyle,
              width,
              height,
              borderRadius,
              top: -offset,
              right: -offset,
              zIndex: -10 - i,
              opacity: 0.5 - (i * 0.12),
              transform: `scale(${scale})`,
              boxShadow: '4px -4px 12px rgba(0,0,0,0.4)',
              filter: `blur(${i * 0.5}px)`, // Slight blur for depth
            }}
          />
        );
      })}
    </>
  );
}

export function SimNode({ data, selected }: NodeProps & { data: SimNodeData }) {
  if (!data) return null;

  // Delegate asyncQueue to its own specialized renderer
  if (data.componentType === 'asyncQueue') {
    return <AsyncQueueNode data={data as any} selected={selected} />;
  }

  const behavior = BEHAVIORS[data.componentType];
  if (!behavior) return null;

  const { meta } = behavior;
  const cfg = data.config;
  const IconComp = ICON_MAP[meta.icon] ?? Server;

  const isSimMode = (data as any).simMode === true;
  const shape = meta.shape;

  const incomingQps = data.incomingQps ?? 0;
  const capacity = cfg.qpsLimit * cfg.replicas;
  const utilPct = capacity > 0 ? Math.round((incomingQps / capacity) * 100) : 0;

  // Clients are generators, they don't overload or bottleneck themselves.
  const canOverload = data.componentType !== 'client';
  const isOverloaded = canOverload && incomingQps > capacity;
  const isWarning = canOverload && !isOverloaded && utilPct >= 80;

  const utilColor = isOverloaded ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';
  const accentColor = isSimMode
    ? (isOverloaded ? '#ef4444' : isWarning ? '#f59e0b' : meta.color)
    : '#ffffff';

  // Base Styles
  const bgStyle: React.CSSProperties = {
    background: isSimMode
      ? `linear-gradient(135deg, ${meta.bgColor}, rgba(255,255,255,0.02))`
      : 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(8px)',
  };

  const borderWidthVal = isSimMode ? 3 : 2.5;
  const borderColorVal = isSimMode
    ? (selected ? 'rgba(56,189,248,0.7)' : isOverloaded ? '#ef4444' : isWarning ? '#f59e0b' : `${meta.color}60`)
    : (selected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)');

  const borderStyle = `${borderWidthVal}px solid ${borderColorVal}`;

  const boxShadow = selected
    ? `0 0 0 1px ${isSimMode ? accentColor : '#ffffff'}30, 0 8px 24px rgba(0,0,0,0.5)`
    : '0 4px 16px rgba(0,0,0,0.3)';

  const hasLeft = meta.handles.includes('left');
  const hasRight = meta.handles.includes('right');

  const handles = (
    <>
      {hasLeft && (
        <Handle
          type={data.componentType === 'cronJob' ? 'source' : 'target'}
          position={Position.Left}
          id="left"
          className={`!z-50 !w-5 !h-5 !border-2 !bg-slate-950 transition-all duration-200 shadow-lg ${isSimMode ? '!border-white/30 hover:!bg-sky-400 hover:!scale-125' : '!border-white/20 hover:!bg-white hover:!scale-125'
            }`}
        />
      )}
      {hasRight && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className={`!z-50 !w-5 !h-5 !border-2 !bg-slate-950 transition-all duration-200 shadow-lg ${isSimMode ? '!border-white/30 hover:!bg-sky-400 hover:!scale-125' : '!border-white/20 hover:!bg-white hover:!scale-125'
            }`}
        />
      )}
    </>
  );

  // ── Common Content ─────────────────────────────────────────────────────────
  const labelEl = (
    <div
      className={`transition-all duration-300 text-center break-words px-2 ${isSimMode ? 'font-bold text-white/90' : 'font-mono text-white/70 tracking-tight'
        }`}
      style={{ fontSize: isSimMode ? 13 : 15 }}
    >
      {cfg.label}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // CIRCLE  — databases, caches (stable size: 120x120)
  // ═══════════════════════════════════════════════════════════════════
  if (shape === 'circle') {
    return (
      <div className="relative flex items-center justify-center p-1" style={{ width: 120, height: 120 }}>
        {handles}
        <ReplicaLayers
          replicas={cfg.replicas}
          width={120}
          height={120}
          bgStyle={bgStyle}
          borderStyle={borderStyle}
          borderRadius="9999px"
        />
        <div
          className="w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-300 overflow-hidden relative"
          style={{ ...bgStyle, border: borderStyle, boxShadow }}
        >
          {isSimMode && (
            <IconComp size={22} style={{ color: accentColor, marginBottom: 4 }} className="animate-in fade-in zoom-in duration-300" />
          )}
          {labelEl}
          {isSimMode && incomingQps > 0 && (
            <div className="text-[10px] font-mono mt-1 animate-in fade-in slide-in-from-bottom-1" style={{ color: utilColor }}>
              {Math.min(utilPct, 999)}%
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // BUCKET — Object Storage (stable size: 140x110)
  // ═══════════════════════════════════════════════════════════════════
  if (shape === 'bucket') {
    return (
      <div className="relative flex items-center justify-center" style={{ width: 100, height: 90 }}>
        {handles}

        {/* Shadow Layer for Depth */}
        <div
          className="absolute w-full h-full rounded-b-[40%] bg-black/40 blur-xl -bottom-1 z-[-1]"
        />

        <div
          className="w-full h-full relative transition-all duration-300 flex flex-col items-center justify-center p-2"
          style={{
            ...bgStyle,
            borderStyle: 'solid',
            borderColor: borderColorVal,
            borderTopWidth: '1.5px',
            borderRightWidth: `${borderWidthVal}px`,
            borderBottomWidth: `${borderWidthVal}px`,
            borderLeftWidth: `${borderWidthVal}px`,
            borderRadius: "6px 6px 45% 45% / 6px 6px 20% 20%",
            boxShadow,
          }}
        >
          {/* Top Rim Overlay for 'Open' look */}
          <div
            className="absolute -top-[5px] left-[-2px] right-[-2px] h-[16px] rounded-[100%] border-2 z-10"
            style={{
              background: isSimMode ? `${meta.color}30` : 'rgba(255,255,255,0.08)',
              borderColor: isSimMode ? meta.color : 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {isSimMode && (
            <IconComp size={20} style={{ color: accentColor, marginBottom: 2 }} className="animate-in fade-in zoom-in duration-300" />
          )}
          {labelEl}
          {isSimMode && incomingQps > 0 && (
            <div className="text-[10px] font-mono mt-1 animate-in fade-in slide-in-from-bottom-1" style={{ color: utilColor }}>
              {Math.min(utilPct, 999)}%
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // TALL-RECT  — API Gateway (stable size: 90x200)
  // ═══════════════════════════════════════════════════════════════════
  if (shape === 'tall-rect') {
    return (
      <div
        className="relative flex flex-col items-center justify-center rounded-[2.5rem] transition-all duration-300 px-2"
        style={{ ...bgStyle, border: borderStyle, boxShadow, width: 90, height: 200 }}
      >
        <ReplicaLayers
          replicas={cfg.replicas}
          width={90}
          height={200}
          bgStyle={bgStyle}
          borderStyle={borderStyle}
          borderRadius="2.5rem"
        />
        {handles}
        {isSimMode && (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center mb-4 flex-shrink-0 animate-in fade-in zoom-in duration-300"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
          >
            <IconComp size={18} style={{ color: accentColor }} />
          </div>
        )}
        {labelEl}
        {isSimMode && incomingQps > 0 && (
          <div className="text-[10px] font-mono mt-4 animate-in fade-in slide-in-from-bottom-1" style={{ color: utilColor }}>
            {Math.min(utilPct, 999)}%
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SMALL-RECT — Client node (stable size: 140x70)
  // ═══════════════════════════════════════════════════════════════════
  const isCronActive = data.componentType === 'cronJob' && Math.floor(Date.now() / 1000) % 2 === 0;

  if (shape === 'small-rect') {
    return (
      <div
        className="relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300"
        style={{ ...bgStyle, border: borderStyle, boxShadow, width: 140, height: 70 }}
      >
        <ReplicaLayers
          replicas={cfg.replicas}
          width={140}
          height={70}
          bgStyle={bgStyle}
          borderStyle={borderStyle}
          borderRadius="1rem"
        />
        {handles}
        <div className="flex items-center gap-2">
          {isSimMode && (
            <div className={isCronActive ? 'animate-pulse' : ''}>
              <IconComp size={18} style={{ color: isCronActive ? '#a855f7' : accentColor }} className="animate-in fade-in zoom-in duration-300" />
            </div>
          )}
          {labelEl}
        </div>
        {isSimMode && data.componentType !== 'client' && (
          <div className={`text-[10px] font-mono mt-1 text-white/50 animate-in fade-in slide-in-from-bottom-1 transition-colors ${isCronActive ? 'text-purple-400 font-bold' : ''}`}>
            {formatQps(isCronActive ? cfg.qpsLimit : 0)}/s
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RECT  — App Server, Load Balancer (stable size: 180x90 minimum)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 p-2"
      style={{ ...bgStyle, border: borderStyle, boxShadow, width: 180, minHeight: 90 }}
    >
      <ReplicaLayers
        replicas={cfg.replicas}
        width={180}
        height="100%"
        bgStyle={bgStyle}
        borderStyle={borderStyle}
        borderRadius="1rem"
      />
      {handles}

      <div className="flex flex-col items-center w-full">
        <div className="flex items-center gap-2 mb-1 justify-center w-full">
          {isSimMode && (
            <div
              className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center animate-in fade-in zoom-in duration-300"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
            >
              <IconComp size={16} style={{ color: accentColor }} />
            </div>
          )}
          {labelEl}
        </div>

        {isSimMode && (
          <div className="w-full mt-2 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between text-[9px] text-white/40 px-1">
              <span>{Math.min(utilPct, 999)}% Util</span>
              <span>{formatQps(incomingQps)}/s</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden mx-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(utilPct, 100)}%`, background: utilColor }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

