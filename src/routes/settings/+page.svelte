<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Settings · Hooked</title>
</svelte:head>

<main class="page">
	<h1>Settings</h1>

	<section class="group people">
		<h2>Who can sign in</h2>
		<ul class="list">
			{#each data.people as u (u.email)}
				<li>
					<span>{u.name}</span>
					<span class="muted">{u.email}</span>
				</li>
			{/each}
		</ul>
	</section>

	<form method="POST" action="/logout">
		<Button variant="destructive" class="w-full">Sign out ({data.user?.name})</Button>
	</form>
</main>

<style>
	.list li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 16px;
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.people .muted {
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
