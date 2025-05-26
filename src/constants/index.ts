export const ROLE_TYPE = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const URL_SAFETY = {
  CATEGORIES: {
    MALICIOUS: 'malicious',
    SUSPICIOUS: 'suspicious',
    SAFE: 'safe',
    INAPPROPRIATE: 'inappropriate',
    UNKNOWN: 'unknown',
  },
  CONFIDENCE_THRESHOLD: 0.7,
  SHORT_CODE_LENGTH: 6,
} as const;

export const URL_PROTOCOLS = {
  HTTP: 'http://',
  HTTPS: 'https://',
} as const;

export const UI_CONSTANTS = {
  TOAST_MESSAGES: {
    URL_ERROR_PREFIX: 'URL Error: ',
    CUSTOM_CODE_ERROR_PREFIX: 'Custom Code Error: ',
    VALIDATION_FALLBACK: 'Please check your input and try again',
    SHORT_URL_SUCCESS_PREFIX: 'Short URL created: ',
    COPY_SUCCESS: 'Copied to clipboard!',
  },
  FORM_PLACEHOLDERS: {
    URL_INPUT: 'Paste your long URL here',
    CUSTOM_CODE: 'Custom code (optional)',
  },
  BUTTON_LABELS: {
    SHORTENING: 'Shortening...',
    SHORTEN: 'Shorten',
    COPY: 'Copy',
    CREATE_ANOTHER: 'Create another',
  },
  URL_PREFIX_SEPARATOR: '/r/',
} as const;

export const OPENAI_CONFIG = {
  MODEL: 'gpt-4o-mini',
  TEMPERATURE: 0.1,
  RESPONSE_FORMAT: { type: 'json_object' as const },
} as const;
