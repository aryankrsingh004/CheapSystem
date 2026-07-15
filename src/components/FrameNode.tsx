import { type NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';

export interface FrameNodeData extends Record<string, unknown> {
  label: string;
  w: number;
  h: number;
  color: string;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderWidth?: number;
  opacity: number; // 0 to 100
}

export function FrameNode({ id, data, selected }: NodeProps) {
  const d = data as FrameNodeData;
  const color = d.color ?? '#ffffff';
  const borderStyle = d.borderStyle ?? 'dashed';
  const borderWidth = d.borderWidth ?? 2;
  const opacity = d.opacity ?? 5;
  const { setNodes } = useReactFlow();

  const handleResize = (_e: any, params: { width: number; height: number }) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                w: params.width,
                h: params.height,
              },
              style: {
                ...n.style,
                width: params.width,
                height: params.height,
              },
            }
          : n
      )
    );
  };

  return (
    <div className="w-full h-full relative select-none pointer-events-auto group">
      {/* NodeResizer - visible only when selected */}
      <NodeResizer
        color={color}
        minWidth={120}
        minHeight={80}
        isVisible={selected}
        onResize={handleResize}
        keepAspectRatio={false}
      />

      {/* Translucent background overlay */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300"
        style={{
          backgroundColor: color,
          opacity: opacity / 100,
        }}
      />

      {/* Styled border overlay */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300"
        style={{
          borderWidth: borderWidth,
          borderStyle: borderStyle,
          borderColor: color,
          opacity: selected ? 0.8 : 0.35,
        }}
      />
    </div>
  );
}
