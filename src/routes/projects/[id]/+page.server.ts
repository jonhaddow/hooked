import { error, fail, redirect } from '@sveltejs/kit';
import { STATUSES, type Status } from '#lib/project.ts';
import { deleteProject, getProject, patternChoices, updateProject } from '#lib/server/projects.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const project = await getProject(locals.db, locals.user!.id, Number(params.id));
	if (!project) error(404, 'No such project');
	return { project, patterns: await patternChoices(locals.db) };
};

export const actions: Actions = {
	save: async ({ locals, params, request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Give it a name.' });
		const status = String(form.get('status'));
		const patternId = Number(form.get('pattern')) || null;
		if (patternId && !(await patternChoices(locals.db)).some((p) => p.id === patternId))
			return fail(400, { error: 'No such pattern.' });
		const percent = Math.min(100, Math.max(0, Math.round(Number(form.get('percent')) || 0)));
		const saved = await updateProject(locals.db, locals.user!.id, Number(params.id), {
			name: name.slice(0, 200),
			status: STATUSES.includes(status as Status) ? (status as Status) : 'planned',
			patternId,
			percent,
			notes: String(form.get('notes') ?? '').slice(0, 20000)
		});
		if (!saved) error(404, 'No such project');
		return { saved: true };
	},
	delete: async ({ locals, params }) => {
		await deleteProject(locals.db, locals.user!.id, Number(params.id));
		redirect(303, '/projects');
	}
};
