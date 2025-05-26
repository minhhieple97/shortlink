'use server';

import { checkUrlSafety, ensureHttps } from '../services';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { urls } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { ActionError, authAction } from '@/lib/safe-action';
import { UrlFormSchema } from '../schemas';
import { isAdmin } from '@/lib/utils';
import { env } from '@/env';
import { URL_SAFETY } from '@/constants';
import { routes } from '@/routes';

export const shortenUrl = authAction
  .schema(UrlFormSchema)
  .action(async ({ parsedInput: { url, customCode }, ctx }) => {
    const { user } = ctx;
    const originalUrl = ensureHttps(url);
    const shortCode = customCode || nanoid(URL_SAFETY.SHORT_CODE_LENGTH);

    const existingUrl = await db.query.urls.findFirst({
      where: (urls, { eq }) => eq(urls.shortCode, shortCode),
    });

    if (existingUrl && customCode) {
      throw new ActionError('Custom code already exists');
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
        throw new ActionError('This URL is flagged as malicious');
      }
    }

    await db.insert(urls).values({
      originalUrl,
      shortCode,
      userId: user.id,
      flagged,
      flagReason,
    });

    const baseUrl = env.NEXT_PUBLIC_APP_URL;
    const shortUrl = `${baseUrl}/r/${shortCode}`;

    revalidatePath(routes.dashboard.root);

    return {
      shortUrl,
      flagged,
      flagReason,
    };
  });
