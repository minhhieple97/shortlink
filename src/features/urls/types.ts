import { UrlFormSchema } from './schemas';
import { z } from 'zod';

export type IUrlFormData = z.infer<typeof UrlFormSchema>;

export type UrlSafetyCheck = {
  isSafe: boolean;
  flagged: boolean;
  reason: string | null;
  category: 'safe' | 'suspicious' | 'malicious' | 'inappropriate' | 'unknown';
  confidence: number;
};
