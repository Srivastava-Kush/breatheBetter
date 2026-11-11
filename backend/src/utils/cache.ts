/**
 * In-memory TTL Cache with LRU-like eviction.
 * Protects third-party API rate limits and accelerates back-to-back requests to sub-millisecond latencies.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds = 600): void {
    if (this.store.size >= this.maxEntries) {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (v.expiresAt <= now) {
          this.store.delete(k);
        }
      }
      if (this.store.size >= this.maxEntries) {
        const firstKey = this.store.keys().next().value;
        if (firstKey) this.store.delete(firstKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  flush(): void {
    this.store.clear();
  }
}

export const apiCache = new MemoryCache(1000);
