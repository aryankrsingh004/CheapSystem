// ─── Component Type Registry ──────────────────────────────────────────────────

export type ComponentType = 'client' | 'apiGateway' | 'loadBalancer' | 'appServer' | 'cache' | 'database' | 'cronJob' | 'cdn' | 'objectStorage' | 'asyncQueue';

// ─── Component Config ─────────────────────────────────────────────────────────

export interface ComponentConfig {
  label: string;
  qpsLimit: number;
  replicas: number;
  writeRatio?: number;      // 0.0–1.0, fraction of traffic that are writes
  cacheHitRatio?: number;   // 0.0–1.0, fraction of reads served from cache
  reduction?: number;       // 0–100, percentage of traffic reduced by CDN
}
