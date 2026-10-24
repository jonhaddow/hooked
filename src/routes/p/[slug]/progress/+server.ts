import { error, json } from '@sveltejs/kit';
import { stepTimes } from '#lib/pattern.ts';
import { getPattern, resetProgress, setDone } from '#lib/server/patterns.ts';
import type { RequestHandler } from './$types';

/**
 * Ticks: `{ key, done }` sets how many rounds of a step are done; `{ reset: true }`
 * starts again. JSON, so another site can't post here without a CORS preflight.
 */
export const POST: RequestHandler = async ({ locals, params, request }) => {
	const userId = locals.user!.id;
	const found = await getPattern(locals.db, params.slug, userId);
	if (!found) error(404, 'No such pattern');
	const body = (await request.json().catch(() => null)) as {
		key?: unknown;
		done?: unknown;
		reset?: unknown;
	} | null;

	if (body?.reset === true) {
		await resetProgress(locals.db, userId, found.id);
		return json({ ok: true });
	}
	const key = typeof body?.key === 'string' ? body.key : '';
	const times = stepTimes(found.pattern, key);
	const done = body?.done;
	if (times === null || !Number.isInteger(done) || (done as number) < 0 || (done as number) > times)
		error(400, 'Bad step');
	await setDone(locals.db, userId, found.id, key, done as number);
	return json({ ok: true });
};
