import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server';
import { db, eq } from '@/db';
import { env } from '@/env';
import { userRoleEnum, users } from '@/db/schema';

async function validateRequest(request: Request) {
  const payloadString = await request.text();
  const headerPayload = await headers();

  const svixHeaders = {
    'svix-id': headerPayload.get('svix-id')!,
    'svix-timestamp': headerPayload.get('svix-timestamp')!,
    'svix-signature': headerPayload.get('svix-signature')!,
  };
  const wh = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET);
  return wh.verify(payloadString, svixHeaders) as WebhookEvent;
}

export async function POST(req: Request) {
  const payload = await validateRequest(req);
  const body = JSON.stringify(payload);

  try {
    await handleWebhookEvent(payload, body);
    return Response.json({ message: 'Received webhook' });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new Response('Webhook verification failed', { status: 400 });
  }
}

async function handleWebhookEvent(event: WebhookEvent, rawBody: string) {
  const data = JSON.parse(rawBody).data;
  switch (event.type) {
    case 'user.created':
    case 'user.updated':
      await handleUserCreatedOrUpdated(data);
      break;
    case 'user.deleted':
      await handleUserDeleted(data.id);
      break;
  }
}

async function handleUserCreatedOrUpdated(data: any) {
  const roleValues = userRoleEnum.enumValues;
  const defaultRole = roleValues[0];

  const userData = {
    id: data.id,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    email: data.email_addresses?.[0]?.email_address,
    image: data.image_url,
    role: data.private_metadata?.role || defaultRole,
  };

  try {
    const existingUser = await db.select().from(users).where(eq(users.id, userData.id)).limit(1);

    if (existingUser.length > 0) {
      await db
        .update(users)
        .set({
          name: userData.name,
          email: userData.email,
          image: userData.image,
          role: userData.role,
        })
        .where(eq(users.id, userData.id));
    } else {
      // Insert new user
      await db.insert(users).values({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        image: userData.image,
        role: userData.role,
      });
    }

    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userData.id, {
      privateMetadata: {
        role: userData.role,
      },
    });
  } catch (error) {
    console.error('Error handling user data:', error);
    throw error;
  }
}

async function handleUserDeleted(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
