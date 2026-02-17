import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes

export const cacheService = {
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  },

  set<T>(key: string, value: T): void {
    cache.set(key, value);
  },

  has(key: string): boolean {
    return cache.has(key);
  },
};
