'use server';

import { checkUrlSafety, ensureHttps } from '../services';
import { db } from '@/db';
import { urls } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { ActionError, authAction } from '@/lib/safe-action';
import { UrlFormSchema } from '../schemas';
import { isAdmin } from '@/lib/utils';
import { env } from '@/env';
import { CACHE_TTL, URL_SAFETY } from '@/constants';
import { routes } from '@/routes';
import { redis } from '@/lib/redis';
import { ShortCodeGenerator } from '@/lib/short-code-generator';
import { eq } from 'drizzle-orm';
import { RateLimiter } from '@/lib/rate-limiter';

export const shortenUrl = authAction
  .schema(UrlFormSchema)
  .action(async ({ parsedInput: { url, customCode }, ctx }) => {
    const { user } = ctx;
    const rateLimitResult = await RateLimiter.checkRateLimit(user.id, 100, 60 * 1000);

    if (!rateLimitResult.allowed) {
      throw new ActionError(
        `Rate limit exceeded. Try again in a minute. Remaining: ${rateLimitResult.remaining}`,
      );
    }
    const originalUrl = ensureHttps(url);

    let shortCode: string;

    if (customCode) {
      const isAvailable = await ShortCodeGenerator.isCodeAvailable(customCode);
      if (!isAvailable) {
        throw new ActionError('Custom code already exists');
      }

      const reserved = await ShortCodeGenerator.reserveCode(customCode);
      if (!reserved) {
        throw new ActionError('Custom code was taken by another user');
      }

      shortCode = customCode;
    } else {
      shortCode = await ShortCodeGenerator.generateUniqueCode();
    }

    const safetyCheck = await checkUrlSafety(originalUrl);
    let flagged = false;
    let flagReason = null;

    if (safetyCheck.success && safetyCheck.data) {
      flagged = safetyCheck.data.flagged;
      flagReason = safetyCheck.data.reason;

      if (
        safetyCheck.data.category === URL_SAFETY.CATEGORIES.MALICIOUS &&
        safetyCheck.data.confidence > URL_SAFETY.CONFIDENCE_THRESHOLD &&
        !isAdmin(user)
      ) {
        await redis.srem('used_short_codes', shortCode);
        throw new ActionError('This URL is flagged as malicious');
      }
    }

    try {
      await db.transaction(async (tx) => {
        // Double-check in database (defense in depth)
        const existingUrl = await tx.query.urls.findFirst({
          where: eq(urls.shortCode, shortCode),
        });

        if (existingUrl) {
          throw new ActionError('Short code collision detected');
        }

        // Insert the new URL
        const [insertedUrl] = await tx
          .insert(urls)
          .values({
            originalUrl,
            shortCode,
            userId: user.id,
            flagged,
            flagReason,
          })
          .returning();

        return insertedUrl;
      });

      // Cache the mapping for fast lookups
      const cacheData = {
        originalUrl,
        flagged,
        flagReason,
        userId: user.id,
        clicks: 0,
      };

      await redis.setex(`url:${shortCode}`, CACHE_TTL.URL_MAPPING, JSON.stringify(cacheData));

      const baseUrl = env.NEXT_PUBLIC_APP_URL;
      const shortUrl = `${baseUrl}/r/${shortCode}`;

      revalidatePath(routes.dashboard.root);

      return {
        shortUrl,
        flagged,
        flagReason,
      };
    } catch (error) {
      // Clean up reserved code on failure
      await redis.srem('used_short_codes', shortCode);
      throw error;
    }
  });
