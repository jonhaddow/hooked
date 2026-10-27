import { and, desc, eq } from 'drizzle-orm';
import { pattern, project } from './db/schema.ts';
import type { DB } from './db/index.ts';
import { progressOf } from './patterns.ts';
import { totals, type Pattern } from '../pattern.ts';
import type { Status } from '../project.ts';

export type ProjectFields = {
	name: string;
	status: Status;
	patternId: number | null;
	percent: number;
	notes: string;
};

/**
 * Someone's projects (or just one), latest changed first. A linked pattern's
 * progress is their ticks on it.
 */
export async function listProjects(db: DB, userId: number, id?: number) {
	const rows = await db
		.select({ project, pattern })
		.from(project)
		.leftJoin(pattern, eq(project.patternId, pattern.id))
		.where(and(eq(project.userId, userId), id === undefined ? undefined : eq(project.id, id)))
		.orderBy(desc(project.updatedAt));
	return Promise.all(
		rows.map(async ({ project: p, pattern: row }) => {
			let linked = null;
			let percent = p.percent;
			if (row) {
				const data = JSON.parse(row.data) as Pattern;
				const { done, total } = totals(data, await progressOf(db, userId, row.id));
				percent = total ? Math.round((done / total) * 100) : 0;
				linked = { id: row.id, slug: row.slug, title: row.title, cover: data.cover ?? null };
			}
			return {
				id: p.id,
				name: p.name,
				status: p.status,
				notes: p.notes,
				percent,
				pattern: linked
			};
		})
	);
}

export async function getProject(db: DB, userId: number, id: number) {
	return (await listProjects(db, userId, id))[0] ?? null;
}

/** Patterns to link a project to. */
export async function patternChoices(db: DB) {
	return db.select({ id: pattern.id, title: pattern.title }).from(pattern).orderBy(pattern.title);
}

export async function createProject(db: DB, userId: number, name: string) {
	const at = new Date().toISOString();
	const [row] = await db
		.insert(project)
		.values({ userId, name, status: 'planned', createdAt: at, updatedAt: at })
		.returning({ id: project.id });
	return row.id;
}

/** Saves someone's own project; false if it isn't theirs. */
export async function updateProject(db: DB, userId: number, id: number, fields: ProjectFields) {
	const rows = await db
		.update(project)
		.set({ ...fields, updatedAt: new Date().toISOString() })
		.where(and(eq(project.id, id), eq(project.userId, userId)))
		.returning({ id: project.id });
	return rows.length > 0;
}

export async function deleteProject(db: DB, userId: number, id: number) {
	await db.delete(project).where(and(eq(project.id, id), eq(project.userId, userId)));
}
