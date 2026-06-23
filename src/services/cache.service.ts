import Redis from 'ioredis';
import { logger } from '../utils/logger';

//TTL constants (seconds)

export const TTL = {
  FILE_META:  5 * 60,   
  USER_FILES: 2 * 60,  
  SIGNED_URL: 14 * 60,  
} as const;



export const CacheKey = {
  file:      (id: string)     => `file:${id}`,
  userFiles: (userId: string) => `user:${userId}:files`,
};

//Redis client 

function getRedis(): Redis {
  const { redis } = require('../config/redis');
  return redis as Redis;
}

//cache service 

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await getRedis().get(key);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch (err) {
      logger.warn({ err, key }, 'Cache GET failed — degrading to DB');
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      logger.warn({ err, key }, 'Cache SET failed — continuing without cache');
    }
  },

  async invalidate(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      await getRedis().del(...keys);
      logger.debug({ keys }, 'Cache invalidated');
    } catch (err) {
      logger.warn({ err, keys }, 'Cache DEL failed');
    }
  },

 async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await getRedis().keys(pattern);
      if (keys.length) await getRedis().del(...keys);
      logger.debug({ pattern, count: keys.length }, 'Cache pattern invalidated');
    } catch (err) {
      logger.warn({ err, pattern }, 'Cache pattern DEL failed');
    }
  },

 
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    const cached = await cache.get<T>(key);
    if (cached !== null) return cached;

    const value = await loader();
    await cache.set(key, value, ttlSeconds);
    return value;
  },
};