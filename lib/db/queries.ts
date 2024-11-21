import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

// Define the mp3Plays table schema
export const mp3Plays = pgTable('mp3_plays', {
  id: serial('id').primaryKey(),
  flightIcaoCode: varchar('flight_icao_code', { length: 4 }).notNull(),
  flightNumber: varchar('flight_number', { length: 10 }).notNull(),
  destinationCode: varchar('destination_code', { length: 3 }).notNull(),
  callType: varchar('call_type', { length: 50 }).notNull(),
  gate: varchar('gate', { length: 20 }),
  filename: varchar('filename', { length: 255 }).notNull(),
  playedAt: timestamp('played_at').notNull().defaultNow(),
});

// User authentication and session handling
export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (!sessionData || !sessionData.user || typeof sessionData.user.id !== 'number') {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  return user.length > 0 ? user[0] : null;
}

// Fetch a team by Stripe Customer ID
export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Update team subscription details
export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

// Get user with their associated team
export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

// Fetch activity logs for the authenticated user
export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

// Fetch the team for a specific user
export async function getTeamForUser(userId: number) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      teamMembers: {
        with: {
          team: {
            with: {
              teamMembers: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.teamMembers[0]?.team || null;
}

// CRUD operations for mp3Plays

// Create a new mp3 play entry
export async function createMp3Play(playData: {
  flightIcaoCode: string;
  flightNumber: string;
  destinationCode: string;
  callType: string;
  gate?: string;
  filename: string;
}) {
  return await db.insert(mp3Plays).values({
    ...playData,
    playedAt: new Date(), // Default to current date if not provided
  });
}

// Read mp3 play entries
export async function getMp3Plays(limit = 10) {
  return await db
    .select()
    .from(mp3Plays)
    .orderBy(desc(mp3Plays.playedAt))
    .limit(limit);
}

// Read a single mp3 play entry by ID
export async function getMp3PlayById(id: number) {
  const result = await db
    .select()
    .from(mp3Plays)
    .where(eq(mp3Plays.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Update an existing mp3 play entry
export async function updateMp3Play(
  id: number,
  updatedData: Partial<{
    flightIcaoCode?: string;
    flightNumber?: string;
    destinationCode?: string;
    callType?: string;
    gate?: string;
    filename?: string;
    playedAt?: Date; // Optional for updates
  }>
) {
  return await db
    .update(mp3Plays)
    .set({
      ...updatedData,
      playedAt: updatedData.playedAt || undefined // Keep playedAt unchanged if not provided
   })
   .where(eq(mp3Plays.id, id));
}

// Delete an mp3 play entry
export async function deleteMp3Play(id: number) {
   return await db.delete(mp3Plays).where(eq(mp3Plays.id, id));
}