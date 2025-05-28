export const ROLE_TYPE = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof ROLE_TYPE)[keyof typeof ROLE_TYPE];

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
    URL_UPDATED_SUCCESS: 'URL updated successfully',
    URL_UPDATED_DESCRIPTION: 'The short code has been updated',
    COPY_DESCRIPTION: 'The short URL has been copied to your clipboard',
    COPY_ERROR: 'Failed to copy to clipboard',
    COPY_ERROR_DESCRIPTION: 'Please try again or copy manually',
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

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MIN_PAGE: 1,
} as const;

export const URL_DISPLAY = {
  ORIGINAL_URL_MAX_LENGTH: 50,
  SHORT_URL_MAX_LENGTH: 35,
} as const;

export const OPENAI_CONFIG = {
  MODEL: 'gpt-4o-mini',
  TEMPERATURE: 0.1,
  RESPONSE_FORMAT: { type: 'json_object' as const },
} as const;

export const ADMIN_TABLE = {
  PAGINATION: {
    DEFAULT_LIMIT: 10,
  },
  ACTIONS: {
    PROMOTE: 'Promote',
    DEMOTE: 'Demote',
  },
  MESSAGES: {
    SUCCESS: 'User role updated successfully',
    ERROR: 'Failed to update user role',
    DEFAULT_ERROR: 'An error occurred',
    NO_USERS_SEARCH: 'No users found with the given search criteria',
    NO_USERS: 'No users found',
  },
  ID_DISPLAY_LENGTH: 8,
} as const;


export const CACHE_TTL = {
  URL_MAPPING: 60 * 60 * 24,
  SHORT_CODE_EXISTENCE: 60 * 60,
  RATE_LIMIT: 60 * 15,
} as const;