import { z } from 'zod';

export const UrlFormSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  customCode: z
    .string()
    .max(20, 'Custom code must be less than 255 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Custom code must be alphanumeric or hyphen')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
});


export const UpdateUrlSchema = z.object({
  id: z.number(),
  customCode: z
    .string()
    .min(3, 'Custom code must be at least 3 characters')
    .max(255, 'Custom code must be less than 255 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Custom code must be alphanumeric or hyphen'),
});

export const DeleteUrlSchema = z.object({
  id: z.number(),
});