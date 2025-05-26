'use server';

import { db, eq } from '@/db';
import { urls } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { ActionError, authAction } from '@/lib/safe-action';
import { UpdateUrlSchema } from '../schemas';
import { env } from '@/env';
import { routes } from '@/routes';

export const updateUrl = authAction
  .schema(UpdateUrlSchema)
  .action(async ({ parsedInput: { id, customCode }, ctx }) => {
    const { user } = ctx;

    const existingUrl = await db.query.urls.findFirst({
      where: (urls, { eq, and }) => and(eq(urls.id, id), eq(urls.userId, user.id)),
    });

    if (!existingUrl) {
      throw new ActionError("URL not found or you don't have permission to update it");
    }

    const codeExists = await db.query.urls.findFirst({
      where: (urls, { eq, and, ne }) => and(eq(urls.shortCode, customCode), ne(urls.id, id)),
    });

    if (codeExists) {
      throw new ActionError('Custom code already exists');
    }

    await db
      .update(urls)
      .set({
        shortCode: customCode,
        updatedAt: new Date(),
      })
      .where(eq(urls.id, id));

    const baseUrl = env.NEXT_PUBLIC_APP_URL;
    const shortUrl = `${baseUrl}/r/${customCode}`;

    revalidatePath(routes.dashboard.root);

    return {
      shortUrl,
      customCode,
    };
  });
