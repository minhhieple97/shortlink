import OpenAI from 'openai';
import { env } from '@/env';
import { UrlSafetyCheck } from '../types';
import { URL_PROTOCOLS } from '@/constants';
import { OPENAI_CONFIG } from '@/constants';
const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: 'https://multiappai-api.itmovnteam.com/v1',
});

export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
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

    const response = await client.chat.completions.create({
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
