import { error } from '@sveltejs/kit';
import { getImage } from '#lib/server/patterns.ts';
import type { RequestHandler } from './$types';

/** A pattern's photo, for signed-in people only (the patterns are bought, not ours to share). */
export const GET: RequestHandler = async ({ locals, params }) => {
	const found = await getImage(locals.db, params.key);
	if (!found) error(404, 'No such image');
	return new Response(found.bytes, {
		headers: { 'content-type': found.type, 'cache-control': 'private, max-age=604800' }
	});
};
