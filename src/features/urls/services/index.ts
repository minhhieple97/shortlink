import { env } from '@/env';
import { UrlSafetyCheck } from '../types';
import { SHORT_CODE, URL_PROTOCOLS, URL_SAFETY } from '@/constants';
import { OPENAI_CONFIG } from '@/constants';
import { redis } from '@/lib/redis';
import { ShortCodeGenerator } from '@/lib/short-code-generator';
import { ActionError } from '@/lib/safe-action';
import { queueClient } from '@/lib/qstash';
import { openaiClient } from '@/lib/openai';
import { db } from '@/db';
import { urls } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { QSTASH_QUEUE, RESPONSE_MESSAGES, CONTENT_TYPES } from '@/constants';
import { isExpired } from '@/lib/date-utils';

export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const ensureHttps = (url: string): string => {
  if (!url.startsWith(URL_PROTOCOLS.HTTPS) && !url.startsWith(URL_PROTOCOLS.HTTP)) {
    return `${URL_PROTOCOLS.HTTPS}${url}`;
  }

  if (url.startsWith(URL_PROTOCOLS.HTTP)) {
    return url.replace(URL_PROTOCOLS.HTTP, URL_PROTOCOLS.HTTPS);
  }

  return url;
};

export const checkUrlSafety = async (url: string) => {
  try {
    const prompt = `
      Analyze this URL for safety concerns: "${url}"
      
      Consider the following aspects:
      1. Is it a known phishing site?
      2. Does it contain malware or suspicious redirects?
      3. Is it associated with scams or fraud?
      4. Does it contain inappropriate content (adult, violence, etc.)?
      5. Is the domain suspicious or newly registered?
      
      Respond in JSON format with the following structure:
      {
        "isSafe": boolean,
        "flagged": boolean,
        "reason": string or null,
        "category": "safe" | "suspicious" | "malicious" | "inappropriate" | "unknown",
        "confidence": number between 0 and 1
      }
      
      Only respond with the JSON object, no additional text.
    `;

    const response = await openaiClient.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a URL safety analyzer. Respond only with the requested JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: OPENAI_CONFIG.RESPONSE_FORMAT,
      temperature: OPENAI_CONFIG.TEMPERATURE,
    });

    const jsonResponse = JSON.parse(response.choices[0].message.content || '{}') as UrlSafetyCheck;

    return {
      success: true,
      data: jsonResponse,
    };
  } catch (error) {
    console.error('Error checking URL safety:', error);
    return {
      success: false,
      error: 'Failed to analyze URL safety',
    };
  }
};

export const generateShortCode = async (customCode?: string): Promise<string> => {
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

export const processSafetyCheck = (
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

export const cleanupShortCode = async (shortCode: string): Promise<void> => {
  await redis.srem(SHORT_CODE.REDIS_SET_KEY, shortCode);
};

export const queueClickIncrement = async (shortCode: string) => {
  try {
    const baseUrl = env.NEXT_PUBLIC_APP_URL;
    await queueClient.enqueueJSON({
      url: `${baseUrl}${QSTASH_QUEUE.ENDPOINTS.CLICK_INCREMENT}`,
      body: {
        action: QSTASH_QUEUE.ACTIONS.INCREMENT_CLICK,
        shortCode,
        timestamp: Date.now(),
      },
      headers: {
        'Content-Type': CONTENT_TYPES.JSON,
      },
    });
  } catch (error) {
    console.error(RESPONSE_MESSAGES.ERRORS.QUEUE_FAILED, error);
    await incrementClicksDirectly(shortCode);
  }
};

const incrementClicksDirectly = async (shortCode: string) => {
  try {
    await db.transaction(async (tx) => {
      const url = await tx.query.urls.findFirst({
        where: eq(urls.shortCode, shortCode),
      });

      if (url) {
        // Check if the URL has expired
        if (isExpired(url.expiresAt)) {
          console.warn(`URL expired during direct update: ${shortCode}`);
          return;
        }

        const newClicks = url.clicks + 1;
        await tx
          .update(urls)
          .set({
            clicks: newClicks,
          })
          .where(eq(urls.shortCode, shortCode));

        await redis.hincrby(`url:${shortCode}`, 'clicks', 1);
      }
    });
  } catch (error) {
    console.error(RESPONSE_MESSAGES.ERRORS.DIRECT_UPDATE_FAILED, error);
  }
};
