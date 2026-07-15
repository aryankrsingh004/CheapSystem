import { X, Trash2, Info } from 'lucide-react';
import { Monitor, Server, Database, Zap, Globe, HardDrive } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';
import type { SimNodeData } from '@/lib/simulation';
import { getEdgePct } from '@/lib/simulation';
import { BEHAVIORS } from '@/lib/behaviors';
import { formatQps } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  monitor: Monitor,
  server: Server,
  database: Database,
  zap: Zap,
  globe: Globe,
  hardDrive: HardDrive,
};

const TRAFFIC_LEVELS = [
  { label: 'Idle', rps: 0, meaning: 'Almost no traffic', color: '#334155' },
  { label: 'Low', rps: 50, meaning: 'Dev/testing', color: '#BFDBFE' },
  { label: 'Normal', rps: 500, meaning: 'Small app', color: '#60A5FA' },
  { label: 'Growing', rps: 2000, meaning: 'Scaling starts', color: '#3B82F6' },
  { label: 'High', rps: 10000, meaning: 'Real production', color: '#2563EB' },
  { label: 'Peak', rps: 50000, meaning: 'Heavy load', color: '#F59E0B' },
  { label: 'Extreme', rps: 100000, meaning: 'Stress test', color: '#EF4444' },
  { label: 'Hyperscale', rps: 1000000, meaning: 'Internet-scale systems', color: '#7F1D1D' },
];

const DB_CAPACITY_LEVELS = [
  { label: 'Bare', rps: 20, meaning: 'No indexing, cold start', color: '#E5E7EB' },
  { label: 'Basic', rps: 100, meaning: 'Minimal tuning', color: '#BFDBFE' },
  { label: 'Indexed', rps: 500, meaning: 'Proper indexing applied', color: '#60A5FA' },
  { label: 'Tuned', rps: 1500, meaning: 'Query + schema optimized', color: '#3B82F6' },
  { label: 'Efficient', rps: 3000, meaning: 'Connection pooling + good queries', color: '#2563EB' },
  { label: 'Maxed', rps: 5000, meaning: 'Near hardware limits', color: '#F59E0B' },
  { label: 'Overloaded', rps: 8000, meaning: 'Unstable, high latency', color: '#EF4444' },
  { label: 'Breaking', rps: 10000, meaning: 'Timeouts / crashes likely', color: '#7F1D1D' },
];

const OBJECT_STORAGE_LEVELS = [
  { label: 'Standard', rps: 10000, meaning: 'Base throughput', color: '#60A5FA' },
  { label: 'Scalable', rps: 50000, meaning: 'Production workloads', color: '#3B82F6' },
  { label: 'High Perf', rps: 100000, meaning: 'Heavy IOPS', color: '#2563EB' },
  { label: 'Elite', rps: 250000, meaning: 'Very large scale', color: '#F59E0B' },
  { label: 'Unlimited', rps: 500000, meaning: 'Global scale storage', color: '#EF4444' },
];

interface NodeConfigPanelProps {
  node: Node<SimNodeData>;
  edges: Edge[];
  allNodes: Node<SimNodeData>[];
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<SimNodeData['config']>) => void;
  onDelete: (id: string) => void;
  onUpdateEdgePct: (edgeId: string, pct: number) => void;
  onUpdateEdgeOutRate: (edgeId: string, rate: number) => void;
}

export function NodeConfigPanel({ node, edges, allNodes, onClose, onUpdate, onDelete, onUpdateEdgePct, onUpdateEdgeOutRate }: NodeConfigPanelProps) {
  const behavior = BEHAVIORS[node.data.componentType];

  if (!behavior) return null;

  const { meta } = behavior;
  const IconComp = ICON_MAP[meta.icon] ?? Server;
  const config = node.data.config;
  const effectiveCapacity = config.qpsLimit * config.replicas;

  // Find outgoing edges from this node
  const outgoingEdges = edges.filter((e) => e.source === node.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}44` }}>
            <IconComp size={15} style={{ color: meta.color }} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/90">{config.label}</div>
            <div className="text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ background: `${meta.color}22`, color: meta.color }}>
              {meta.description}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10 transition-colors text-white/40 hover:text-white/70" data-testid="config-panel-close">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll p-4 space-y-5">
        {/* Identity */}
        <Section title="Identity">
          <div className="space-y-1.5">
            <label className="text-[11px] text-white/60">Label</label>
            <input
              type="text"
              value={config.label}
              onChange={(e) => onUpdate(node.id, { label: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/8 border border-white/12 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-sky-500/60 focus:bg-white/10 transition-colors"
              placeholder={behavior.defaultConfig.label}
              data-testid="config-label-input"
            />
          </div>
        </Section>

        {/* Capacity */}
        {node.data.componentType !== 'cdn' && (
          <Section title="Capacity">
            {node.data.componentType === 'database' ? (
              <DatabaseCapacitySlider
                label="Database Capacity"
                currentRps={config.qpsLimit}
                onChange={(rps) => onUpdate(node.id, { qpsLimit: rps })}
              />
            ) : node.data.componentType === 'objectStorage' ? (
              <ObjectStorageCapacitySlider
                label="Storage Throughput"
                currentRps={config.qpsLimit}
                onChange={(rps) => onUpdate(node.id, { qpsLimit: rps })}
              />
            ) : node.data.componentType === 'asyncQueue' ? (
              <TrafficSlider
                label="Queue Capacity"
                currentRps={config.qpsLimit}
                onChange={(rps) => onUpdate(node.id, { qpsLimit: rps })}
              />
            ) : (
              <TrafficSlider
                label={['client', 'cronJob'].includes(node.data.componentType) ? "Traffic Volume" : "Traffic Capacity"}
                currentRps={config.qpsLimit}
                onChange={(rps) => onUpdate(node.id, { qpsLimit: rps })}
              />
            )}
            {node.data.componentType !== 'asyncQueue' && (
              <SliderField
                label="Replicas / Instances"
                hint="Horizontal scale — total capacity = QPS × replicas"
                sliderValue={config.replicas}
                displayValue={`×${config.replicas}`}
                min={1} max={50} step={1}
                accentColor="#c084fc"
                onChange={(v) => onUpdate(node.id, { replicas: v })}
                testId="config-replicas-range"
              />
            )}
            {!['objectStorage', 'asyncQueue'].includes(node.data.componentType) && (
              <div className="p-3 rounded-lg bg-white/4 border border-white/8">
                <div className="text-[10px] text-white/40 mb-1">Effective Capacity</div>
                <div className="text-lg font-mono font-bold" style={{ color: meta.color }}>
                  {formatQps(effectiveCapacity)}{' '}
                  <span className="text-sm font-normal text-white/50">QPS</span>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Behavior fields */}
        {behavior.configFields.length > 0 && node.data.componentType !== 'database' && (
          <Section title="Behavior">
            {behavior.configFields
              .filter(field => {
                // CDN reduction slider only shown if output handle has connections
                if (node.data.componentType === 'cdn' && field.key === 'reduction') {
                  return outgoingEdges.length > 0;
                }
                return true;
              })
              .map((field) => {
                const raw = config[field.key] as number | undefined;
                const storedValue = raw ?? field.fromSlider(field.min);
                return (
                  <div key={String(field.key)} className="space-y-1.5">
                    <SliderField
                      label={field.label}
                      hint={field.hint}
                      sliderValue={field.toSlider(storedValue)}
                      displayValue={field.format(storedValue)}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      accentColor={field.accentColor}
                      onChange={(sliderVal) => onUpdate(node.id, { [field.key]: field.fromSlider(sliderVal) })}
                      testId={`config-${String(field.key)}-range`}
                    />
                  </div>
                );
              })}
          </Section>
        )}

        {/* Traffic Distribution — independent percentage sliders */}
        {outgoingEdges.length > 0 && (
          <Section title="Traffic Distribution">
            <div className="text-[10px] text-white/30 mb-2">
              Set the percentage of outgoing traffic sent to each downstream service.
            </div>
            <div className="space-y-3">
              {outgoingEdges.map((edge) => {
                const targetNode = allNodes.find((n) => n.id === edge.target);
                const targetLabel = (targetNode?.data?.config?.label ?? targetNode?.data?.text ?? edge.target) as string;
                const targetBehavior = targetNode?.data?.componentType ? BEHAVIORS[targetNode.data.componentType] : null;
                const targetColor = targetBehavior?.meta.color ?? '#94a3b8';
                const pct = getEdgePct(edge);

                return (
                  <div key={edge.id} className="p-3 rounded-lg bg-white/4 border border-white/8 space-y-2">
                    {/* Target label + percentage */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: targetColor }} />
                        <span className="text-[11px] font-medium text-white/80 truncate">{targetLabel}</span>
                      </div>
                      <span className="text-[11px] font-mono font-semibold" style={{ color: targetColor }}>
                        {pct}%
                      </span>
                    </div>

                    {/* Percentage slider — 0 to 100% */}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={pct}
                      onChange={(e) => onUpdateEdgePct(edge.id, Number(e.target.value))}
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
                      style={{
                        accentColor: targetColor,
                        background: `linear-gradient(to right, ${targetColor} ${pct}%, rgba(255,255,255,0.05) 0%)`
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>

      {/* Delete */}
      <div className="px-4 py-3 border-t border-white/8">
        <button
          onClick={() => onDelete(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 hover:border-red-500/40 transition-all"
          data-testid="config-delete-btn"
        >
          <Trash2 size={13} />
          Delete Component
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

function DatabaseCapacitySlider({
  label, currentRps, onChange
}: {
  label: string; currentRps: number; onChange: (v: number) => void;
}) {
  // Find closest index
  const currentIndex = DB_CAPACITY_LEVELS.reduce((prev, curr, idx) => {
    return Math.abs(curr.rps - currentRps) < Math.abs(DB_CAPACITY_LEVELS[prev].rps - currentRps) ? idx : prev;
  }, 0);

  const level = DB_CAPACITY_LEVELS[currentIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-white/60 font-semibold tracking-wide uppercase">{label}</label>
        <div className="flex flex-col items-end">
          <span className="text-[13px] font-bold" style={{ color: level.color }}>{level.label}</span>
          <span className="text-[11px] font-mono text-white/40">{formatQps(level.rps)} RPS</span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={DB_CAPACITY_LEVELS.length - 1}
        step={1}
        value={currentIndex}
        onChange={(e) => onChange(DB_CAPACITY_LEVELS[Number(e.target.value)].rps)}
        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
        style={{
          accentColor: level.color,
          background: `linear-gradient(to right, ${level.color} ${(currentIndex / (DB_CAPACITY_LEVELS.length - 1)) * 100}%, rgba(255,255,255,0.05) 0%)`
        }}
      />

      <div className="p-2.5 rounded-lg bg-black/20 border border-white/5 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
        <Database size={12} className="mt-0.5 text-white/20" />
        <p className="text-[10px] text-white/50 leading-relaxed italic">
          "{level.meaning}"
        </p>
      </div>
    </div>
  );
}

function TrafficSlider({
  label, currentRps, onChange
}: {
  label: string; currentRps: number; onChange: (v: number) => void;
}) {
  // Find closest index
  const currentIndex = TRAFFIC_LEVELS.reduce((prev, curr, idx) => {
    return Math.abs(curr.rps - currentRps) < Math.abs(TRAFFIC_LEVELS[prev].rps - currentRps) ? idx : prev;
  }, 0);

  const level = TRAFFIC_LEVELS[currentIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-white/60 font-semibold tracking-wide uppercase">{label}</label>
        <div className="flex flex-col items-end">
          <span className="text-[13px] font-bold" style={{ color: level.color }}>{level.label}</span>
          <span className="text-[11px] font-mono text-white/40">{formatQps(level.rps)} RPS</span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={TRAFFIC_LEVELS.length - 1}
        step={1}
        value={currentIndex}
        onChange={(e) => onChange(TRAFFIC_LEVELS[Number(e.target.value)].rps)}
        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-sky-500"
        style={{
          accentColor: level.color,
          background: `linear-gradient(to right, ${level.color} ${(currentIndex / (TRAFFIC_LEVELS.length - 1)) * 100}%, rgba(255,255,255,0.05) 0%)`
        }}
      />

      <div className="p-2.5 rounded-lg bg-black/20 border border-white/5 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
        <Info size={12} className="mt-0.5 text-white/20" />
        <p className="text-[10px] text-white/50 leading-relaxed italic">
          "{level.meaning}"
        </p>
      </div>
    </div>
  );
}

function SliderField({
  label, hint, sliderValue, displayValue, min, max, step, accentColor, onChange, testId,
}: {
  label: string; hint?: string; sliderValue: number; displayValue: string;
  min: number; max: number; step: number; accentColor: string;
  onChange: (v: number) => void; testId?: string;
}) {
  const percentage = ((sliderValue - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <label className="text-[11px] text-white/60">{label}</label>
          {hint && <span title={hint} className="cursor-help text-white/30 hover:text-white/50"><Info size={10} /></span>}
        </div>
        <span className="text-[11px] font-mono font-semibold" style={{ color: accentColor }}>{displayValue}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={sliderValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
        style={{
          accentColor,
          background: `linear-gradient(to right, ${accentColor} ${percentage}%, rgba(255,255,255,0.05) 0%)`
        }}
        data-testid={testId}
      />
    </div>
  );
}

function ObjectStorageCapacitySlider({
  label, currentRps, onChange
}: {
  label: string; currentRps: number; onChange: (v: number) => void;
}) {
  const currentIndex = OBJECT_STORAGE_LEVELS.reduce((prev, curr, idx) => {
    return Math.abs(curr.rps - currentRps) < Math.abs(OBJECT_STORAGE_LEVELS[prev].rps - currentRps) ? idx : prev;
  }, 0);

  const level = OBJECT_STORAGE_LEVELS[currentIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-white/60 font-semibold tracking-wide uppercase">{label}</label>
        <div className="flex flex-col items-end">
          <span className="text-[13px] font-bold" style={{ color: level.color }}>{level.label}</span>
          <span className="text-[11px] font-mono text-white/40">{formatQps(level.rps)} RPS</span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={OBJECT_STORAGE_LEVELS.length - 1}
        step={1}
        value={currentIndex}
        onChange={(e) => onChange(OBJECT_STORAGE_LEVELS[Number(e.target.value)].rps)}
        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
        style={{
          accentColor: level.color,
          background: `linear-gradient(to right, ${level.color} ${(currentIndex / (OBJECT_STORAGE_LEVELS.length - 1)) * 100}%, rgba(255,255,255,0.05) 0%)`
        }}
      />

      <div className="p-2.5 rounded-lg bg-black/20 border border-white/5 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
        <HardDrive size={12} className="mt-0.5 text-white/20" />
        <p className="text-[10px] text-white/50 leading-relaxed italic">
          "{level.meaning}"
        </p>
      </div>
    </div>
  );
}
