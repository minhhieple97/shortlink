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
  const cached = await redis.get(`url:${shortCode}`);

  if (cached) {
    const urlData = JSON.parse(cached as string) as CachedUrlData;

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

    redis.setex(
      `url:${shortCode}`,
      CACHE_TTL.URL_MAPPING,
      JSON.stringify({
        originalUrl: url.originalUrl,
        flagged: url.flagged || false,
        flagReason: url.flagReason || null,
        userId: url.userId,
        clicks: updatedClicks,
      }),
    ),
  ]);

  return {
    originalUrl: url.originalUrl,
    flagged: url.flagged || false,
    flagReason: url.flagReason || null,
  };
};

const incrementClicksAsync = async (shortCode: string, currentClicks: number) => {
  try {
    const newClicks = currentClicks + 1;

    await Promise.all([
      db
        .update(urls)
        .set({
          clicks: newClicks,
          updatedAt: new Date(),
        })
        .where(eq(urls.shortCode, shortCode)),

      redis.setex(
        `url:${shortCode}`,
        CACHE_TTL.URL_MAPPING,
        JSON.stringify(await getCachedData(shortCode, newClicks)),
      ),
    ]);
  } catch (error) {
    console.error('Failed to increment clicks:', error);
  }
};

const getCachedData = async (shortCode: string, clicks: number) => {
  const url = await db.query.urls.findFirst({
    where: eq(urls.shortCode, shortCode),
  });

  return {
    originalUrl: url!.originalUrl,
    flagged: url!.flagged || false,
    flagReason: url!.flagReason || null,
    userId: url!.userId,
    clicks,
  };
};
