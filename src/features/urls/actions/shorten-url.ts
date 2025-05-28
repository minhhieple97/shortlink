'use server';

import { checkUrlSafety, ensureHttps } from '../services';
import { db } from '@/db';
import { urls } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { ActionError, authAction } from '@/lib/safe-action';
import { UrlFormSchema } from '../schemas';
import { isAdmin } from '@/lib/utils';
import { env } from '@/env';
import { CACHE_TTL, URL_SAFETY, SHORT_CODE } from '@/constants';
import { routes } from '@/routes';
import { redis } from '@/lib/redis';
import { ShortCodeGenerator } from '@/lib/short-code-generator';
import { eq } from 'drizzle-orm';
import { RateLimiter } from '@/lib/rate-limiter';

export const shortenUrl = authAction
  .schema(UrlFormSchema)
  .action(async ({ parsedInput: { url, customCode }, ctx }) => {
    const { user } = ctx;

    const rateLimitResult = await RateLimiter.checkRateLimit(user.id);

    if (!rateLimitResult.allowed) {
      throw new ActionError(
        `Rate limit exceeded. Try again in a minute. Remaining: ${rateLimitResult.remaining}`,
      );
    }

    const originalUrl = ensureHttps(url);
    const userIsAdmin = isAdmin(user);

    const [shortCode, safetyCheck] = await Promise.all([
      generateShortCode(customCode),
      checkUrlSafety(originalUrl),
    ]);

    const { flagged, flagReason, shouldBlock } = processSafetyCheck(safetyCheck, userIsAdmin);

    if (shouldBlock) {
      await cleanupShortCode(shortCode);
      throw new ActionError('This URL is flagged as malicious');
    }

    try {
      await db.transaction(async (tx) => {
        const [result] = await tx
          .insert(urls)
          .values({
            originalUrl,
            shortCode,
            userId: user.id,
            flagged,
            flagReason,
          })
          .returning()
          .catch(async (error) => {
            if (error.code === '23505') {
              throw new ActionError('Short code collision detected');
            }
            throw error;
          });

        return result;
      });

      const baseUrl = env.NEXT_PUBLIC_APP_URL;
      const shortUrl = `${baseUrl}/r/${shortCode}`;

      const cacheData = {
        originalUrl,
        flagged,
        flagReason,
        userId: user.id,
        clicks: 0,
      };

      await Promise.all([
        redis.hset(`url:${shortCode}`, cacheData),
        redis.expire(`url:${shortCode}`, CACHE_TTL.URL_MAPPING),
      ]);

      revalidatePath(routes.dashboard.root);

      return {
        shortUrl,
        flagged,
        flagReason,
      };
    } catch (error) {
      await cleanupShortCode(shortCode);
      throw error;
    }
  });

const generateShortCode = async (customCode?: string): Promise<string> => {
  if (customCode) {
    const isAvailable = await ShortCodeGenerator.isCodeAvailable(customCode);
    if (!isAvailable) {
      throw new ActionError('Custom code already exists');
    }

    const reserved = await ShortCodeGenerator.reserveCode(customCode);
    if (!reserved) {
      throw new ActionError('Custom code was taken by another user');
    }

    return customCode;
  }

  return ShortCodeGenerator.generateUniqueCode();
};

const processSafetyCheck = (
  safetyCheck: Awaited<ReturnType<typeof checkUrlSafety>>,
  userIsAdmin: boolean,
): { flagged: boolean; flagReason: string | null; shouldBlock: boolean } => {
  if (!safetyCheck.success || !safetyCheck.data) {
    return { flagged: false, flagReason: null, shouldBlock: false };
  }

  const { flagged, reason, category, confidence } = safetyCheck.data;

  const shouldBlock =
    category === URL_SAFETY.CATEGORIES.MALICIOUS &&
    confidence > URL_SAFETY.CONFIDENCE_THRESHOLD &&
    !userIsAdmin;

  return {
    flagged,
    flagReason: reason,
    shouldBlock,
  };
};

const cleanupShortCode = async (shortCode: string): Promise<void> => {
  await redis.srem(SHORT_CODE.REDIS_SET_KEY, shortCode);
};
