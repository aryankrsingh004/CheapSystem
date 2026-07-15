import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatQps(qps: number): string {
  if (qps >= 1_000_000) return `${(qps / 1_000_000).toFixed(1)}M`;
  if (qps >= 1_000) return `${(qps / 1_000).toFixed(1)}K`;
  return `${Math.round(qps)}`;
}
