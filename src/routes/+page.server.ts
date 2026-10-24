import { listPatterns } from '#lib/server/patterns.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	patterns: await listPatterns(locals.db, locals.user!.id)
});
