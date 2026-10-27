import { createHash } from 'node:crypto';

export const AUTH_FAILURE_LIMIT = 5;
export const AUTH_FAILURE_WINDOW_MS = 15 * 60_000;

type Bucket = number[];

const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, now: number): Bucket {
  return bucket.filter((timestamp) => now - timestamp < AUTH_FAILURE_WINDOW_MS);
}

function getBucket(key: string, now = Date.now()): Bucket {
  const current = buckets.get(key);
  if (!current) return [];
  const pruned = prune(current, now);
  if (pruned.length === 0) {
    buckets.delete(key);
  } else {
    buckets.set(key, pruned);
  }
  return pruned;
}

/** Clave estable para limitar por email sin guardar el email en claro. */
export function emailRateLimitKey(email: string): string {
  return createHash('sha256')
    .update(email.trim().toLowerCase(), 'utf8')
    .digest('hex');
}

export function recordAuthFailure(key: string, now = Date.now()): void {
  const bucket = prune(getBucket(key, now), now);
  bucket.push(now);
  buckets.set(key, bucket);
}

export function isAuthRateLimited(key: string, now = Date.now()): boolean {
  return getBucket(key, now).length >= AUTH_FAILURE_LIMIT;
}

export function retryAfterSeconds(key: string, now = Date.now()): number {
  const bucket = getBucket(key, now);
  if (bucket.length === 0) return 0;
  const oldest = Math.min(...bucket);
  return Math.max(1, Math.ceil((AUTH_FAILURE_WINDOW_MS - (now - oldest)) / 1000));
}

/** Solo para tests: limpia las ventanas en memoria. */
export function resetRateLimitStore(): void {
  buckets.clear();
}
