'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { urls } from '@/db/schema';
import { redis } from '@/lib/redis';
import { CACHE_TTL } from '@/constants';
import { queueClickIncrement } from '../services';

type CachedUrlData = {
  originalUrl: string;
  flagged: boolean;
  flagReason: string | null;
  userId: string | null;
  clicks: number;
};

export const getUrlByShortCode = async (shortCode: string) => {
  const cached = await redis.hgetall(`url:${shortCode}`);

  if (cached && Object.keys(cached).length > 0) {
    const urlData = {
      originalUrl: cached.originalUrl,
      flagged: cached.flagged === 'true',
      flagReason: cached.flagReason === 'null' ? null : cached.flagReason,
      userId: cached.userId === 'null' ? null : cached.userId,
      clicks: parseInt((cached.clicks as string) || '0', 10),
    } as CachedUrlData;

    await queueClickIncrement(shortCode);

    return {
      originalUrl: urlData.originalUrl,
      flagged: urlData.flagged,
      flagReason: urlData.flagReason,
    };
  }

  const url = await db.query.urls.findFirst({
    where: eq(urls.shortCode, shortCode),
  });

  if (!url) {
    return null;
  }

  const updatedClicks = url.clicks + 1;

  await redis.hset(`url:${shortCode}`, {
    originalUrl: url.originalUrl,
    flagged: (url.flagged || false).toString(),
    flagReason: url.flagReason || 'null',
    userId: url.userId || 'null',
    clicks: updatedClicks.toString(),
  });
  await redis.expire(`url:${shortCode}`, CACHE_TTL.URL_MAPPING);

  await queueClickIncrement(shortCode);

  return {
    originalUrl: url.originalUrl,
    flagged: url.flagged || false,
    flagReason: url.flagReason || null,
  };
};

