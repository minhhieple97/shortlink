import { env } from '@/env';
import { Client } from '@upstash/qstash';

export const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
});
