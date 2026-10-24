<script lang="ts">
	import { imageUrl } from '#lib/pattern.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Patterns · Hooked</title>
</svelte:head>

<main class="page">
	<h1>Patterns</h1>

	{#if !data.patterns.length}
		<p class="card empty muted">No patterns yet.</p>
	{/if}

	<ul class="patterns">
		{#each data.patterns as p (p.slug)}
			{@const pct = p.total ? Math.round((p.done / p.total) * 100) : 0}
			<li>
				<a class="card" href="/p/{p.slug}">
					{#if p.cover}
						<img src={imageUrl(p.slug, p.cover)} alt="" width="88" height="88" />
					{/if}
					<span class="text">
						<strong>{p.title}</strong>
						<span class="muted">by {p.designer}</span>
						<span class="bar" aria-hidden="true"><span style="width: {pct}%"></span></span>
						<span class="muted small">
							{#if p.done === 0}Not started{:else if p.done === p.total}Finished{:else}{pct}% done{/if}
						</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	.patterns {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.patterns a {
		display: flex;
		gap: 14px;
		align-items: center;
		padding: 12px;
		text-decoration: none;
		transition: scale 0.1s ease-out;
	}
	.patterns a:active {
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
