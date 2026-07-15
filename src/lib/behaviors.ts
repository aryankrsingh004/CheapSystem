/**
 * ─── Node Behaviors ───────────────────────────────────────────────────────────
 *
 * Each entry in BEHAVIORS defines:
 *   meta          – visual / display metadata
 *   defaultConfig – default ComponentConfig values
 *   configFields  – ordered list of UI slider definitions
 */

import type { ComponentType, ComponentConfig } from '@/types/simulator';
import { formatQps } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfigFieldDef {
  key: keyof ComponentConfig;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  format: (storedValue: number) => string;
  fromSlider: (sliderValue: number) => number;
  toSlider: (storedValue: number) => number;
  accentColor: string;
}

export interface NodeMeta {
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  /** Geometric shape rendered for this component */
  shape: 'rect' | 'circle' | 'tall-rect' | 'small-rect' | 'bucket' | 'queue';
  /** Which handle sides this node type has */
  handles: ('left' | 'right')[];
  behaviorTag: (config: ComponentConfig) => string;
}

export interface NodeBehavior {
  meta: NodeMeta;
  defaultConfig: ComponentConfig;
  configFields: ConfigFieldDef[];
}

// ─── BEHAVIORS registry ───────────────────────────────────────────────────────

export const BEHAVIORS: Record<ComponentType, NodeBehavior> = {
  client: {
    meta: {
      icon: 'monitor',
      color: '#38bdf8',
      bgColor: 'rgba(56,189,248,0.10)',
      description: 'End-user clients generating requests into the system',
      shape: 'small-rect',
      handles: ['left', 'right'],
      behaviorTag: (cfg) => {
        const total = cfg.qpsLimit * cfg.replicas;
        return `${formatQps(total)} total/s`;
      },
    },
    defaultConfig: { label: 'Client', qpsLimit: 10000, replicas: 1 },
    configFields: [],
  },

  appServer: {
    meta: {
      icon: 'server',
      color: '#34d399',
      bgColor: 'rgba(52,211,153,0.10)',
      description: 'App server — receives and processes traffic from upstream nodes',
      shape: 'rect',
      handles: ['left', 'right'],
      behaviorTag: (cfg) =>
        `${formatQps(cfg.qpsLimit * cfg.replicas)}/s · ${cfg.replicas} replica${cfg.replicas !== 1 ? 's' : ''}`,
    },
    defaultConfig: { label: 'App Server', qpsLimit: 5000, replicas: 1 },
    configFields: [],
  },

  apiGateway: {
    meta: {
      icon: 'shield',
      color: '#8b5cf6',
      bgColor: 'rgba(139,92,246,0.10)',
      description: 'API Gateway — entry point for routing client requests to backend services',
      shape: 'tall-rect',
      handles: ['left', 'right'],
      behaviorTag: (cfg) =>
        `${formatQps(cfg.qpsLimit * cfg.replicas)}/s · ${cfg.replicas} replica${cfg.replicas !== 1 ? 's' : ''}`,
    },
    defaultConfig: { label: 'API Gateway', qpsLimit: 20000, replicas: 1 },
    configFields: [],
  },

  loadBalancer: {
    meta: {
      icon: 'shuffle',
      color: '#f97316',
      bgColor: 'rgba(249,115,22,0.10)',
      description: 'Load Balancer — distributes incoming traffic equally across connected downstream nodes',
      shape: 'rect',
      handles: ['left', 'right'],
      behaviorTag: () => `Distributes load equally`,
    },
    defaultConfig: { label: 'Load Balancer', qpsLimit: 50000, replicas: 1 },
    configFields: [],
  },

  cache: {
    meta: {
      icon: 'zap',
      color: '#e879f9',
      bgColor: 'rgba(232,121,249,0.10)',
      description: 'Cache — high-speed read layer, reduces database load',
      shape: 'circle',
      handles: ['left'],
      behaviorTag: (cfg) => {
        const hit = cfg.cacheHitRatio ?? 0.8;
        return `${Math.round(hit * 100)}% hit · ${formatQps(cfg.qpsLimit * cfg.replicas)}/s`;
      },
    },
    defaultConfig: { label: 'Cache', qpsLimit: 50000, replicas: 1, cacheHitRatio: 0.8 },
    configFields: [],
  },

  database: {
    meta: {
      icon: 'database',
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.10)',
      description: 'Database — terminal data store receiving queries from services',
      shape: 'circle',
      handles: ['left', 'right'],
      behaviorTag: (cfg) =>
        `${formatQps(cfg.qpsLimit * cfg.replicas)}/s · ${cfg.replicas} shard${cfg.replicas !== 1 ? 's' : ''}`,
    },
    defaultConfig: { label: 'Database', qpsLimit: 2000, replicas: 1 },
    configFields: [
      {
        key: 'replicas',
        label: 'Shards / Replicas',
        hint: 'Exponential horizontal scaling — each shard handles qpsLimit independently',
        min: 0,
        max: 6,
        step: 1,
        toSlider: (v) => Math.round(Math.log2(Math.max(v, 1))),
        fromSlider: (v) => Math.pow(2, v),
        format: (v) => `${v} shard${v !== 1 ? 's' : ''}`,
        accentColor: '#f59e0b',
      },
    ],
  },

  cronJob: {
    meta: {
      icon: 'clock',
      color: '#a855f7',
      bgColor: 'rgba(168,85,247,0.10)',
      description: 'Periodic background job — generates traffic in bursts (1s on, 1s off)',
      shape: 'small-rect',
      handles: ['left', 'right'],
      behaviorTag: (cfg) => `${formatQps(cfg.qpsLimit)} burst/s`,
    },
    defaultConfig: { label: 'Cron Job', qpsLimit: 1000, replicas: 1 },
    configFields: [],
  },

  cdn: {
    meta: {
      icon: 'globe',
      color: '#38bdf8',
      bgColor: 'rgba(56,189,248,0.10)',
      description: 'CDN — caches content at the edge to reduce origin traffic',
      shape: 'circle',
      handles: ['left', 'right'],
      behaviorTag: (cfg) => `${cfg.reduction ?? 80}% reduction`,
    },
    defaultConfig: { label: 'CDN', qpsLimit: 1000000, replicas: 1, reduction: 80 },
    configFields: [
      {
        key: 'reduction',
        label: 'Traffic Reduction',
        hint: 'Percentage of traffic absorbed by the CDN. Only the remainder is sent to origin.',
        min: 0,
        max: 100,
        step: 5,
        toSlider: (v) => v ?? 80,
        fromSlider: (v) => v,
        format: (v) => `${v}% offload`,
        accentColor: '#38bdf8',
      },
    ],
  },

  objectStorage: {
    meta: {
      icon: 'hardDrive',
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.10)',
      description: 'Object Storage — scalable store for unstructured data (S3, GCS)',
      shape: 'bucket',
      handles: ['left', 'right'],
      behaviorTag: (cfg) => `${formatQps(cfg.qpsLimit)} peak`,
    },
    defaultConfig: { label: 'Object Storage', qpsLimit: 50000, replicas: 1 },
    configFields: [],
  },

  asyncQueue: {
    meta: {
      icon: 'layers',
      color: '#06b6d4',
      bgColor: 'rgba(6,182,212,0.10)',
      description: 'Async Node — buffers excess traffic, decouples producers from consumers',
      shape: 'queue',
      handles: ['left', 'right'],
      behaviorTag: (cfg) => `${formatQps(cfg.qpsLimit)}/s max outflow`,
    },
    defaultConfig: { label: 'Async Node', qpsLimit: 5000, replicas: 1 },
    configFields: [],
  },
};
