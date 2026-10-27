<script lang="ts">
	import { enhance } from '$app/forms';
	import Sheet from '#lib/components/Sheet.svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { STATUSES, STATUS_NAMES } from '#lib/project.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const project = $derived(data.project);
	// Which pattern is chosen, before saving: without one, progress is set by hand.
	let patternId = $derived(String(project.pattern?.id ?? ''));
	let percent = $derived(project.percent);
	let confirmDelete = $state(false);
	let saved = $state(false);
</script>

<svelte:head>
	<title>{project.name} · Hooked</title>
</svelte:head>

<main class="page">
	<a class="back" href="/projects">‹ Projects</a>

	<form
		method="POST"
		action="?/save"
		class="edit"
		use:enhance={() => {
			saved = false;
			return async ({ update, result }) => {
				await update({ reset: false });
				saved = result.type === 'success';
			};
		}}
		oninput={() => (saved = false)}
	>
		<label class="field">
			Name
			<input name="name" value={project.name} required maxlength="200" />
		</label>

		<div class="segments" role="radiogroup" aria-label="Status">
			{#each STATUSES as s (s)}
				<label
					><input
						type="radio"
						name="status"
						value={s}
						checked={project.status === s}
					/>{STATUS_NAMES[s]}</label
				>
			{/each}
		</div>

		<label class="field">
			Pattern
			<select name="pattern" bind:value={patternId}>
				<option value="">None</option>
				{#each data.patterns as p (p.id)}
					<option value={String(p.id)}>{p.title}</option>
				{/each}
			</select>
		</label>

		{#if patternId && patternId === String(project.pattern?.id)}
			<div class="progress">
				<span class="bar" aria-hidden="true"><span style="width: {project.percent}%"></span></span>
				<span class="muted small">{project.percent}% of the pattern ticked</span>
				<Button variant="secondary" href="/p/{project.pattern?.slug}">Open pattern</Button>
			</div>
		{/if}
		{#if patternId}
			<!-- Unlinking the pattern keeps its progress. -->
			<input type="hidden" name="percent" value={percent} />
		{:else}
			<label class="field">
				Progress: {percent}%
				<input
					class="range"
					type="range"
					name="percent"
					min="0"
					max="100"
					step="5"
					bind:value={percent}
				/>
			</label>
		{/if}

		<label class="field">
			Notes
			<textarea
				name="notes"
				rows="8"
				placeholder="Yarn, hook size, changes you made…"
				value={project.notes}></textarea>
		</label>

		{#if form?.error}<p class="error">{form.error}</p>{/if}
		<Button>{saved ? 'Saved' : 'Save'}</Button>
	</form>

	<Button variant="destructive" onclick={() => (confirmDelete = true)}>Delete project</Button>
</main>

<Sheet open={confirmDelete} onclose={() => (confirmDelete = false)} label="Delete project">
	<h2>Delete “{project.name}”?</h2>
	<p class="muted">Its notes go too. Ticks on the pattern stay.</p>
	<form method="POST" action="?/delete" class="confirm">
		<Button class="w-full">Delete</Button>
	</form>
</Sheet>

<style>
	.edit {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.progress {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.small {
		font-size: 13px;
	}
	.field .range {
		min-height: 0;
		padding: 0;
		border: 0;
		accent-color: var(--accent);
	}
	.confirm {
		display: flex;
	}
</style>
