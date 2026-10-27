import { and, desc, eq } from 'drizzle-orm';
import { pattern, project } from './db/schema.ts';
import type { DB } from './db/index.ts';
import { withTotals } from './patterns.ts';
import type { Status } from '../project.ts';

export type ProjectFields = {
	name: string;
	status: Status;
	patternId: number | null;
	/** Left as it is when not given (a linked pattern sets the progress). */
	percent?: number;
	notes: string;
};

function select(db: DB) {
	return db
		.select({ project, pattern })
		.from(project)
		.leftJoin(pattern, eq(project.patternId, pattern.id));
}

type Row = Awaited<ReturnType<ReturnType<typeof select>['all']>>[number];

/** A project for showing; a linked pattern's progress is this person's ticks on it. */
async function view(db: DB, userId: number, { project: p, pattern: row }: Row) {
	let linked = null;
	let percent = p.percent;
	if (row) {
		const { data, done, total } = await withTotals(db, userId, row);
		percent = total ? Math.round((done / total) * 100) : 0;
		linked = { id: row.id, slug: row.slug, title: row.title, cover: data.cover ?? null };
	}
	return { id: p.id, name: p.name, status: p.status, notes: p.notes, percent, pattern: linked };
}

/** Someone's projects, latest changed first. */
export async function listProjects(db: DB, userId: number) {
	const rows = await select(db).where(eq(project.userId, userId)).orderBy(desc(project.updatedAt));
	return Promise.all(rows.map((r) => view(db, userId, r)));
}

export async function getProject(db: DB, userId: number, id: number) {
	const [row] = await select(db).where(and(eq(project.id, id), eq(project.userId, userId)));
	return row ? view(db, userId, row) : null;
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
