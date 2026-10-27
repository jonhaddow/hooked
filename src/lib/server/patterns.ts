import { and, eq } from 'drizzle-orm';
import { image, pattern, progress } from './db/schema.ts';
import type { DB } from './db/index.ts';
import { totals, type Pattern, type Progress } from '../pattern.ts';

async function progressOf(db: DB, userId: number, patternId: number): Promise<Progress> {
	const rows = await db
		.select({ key: progress.key, done: progress.done })
		.from(progress)
		.where(and(eq(progress.userId, userId), eq(progress.patternId, patternId)));
	return Object.fromEntries(rows.map((r) => [r.key, r.done]));
}

/** A stored pattern, with how many of its steps this person has done. */
export async function withTotals(db: DB, userId: number, row: { id: number; data: string }) {
	const data = JSON.parse(row.data) as Pattern;
	return { data, ...totals(data, await progressOf(db, userId, row.id)) };
}

/** Every pattern, with how far this person has got. */
export async function listPatterns(db: DB, userId: number) {
	const rows = await db.select().from(pattern).orderBy(pattern.title);
	return Promise.all(
		rows.map(async (row) => {
			const { data, done, total } = await withTotals(db, userId, row);
			return {
				slug: row.slug,
				title: row.title,
				designer: row.designer,
				craft: data.craft ?? 'crochet',
				cover: data.cover ?? null,
				done,
				total
			};
		})
	);
}

export async function getPattern(db: DB, slug: string, userId: number) {
	const [row] = await db.select().from(pattern).where(eq(pattern.slug, slug));
	if (!row) return null;
	return {
		id: row.id,
		pattern: JSON.parse(row.data) as Pattern,
		progress: await progressOf(db, userId, row.id)
	};
}

/** Sets how many rounds of a step are done; 0 clears it. */
export async function setDone(
	db: DB,
	userId: number,
	patternId: number,
	key: string,
	done: number
) {
	const where = and(
		eq(progress.userId, userId),
		eq(progress.patternId, patternId),
		eq(progress.key, key)
	);
	if (done <= 0) {
		await db.delete(progress).where(where);
		return;
	}
	const at = new Date().toISOString();
	await db
		.insert(progress)
		.values({ userId, patternId, key, done, at })
		.onConflictDoUpdate({
			target: [progress.userId, progress.patternId, progress.key],
			set: { done, at }
		});
}

/** Starts a pattern again from the top. */
export async function resetProgress(db: DB, userId: number, patternId: number) {
	await db
		.delete(progress)
		.where(and(eq(progress.userId, userId), eq(progress.patternId, patternId)));
}

export async function getImage(db: DB, key: string) {
	const [row] = await db.select().from(image).where(eq(image.key, key));
	if (!row) return null;
	// Native base64: decoding by hand costs more CPU than the free plan allows.
	return { type: row.type, bytes: Uint8Array.fromBase64(row.data) };
}
