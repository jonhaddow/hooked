import { fail, redirect } from '@sveltejs/kit';
import { createProject, listProjects } from '#lib/server/projects.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	projects: await listProjects(locals.db, locals.user!.id)
});

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Give it a name.' });
		const id = await createProject(locals.db, locals.user!.id, name.slice(0, 200));
		redirect(303, `/projects/${id}`);
	}
};
