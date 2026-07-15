import React from 'react';
import { type Node, useReactFlow } from '@xyflow/react';
import {
  AlignLeft, AlignCenter, AlignRight,
  Copy, Trash2, Link, Pencil, Type, Code, Baseline
} from 'lucide-react';
import type { TextNodeData } from './TextNode';
import { FONT_FAMILY_MAP } from './TextNode';
import { useHistory } from '@/context/HistoryContext';

interface TextConfigPanelProps {
  node: Node<TextNodeData>;
  onClose: () => void;
}

const COLORS = [
  '#e9ecef', '#ff8787', '#69db7c', '#4dabf7', '#ffd43b',
];

const FONT_FAMILIES: { id: string; label: string }[] = [
  { id: 'serif', label: 'Serif' },
  { id: 'slab', label: 'Slab Serif' },
  { id: 'script', label: 'Script' },
  { id: 'display', label: 'Display' },
];

const FONT_SIZES: { id: string; label: string; size: number }[] = [
  { id: 'S', label: 'S', size: 14 },
  { id: 'M', label: 'M', size: 20 },
  { id: 'L', label: 'L', size: 28 },
  { id: 'XL', label: 'XL', size: 36 },
];

const ALIGNS: { id: TextNodeData['align']; icon: any }[] = [
  { id: 'left', icon: AlignLeft },
  { id: 'center', icon: AlignCenter },
  { id: 'right', icon: AlignRight },
];

export function TextConfigPanel({ node, onClose }: TextConfigPanelProps) {
  const { setNodes } = useReactFlow();
  const { takeSnapshot } = useHistory();
  const data = node.data;

  const updateData = (patch: Partial<TextNodeData>) => {
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
        position: { x: node.position.x + 20, y: node.position.y + 20 },
        selected: true,
      };
      return nds.map(n => ({ ...n, selected: false })).concat([newNode]);
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 w-52 bg-[#232329] border border-white/5 rounded-xl shadow-2xl text-white/90 select-none">
      {/* Stroke (Color) */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Stroke</label>
        <div className="flex gap-1.5 items-center">
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
              type="color" value={data.color || '#e2e8f0'}
              onChange={(e) => updateData({ color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
            />
          </div>
        </div>
      </div>

      {/* Font Family */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Font family</label>
        <div className="flex gap-1.5 items-center bg-black/20 p-1 rounded-lg">
          {/* Quick Fonts */}
          <div className="flex flex-1 gap-1">
            {[
              { id: 'handwritten', icon: Pencil },
              { id: 'sans', icon: Type },
              { id: 'mono', icon: Code },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => updateData({ fontFamily: f.id })}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${data.fontFamily === f.id ? 'bg-[#3b3b4d] text-[#a8a4ff]' : 'text-white/30 hover:text-white/60'
                  }`}
              >
                <f.icon size={14} />
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/5 mx-0.5" />

          {/* Dropdown for All Fonts */}
          <div className="relative group/font">
            <button className={`w-9 h-9 rounded-md flex items-center justify-center transition-all border border-transparent ${!['sans', 'handwritten', 'mono'].includes(data.fontFamily || '') ? 'bg-[#3b3b4d] text-[#a8a4ff]' : 'text-white/30 hover:text-white/60 hover:bg-black/30 hover:border-white/5'
              }`}>
              <div className="relative flex flex-col items-center">
                <Baseline size={16} className="-mb-0.5" />
                <div className="absolute -bottom-1 -right-2 bg-[#a8a4ff]/20 rounded-full p-0.5 group-hover/font:bg-[#a8a4ff]/30 transition-colors">
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </button>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={['sans', 'handwritten', 'mono'].includes(data.fontFamily || '') ? '' : data.fontFamily}
              onChange={(e) => updateData({ fontFamily: e.target.value })}
            >
              <option value="" disabled>Other fonts...</option>
              {FONT_FAMILIES.map((f) => (
                <option
                  key={f.id}
                  value={f.id}
                  className="bg-[#232329] text-white py-2"
                  style={{ fontFamily: FONT_FAMILY_MAP[f.id] }}
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Font size</label>
        <div className="flex bg-black/20 p-1 rounded-md">
          {FONT_SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => updateData({ fontSize: s.size })}
              className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${data.fontSize === s.size ? 'bg-[#3b3b4d] text-[#a8a4ff]' : 'text-white/30 hover:text-white/60'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Text align</label>
        <div className="flex bg-black/20 p-1 rounded-md">
          {ALIGNS.map((a) => (
            <button
              key={a.id}
              onClick={() => updateData({ align: a.id })}
              className={`flex-1 flex items-center justify-center py-1.5 rounded transition-all ${data.align === a.id ? 'bg-[#3b3b4d] text-[#a8a4ff]' : 'text-white/30 hover:text-white/60'
                }`}
            >
              <a.icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center px-0.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/30 uppercase">Opacity</label>
          <span className="text-[9px] font-mono text-white/20">{data.opacity || 100}</span>
        </div>
        <input
          type="range" min="0" max="100" value={data.opacity || 100}
          onChange={(e) => updateData({ opacity: parseInt(e.target.value) })}
          className="w-full accent-[#6965db] h-1 bg-black/30 rounded appearance-none cursor-pointer"
        />
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
          <button title="Copy link" className="flex-1 flex items-center justify-center p-2 rounded-md bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all border border-white/5">
            <Link size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
