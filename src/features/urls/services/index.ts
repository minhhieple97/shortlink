import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/env';
import { UrlSafetyCheck } from '../types';
const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API_KEY);

export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

export const ensureHttps = (url: string): string => {
  if (!url.startsWith('https://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  return url;
};

export const checkUrlSafety = async (url: string) => {
  const model = genAI.getGenerativeModel(
    { model: 'gemini-2.5-flash-preview' },
    {
      baseUrl: 'https://multiappai-api.itmovnteam.com/v1',
    },
  );

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

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON response');
  }

  const jsonResponse = JSON.parse(jsonMatch[0]) as UrlSafetyCheck;

  return {
    success: true,
    data: jsonResponse,
  };
};
