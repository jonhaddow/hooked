import { error } from '@sveltejs/kit';
import { getPattern } from '#lib/server/patterns.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const found = await getPattern(locals.db, params.slug, locals.user!.id);
	if (!found) error(404, 'No such pattern');
	return { pattern: found.pattern, progress: found.progress };
};
