'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { urls } from '@/db/schema';

export const getUrlByShortCode = async (shortCode: string) => {
  const url = await db.query.urls.findFirst({
    where: (urls, { eq }) => eq(urls.shortCode, shortCode),
  });

  if (!url) {
    return null;
  }

  await db
    .update(urls)
    .set({
      clicks: url.clicks + 1,
      updatedAt: new Date(),
    })
    .where(eq(urls.shortCode, shortCode));

  return {
    originalUrl: url.originalUrl,
    flagged: url.flagged || false,
    flagReason: url.flagReason || null,
  };
};
