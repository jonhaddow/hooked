import { beforeEach, describe, expect, it } from 'vitest';
import { testDb } from './test-db.ts';
import * as schema from './db/schema.ts';
import { getImage, getPattern, listPatterns, resetProgress, setDone } from './patterns.ts';
import {
	createProject,
	deleteProject,
	getProject,
	listProjects,
	updateProject
} from './projects.ts';
import type { DB } from './db/index.ts';
import type { Pattern } from '../pattern.ts';

let db: DB;
let alex: number;
let sam: number;
let patternId: number;

const data: Pattern = {
	slug: 'rose',
	title: 'Rose',
	designer: 'Julie',
	notes: [],
	materials: [],
	terms: [],
	sections: [{ id: 'pot', name: 'Pot', steps: [{ id: 'r1', text: 'mr 8', times: 2 }] }]
};

beforeEach(async () => {
	db = await testDb();
	const users = await db
		.insert(schema.user)
		.values([
			{ email: 'alex@example.com', name: 'Alex' },
			{ email: 'sam@example.com', name: 'Sam' }
		])
		.returning();
	[alex, sam] = users.map((u) => u.id);
	const [p] = await db
		.insert(schema.pattern)
		.values({
			slug: 'rose',
			title: 'Rose',
			designer: 'Julie',
			data: JSON.stringify(data),
			createdAt: '2026-10-24T00:00:00Z'
		})
		.returning();
	patternId = p.id;
});

describe('progress', () => {
	it('is kept per person', async () => {
		await setDone(db, alex, patternId, 'pot/0/r1', 1);
		await setDone(db, alex, patternId, 'pot/0/r1', 2);
		expect((await getPattern(db, 'rose', alex))?.progress).toEqual({ 'pot/0/r1': 2 });
		expect((await getPattern(db, 'rose', sam))?.progress).toEqual({});
		expect(await listPatterns(db, alex)).toMatchObject([{ slug: 'rose', done: 2, total: 2 }]);
	});

	it('clears a step at 0, and resets', async () => {
		await setDone(db, alex, patternId, 'pot/0/r1', 1);
		await setDone(db, alex, patternId, 'pot/0/r1', 0);
		expect((await getPattern(db, 'rose', alex))?.progress).toEqual({});
		await setDone(db, alex, patternId, 'pot/0/r1', 1);
		await setDone(db, sam, patternId, 'pot/0/r1', 1);
		await resetProgress(db, alex, patternId);
		expect((await getPattern(db, 'rose', alex))?.progress).toEqual({});
		expect((await getPattern(db, 'rose', sam))?.progress).toEqual({ 'pot/0/r1': 1 });
	});

	it('returns nothing for an unknown pattern', async () => {
		expect(await getPattern(db, 'nope', alex)).toBeNull();
	});
});

describe('images', () => {
	it('decodes the stored base64', async () => {
		const bytes = Uint8Array.from({ length: 1000 }, (_, i) => i % 256);
		await db
			.insert(schema.image)
			.values({ key: 'rose/a', type: 'image/jpeg', data: bytes.toBase64() });
		expect(await getImage(db, 'rose/a')).toEqual({ type: 'image/jpeg', bytes });
		expect(await getImage(db, 'rose/b')).toBeNull();
	});
});

describe('projects', () => {
	const fields = { name: 'Rose for Mum', status: 'making' as const, notes: 'Red yarn' };

	it('are kept per person, and only their owner can change them', async () => {
		const id = await createProject(db, alex, 'Rose');
		expect(await listProjects(db, sam)).toEqual([]);
		expect(await getProject(db, sam, id)).toBeNull();
		expect(await updateProject(db, sam, id, { ...fields, patternId: null, percent: 50 })).toBe(
			false
		);
		await deleteProject(db, sam, id);
		expect(await updateProject(db, alex, id, { ...fields, patternId: null, percent: 50 })).toBe(
			true
		);
		expect(await getProject(db, alex, id)).toMatchObject({ ...fields, percent: 50, pattern: null });
		await deleteProject(db, alex, id);
		expect(await listProjects(db, alex)).toEqual([]);
	});

	it("take a linked pattern's progress from the ticks", async () => {
		const id = await createProject(db, alex, 'Rose');
		await updateProject(db, alex, id, { ...fields, patternId, percent: 10 });
		await setDone(db, alex, patternId, 'pot/0/r1', 1);
		expect(await getProject(db, alex, id)).toMatchObject({
			percent: 50,
			pattern: { slug: 'rose', title: 'Rose' }
		});
	});
});
