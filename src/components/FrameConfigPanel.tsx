import React from 'react';
import { type Node, useReactFlow } from '@xyflow/react';
import { Copy, Trash2, Link, Layers, Sliders } from 'lucide-react';
import { useHistory } from '@/context/HistoryContext';
import type { FrameNodeData } from './FrameNode';

interface FrameConfigPanelProps {
  node: Node<FrameNodeData>;
  onClose: () => void;
}

const COLORS = [
  '#ffffff', // white
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
];

const BORDER_STYLES: { id: FrameNodeData['borderStyle']; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
];

export function FrameConfigPanel({ node, onClose }: FrameConfigPanelProps) {
  const { setNodes } = useReactFlow();
  const { takeSnapshot } = useHistory();
  const data = node.data;

  const updateData = (patch: Partial<FrameNodeData>) => {
    takeSnapshot();
    setNodes((nds) =>
      nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, ...patch } } : n))
    );
  };

  const deleteNode = () => {
    takeSnapshot();
    setNodes((nds) => nds.filter((n) => n.id !== node.id));
    onClose();
  };

  const duplicateNode = () => {
    takeSnapshot();
    setNodes((nds) => {
      const newNode = {
        ...node,
        id: `node-${Date.now()}`,
        position: { x: node.position.x + 30, y: node.position.y + 30 },
        selected: true,
      };
      return nds.map(n => ({ ...n, selected: false })).concat([newNode]);
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 w-52 bg-[#232329] border border-white/5 rounded-xl shadow-2xl text-white/90 select-none">
      {/* Theme Color */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Theme Color</label>
        <div className="flex flex-wrap gap-1.5 items-center">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateData({ color: c })}
              className={`w-6 h-6 rounded-md border transition-all duration-200 ${data.color === c ? 'border-[#6965db] scale-110' : 'border-transparent'
                }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="relative w-6 h-6 rounded-md border border-transparent overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500">
            <input
              type="color"
              value={data.color || '#3b82f6'}
              onChange={(e) => updateData({ color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
            />
          </div>
        </div>
      </div>

      {/* Border Style */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Border Style</label>
        <div className="flex bg-black/20 p-1 rounded-md">
          {BORDER_STYLES.map((b) => (
            <button
              key={b.id}
              onClick={() => updateData({ borderStyle: b.id })}
              className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${data.borderStyle === b.id ? 'bg-[#3b3b4d] text-[#a8a4ff]' : 'text-white/30 hover:text-white/60'
                }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Border Width Selector */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-0.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Border Width</label>
          <span className="text-[9px] font-mono text-white/20">{data.borderWidth ?? 2}px</span>
        </div>
        <div className="flex bg-black/20 p-1 rounded-md gap-1">
          {[
            { value: 1, label: 'Thin', svgWidth: 1 },
            { value: 2, label: 'Medium', svgWidth: 2.5 },
            { value: 4, label: 'Thick', svgWidth: 4.5 },
            { value: 8, label: 'Heavy', svgWidth: 8 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => updateData({ borderWidth: item.value })}
              title={item.label}
              className={`flex-1 flex items-center justify-center py-2.5 rounded transition-all ${
                (data.borderWidth ?? 2) === item.value
                  ? 'bg-[#3b3b4d] text-[#a8a4ff]'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              <svg className="w-5 h-2" viewBox="0 0 20 8">
                <line
                  x1="2"
                  y1="4"
                  x2="18"
                  y2="4"
                  stroke="currentColor"
                  strokeWidth={item.svgWidth}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Bg Opacity Selector */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-0.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Bg Opacity</label>
          <span className="text-[9px] font-mono text-white/20">{data.opacity ?? 5}%</span>
        </div>
        <div className="flex bg-black/20 p-1 rounded-md gap-1">
          {[
            { value: 0, label: 'None', opacity: 0 },
            { value: 5, label: 'Subtle', opacity: 0.08 },
            { value: 15, label: 'Moderate', opacity: 0.22 },
            { value: 30, label: 'Heavy', opacity: 0.45 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => updateData({ opacity: item.value })}
              title={item.label}
              className={`flex-1 flex items-center justify-center py-2 rounded transition-all ${
                (data.opacity ?? 5) === item.value
                  ? 'bg-[#3b3b4d] text-[#a8a4ff]'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <rect x="2" y="2" width="12" height="12" rx="2" strokeWidth="1.5" />
                {item.value > 0 && (
                  <rect
                    x="2"
                    y="2"
                    width="12"
                    height="12"
                    rx="2"
                    fill="currentColor"
                    fillOpacity={item.opacity}
                    stroke="none"
                  />
                )}
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/5 w-full my-0.5" />

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Actions</label>
        <div className="flex gap-1.5">
          <button onClick={duplicateNode} title="Duplicate" className="flex-1 flex items-center justify-center p-2 rounded-md bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all border border-white/5">
            <Copy size={14} />
          </button>
          <button onClick={deleteNode} title="Delete" className="flex-1 flex items-center justify-center p-2 rounded-md bg-red-500/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all border border-red-500/5">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
