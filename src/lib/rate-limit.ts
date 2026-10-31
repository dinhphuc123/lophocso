declare global {
  var __rateHits: Map<string, number[]> | undefined;
}

const hits = (globalThis.__rateHits ??= new Map<string, number[]>());

/** Sliding-window limiter, in-memory. shortcut: per-process only, use Redis when running several instances. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Periodic cleanup: remove stale keys to avoid slow memory leaks */
export function pruneRateLimits(windowMs = 60_000): void {
  const now = Date.now();
  for (const [k, timestamps] of hits.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) hits.delete(k);
    else hits.set(k, valid);
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}
