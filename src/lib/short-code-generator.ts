import { nanoid, customAlphabet } from 'nanoid';
import { redis } from './redis';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const generateId = customAlphabet(ALPHABET, 7);

export class ShortCodeGenerator {
  private static readonly MAX_RETRIES = 5;
  private static readonly REDIS_SET_KEY = 'used_short_codes';

  static async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const shortCode = generateId();

      const isUnique = await redis.sadd(this.REDIS_SET_KEY, shortCode);

      if (isUnique === 1) {
        await redis.expire(`shortcode:${shortCode}`, 60 * 60 * 24 * 30); // 30 days
        return shortCode;
      }
    }

    throw new Error('Failed to generate unique short code after maximum retries');
  }

  static async isCodeAvailable(customCode: string): Promise<boolean> {
    const exists = await redis.sismember(this.REDIS_SET_KEY, customCode);
    return exists === 0;
  }

  static async reserveCode(shortCode: string): Promise<boolean> {
    const reserved = await redis.sadd(this.REDIS_SET_KEY, shortCode);
    return reserved === 1;
  }
}
