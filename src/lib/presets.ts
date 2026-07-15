import { type Node, type Edge } from '@xyflow/react';

// Use Vite's glob import to automatically pick up any .json files in the presets folder
const modules = import.meta.glob('./presets/*.json', { eager: true });

export type Preset = {
  id: string;
  name: string;
  description: string;
  data: {
    nodes: Node[];
    edges: Edge[];
    viewport?: { x: number; y: number; zoom: number };
  };
};

export const PRESETS: Preset[] = Object.entries(modules).map(([path, module]: [string, any]) => {
  const filename = path.split('/').pop()?.replace('.json', '') || 'unnamed';

  // Create a human-readable name from the filename (e.g., "urlShortner" -> "Url Shortner")
  const displayName = filename
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  // Try to find a description or text node to use as a subtitle
  const textNode = module.default.nodes?.find((n: any) => n.type === 'textNode');
  const description = textNode?.data?.text?.slice(0, 60) + (textNode?.data?.text?.length > 60 ? '...' : '') || 'System architecture layout';

  return {
    id: filename,
    name: displayName,
    description,
    data: module.default,
  };
});

// For backward compatibility or default usage
export const WELCOME_PRESET = PRESETS[0]?.data || { nodes: [], edges: [] };
export const URL_SHORTENER_PRESET = PRESETS.find(p => p.id === 'urlShortner')?.data || WELCOME_PRESET;
export const TINDER_PRESET = PRESETS.find(p => p.id === 'tinder')?.data || WELCOME_PRESET;