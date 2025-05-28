import { redis } from './redis';

export class RateLimiter {
  static async checkRateLimit(
    userId: string,
    limit: number = 10,
    windowMs: number = 60000,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:${userId}`;
    const window = Math.floor(Date.now() / windowMs);
    const windowKey = `${key}:${window}`;

    const current = await redis.incr(windowKey);

    if (current === 1) {
      await redis.expire(windowKey, Math.ceil(windowMs / 1000));
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  }
}
