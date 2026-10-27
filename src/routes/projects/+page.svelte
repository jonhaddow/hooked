<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { imageUrl } from '#lib/pattern.ts';
	import { STATUS_NAMES } from '#lib/project.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Projects · Hooked</title>
</svelte:head>

<main class="page">
	<h1>Projects</h1>

	<form method="POST" class="new" use:enhance>
		<input name="name" placeholder="New project" aria-label="New project name" required />
		<Button>Add</Button>
	</form>
	{#if form?.error}<p class="error">{form.error}</p>{/if}

	{#if !data.projects.length}
		<p class="card empty muted">Nothing on the go. Add what you're making, or planning to make.</p>
	{/if}

	<ul class="projects">
		{#each data.projects as p (p.id)}
			<li>
				<a class="card" href="/projects/{p.id}">
					{#if p.pattern?.cover}
						<img src={imageUrl(p.pattern.slug, p.pattern.cover)} alt="" width="72" height="72" />
					{/if}
					<span class="text">
						<strong>{p.name}</strong>
						{#if p.pattern}<span class="muted">{p.pattern.title}</span>{/if}
						<span class="bar" aria-hidden="true"><span style="width: {p.percent}%"></span></span>
						<span class="muted small">
							{STATUS_NAMES[p.status]}{#if p.status === 'making'}&ensp;·&ensp;{p.percent}%{/if}
						</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	.new {
		display: flex;
		gap: 8px;
	}
	.new input {
		flex: 1;
		min-width: 0;
		min-height: 48px;
		padding: 10px 14px;
		border-radius: 12px;
		border: 1.5px solid var(--field);
		background: var(--card);
		font-size: 17px;
	}
	.projects {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.projects a {
		display: flex;
		gap: 14px;
		align-items: center;
		padding: 12px;
		text-decoration: none;
		transition: scale 0.1s ease-out;
	}
	.projects a:active {
		scale: 0.98;
	}
	img {
		border-radius: 12px;
		object-fit: cover;
		flex-shrink: 0;
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}
	strong {
		font-size: 18px;
	}
	.small {
		font-size: 13px;
	}
	.empty {
		padding: 20px;
	}
</style>
