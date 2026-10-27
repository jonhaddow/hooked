import { integer, index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** People who can sign in (Google accounts). */
export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	name: text('name').notNull()
});

export type User = typeof user.$inferSelect;

/** Signed-in sessions. The id is the SHA-256 of the cookie's token, never the token itself. */
export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: text('expires_at').notNull()
	},
	(t) => [index('session_user_idx').on(t.userId)]
);

/** A pattern, its sections and steps as JSON (the Pattern type in lib/pattern.ts). */
export const pattern = sqliteTable('pattern', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	designer: text('designer').notNull(),
	data: text('data').notNull(),
	createdAt: text('created_at').notNull()
});

/** A pattern's photos, base64 JPEGs of a few tens of KB. Keyed `<slug>/<name>`. */
export const image = sqliteTable('image', {
	key: text('key').primaryKey(),
	type: text('type').notNull(),
	data: text('data').notNull()
});

/**
 * How far someone has got with a step: a row per step started. `key` is
 * `<section>/<copy>/<step>` (see stepKey); `done` counts rounds for steps
 * done several times ("Rnd 6–12").
 */
export const progress = sqliteTable(
	'progress',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		patternId: integer('pattern_id')
			.notNull()
			.references(() => pattern.id, { onDelete: 'cascade' }),
		key: text('key').notNull(),
		done: integer('done').notNull(),
		at: text('at').notNull()
	},
	(t) => [primaryKey({ columns: [t.userId, t.patternId, t.key] })]
);

/**
 * Something someone is making. A linked pattern's progress comes from their
 * ticks; without one, `percent` is set by hand.
 */
export const project = sqliteTable(
	'project',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		patternId: integer('pattern_id').references(() => pattern.id, { onDelete: 'set null' }),
		status: text('status', { enum: ['planned', 'making', 'finished'] }).notNull(),
		percent: integer('percent').notNull().default(0),
		notes: text('notes').notNull().default(''),
		createdAt: text('created_at').notNull(),
		updatedAt: text('updated_at').notNull()
	},
	(t) => [index('project_user_idx').on(t.userId)]
);
