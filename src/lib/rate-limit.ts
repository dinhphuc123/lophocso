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

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}
