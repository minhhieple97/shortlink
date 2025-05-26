'use server';

import { db } from '@/db';

export const getUserUrls = async (userId: string) => {
  const userUrls = await db.query.urls.findMany({
    where: (urls, { eq }) => eq(urls.userId, userId),
    orderBy: (urls, { desc }) => [desc(urls.createdAt)],
  });

  return userUrls.map((url) => ({
    id: url.id,
    originalUrl: url.originalUrl,
    shortCode: url.shortCode,
    createdAt: url.createdAt,
    clicks: url.clicks,
  }));
};
