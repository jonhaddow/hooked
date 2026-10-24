<script lang="ts">
	import type { Snippet } from 'svelte';

	// A sheet that rises from the bottom (a modal <dialog>). Tap outside or Close to shut it.
	let {
		open,
		onclose,
		label,
		wide = false,
		children
	}: {
		open: boolean;
		onclose: () => void;
		label: string;
		wide?: boolean;
		children: Snippet;
	} = $props();

	let dialog: HTMLDialogElement;

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	class:wide
	aria-label={label}
	{onclose}
	onclick={(e) => {
		// The backdrop is the dialog itself; its content sits in .inner.
		if (e.target === dialog) dialog.close();
	}}
>
	<div class="inner">
		{@render children()}
		<button type="button" class="close" onclick={() => dialog.close()}>Close</button>
	</div>
</dialog>

<style>
	dialog {
		width: min(100%, 480px);
		max-width: 100%;
		max-height: 85dvh;
		margin: auto auto 0;
		padding: 0;
		border: 0;
		border-radius: 24px 24px 0 0;
		background: var(--card);
		color: var(--ink);
		box-shadow: 0 -8px 40px rgb(0 0 0 / 0.2);
	}
	dialog.wide {
		width: min(100%, 640px);
	}
	dialog[open] {
		animation: rise 0.22s ease-out;
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 0.4);
	}
	.inner {
		padding: 20px 20px calc(16px + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 12px;
		font-size: 16px;
	}
	.close {
		min-height: 48px;
		border: 0;
		border-radius: 999px;
		background: var(--line);
		font-weight: 700;
		cursor: pointer;
	}
	@keyframes rise {
		from {
			translate: 0 40px;
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		dialog[open] {
			animation: none;
		}
	}
</style>
