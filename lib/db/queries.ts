'use server'

import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { airlines, activityLogs, teamMembers, teams, users, announcementTemplates, AnnouncementType, mp3Plays } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
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

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}


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

export async function createMp3Play(playData: {
  flightIcaoCode: string;
  flightNumber: string;
  destinationCode: string;
  callType: string;
  gate?: string;
  filename: string;
  playedAt?: Date; 
}) {
  return await db.insert(mp3Plays).values({
    ...playData,
    playedAt: playData.playedAt || new Date(), 
  });
}

export async function getAnnouncementTemplate(airlineId: number, type: AnnouncementType, language: string) {
  const result = await db
    .select()
    .from(announcementTemplates)
    .where(
      and(
        eq(announcementTemplates.airlineId, airlineId),
        eq(announcementTemplates.type, type),
        eq(announcementTemplates.language, language)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getMp3Plays(limit = 10) {
  return await db
    .select()
    .from(mp3Plays)
    .orderBy(desc(mp3Plays.playedAt))
    .limit(limit);
}

export async function getMp3PlayById(id: number) {
  const result = await db
    .select()
    .from(mp3Plays)
    .where(eq(mp3Plays.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateMp3Play(
  id: number,
  updatedData: Partial<{
    flightIcaoCode?: string;
    flightNumber?: string;
    destinationCode?: string;
    callType?: string;
    gate?: string;
    filename?: string;
    playedAt?: Date; 
   }>
) {
   return await db
     .update(mp3Plays)
     .set({
       ...updatedData,
       playedAt: updatedData.playedAt || undefined 
     })
     .where(eq(mp3Plays.id, id));
}

export async function deleteMp3Play(id: number) {
   return await db.delete(mp3Plays).where(eq(mp3Plays.id, id));
}

export async function createAnnouncementTemplate(templateData: {
   airlineId: number;
   type: AnnouncementType;
   language: string;
   template: string;
}) {
   return await db.insert(announcementTemplates).values(templateData);
}

export async function getAnnouncementTemplates(limit = 10) {
   return await db
     .select()
     .from(announcementTemplates)
     .orderBy(desc(announcementTemplates.airlineId))
     .limit(limit);
}

export async function getAnnouncementTemplateById(id: number) {
   const result = await db
     .select()
     .from(announcementTemplates)
     .where(eq(announcementTemplates.id, id))
     .limit(1);

   return result.length > 0 ? result[0] : null;
}

export async function updateAnnouncementTemplate(
   id: number,
   updatedData: Partial<{
       airlineId?: number;
       type?: AnnouncementType;
       language?: string;
       template?: string;
   }>
) {
   return await db
     .update(announcementTemplates)
     .set(updatedData)
     .where(eq(announcementTemplates.id, id));
}

export async function getAirlineIdByCode(code: string): Promise<number> {
  const result = await db
    .select()
    .from(airlines)
    .where(eq(airlines.code, code))
    .limit(1);

  return result.length > 0 ? result[0].id : -1;
}

export async function deleteAnnouncementTemplate(id: number) {
   return await db.delete(announcementTemplates).where(eq(announcementTemplates.id, id));
}