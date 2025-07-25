import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,boolean,jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));


export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

// MP3 Plays table definition
export const mp3Plays = pgTable('mp3_plays', {
  id: serial('id').primaryKey(),
  flightIcaoCode: varchar('flight_icao_code', { length: 4 }).notNull(),
  flightNumber: varchar('flight_number', { length: 10 }).notNull(),
  destinationCode: varchar('destination_code', { length: 3 }).notNull(),
  callType: varchar('call_type', { length: 50 }).notNull(),
  gate: varchar('gate', { length: 20 }),
  filename: varchar('filename', { length: 255 }).notNull(),
  playedAt: timestamp('played_at').notNull().defaultNow(),
})

// Enum for announcement types
export enum AnnouncementType {
  CHECKIN = 'checkin',
  ARRIVED = 'arrived',
  BOARDING = 'boarding',
  CANCELLED = 'cancelled',
  EARLIER = 'earlier',
  DIVERTED = 'diverted',
  CLOSE = 'close',
  DELAY = 'delay',
  GATE_CHANGE = 'gate_change',
  SECURITY = 'security',
  ASSISTANCE = 'assistance'
}

// Airlines Table
export const airlines = pgTable('airlines', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }),
  code: varchar('code', { length: 3 }).notNull().unique(),
  icaoCode: varchar('icao_code', { length: 4 }).notNull().unique(),
  country: varchar('country', { length: 100 }),
  state: varchar('state', { length: 100 }),
  logoUrl: text('logo_url'),
  defaultLanguage: varchar('default_language', { length: 10 }).default('en'),
  // createdAt: timestamp('created_at').notNull().defaultNow(),
  // updatedAt: timestamp('updated_at').notNull().defaultNow(),
});



// Announcement Templates Table
export const announcementTemplates = pgTable('announcement_templates', {
  id: serial('id').primaryKey(),
  airlineId: integer('airline_id').references(() => airlines.id).notNull(),
  type: varchar('type', { 
    length: 50,
    enum: [
      AnnouncementType.CHECKIN,
      AnnouncementType.ARRIVED,
      AnnouncementType.BOARDING,
      AnnouncementType.CLOSE,
      AnnouncementType.CANCELLED,
      AnnouncementType.EARLIER,
      AnnouncementType.DIVERTED,
      AnnouncementType.DELAY,
      AnnouncementType.GATE_CHANGE,
      AnnouncementType.SECURITY,
      AnnouncementType.ASSISTANCE
    ]
  }).notNull(),
  language: varchar('language', { length: 10 }).notNull(),
  template: text('template').notNull(),
  // createdAt: timestamp('created_at').notNull().defaultNow(),
  // updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
// do odje je novi dio


export const announcementSchedules = pgTable('announcement_schedules', {
  id: serial('id').primaryKey(),
  type: varchar('type', {
    length: 50,
    enum: [
      AnnouncementType.CHECKIN,
      AnnouncementType.ARRIVED,
      AnnouncementType.BOARDING,
      AnnouncementType.CLOSE,
      AnnouncementType.CANCELLED,
      AnnouncementType.EARLIER,
      AnnouncementType.DIVERTED,
      AnnouncementType.DELAY,
      AnnouncementType.GATE_CHANGE,
      AnnouncementType.SECURITY,
      AnnouncementType.ASSISTANCE,
    ],
  }).notNull(),
  times: jsonb('times').notNull(), // Array of minutes (e.g., [90, 75, 60])
  airlineId: integer('airline_id').references(() => airlines.id), // Optional: Link to a specific airline
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
