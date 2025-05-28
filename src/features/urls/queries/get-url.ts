'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { urls } from '@/db/schema';
import { redis } from '@/lib/redis';
import { CACHE_TTL } from '@/constants';

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

    incrementClicksAsync(shortCode, urlData.clicks);

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

  await Promise.all([
    db
      .update(urls)
      .set({
        clicks: updatedClicks,
        updatedAt: new Date(),
      })
      .where(eq(urls.shortCode, shortCode)),
    redis.hset(`url:${shortCode}`, {
      originalUrl: url.originalUrl,
      flagged: (url.flagged || false).toString(),
      flagReason: url.flagReason || 'null',
      userId: url.userId || 'null',
      clicks: updatedClicks.toString(),
    }),
    ,
  ]);
  await redis.expire(`url:${shortCode}`, CACHE_TTL.URL_MAPPING);
  return {
    originalUrl: url.originalUrl,
    flagged: url.flagged || false,
    flagReason: url.flagReason || null,
  };
};

const incrementClicksAsync = async (shortCode: string, currentClicks: number) => {
  try {
    await db.transaction(async (tx) => {
      const newClicks = currentClicks + 1;
      await tx
        .update(urls)
        .set({
          clicks: newClicks,
          updatedAt: new Date(),
        })
        .where(eq(urls.shortCode, shortCode));

      await redis.hincrby(`url:${shortCode}`, 'clicks', 1);
    });
  } catch (error) {
    console.error('Failed to increment clicks:', error);
  }
};
