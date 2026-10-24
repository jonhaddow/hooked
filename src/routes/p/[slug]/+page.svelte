<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import Sheet from '#lib/components/Sheet.svelte';
	import {
		copiesDone,
		imageUrl,
		nextStep,
		stepKey,
		timesOf,
		tokenize,
		totals,
		type Progress,
		type Section,
		type Step,
		type Term
	} from '#lib/pattern.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const p = $derived(data.pattern);

	// Ticks show straight away and are saved behind the scenes.
	// svelte-ignore state_referenced_locally
	let progress = $state<Progress>({ ...data.progress });
	let saveError = $state(false);

	const sum = $derived(totals(p, progress));
	const pct = $derived(sum.total ? Math.round((sum.done / sum.total) * 100) : 0);
	const next = $derived(nextStep(p, progress));

	// Which copy of each "Make 4" section is showing: the first unfinished one, until one is picked.
	let picked = $state<Record<string, number>>({});
	function copyOf(section: Section) {
		if (section.id in picked) return picked[section.id];
		const i = copiesDone(section, progress).indexOf(false);
		return i === -1 ? 0 : i;
	}

	// One save at a time, in order: quick taps on a repeated round mustn't land out of order.
	let queue = Promise.resolve();
	function post(body: object) {
		queue = queue.then(async () => {
			const res = await fetch(`/p/${p.slug}/progress`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
				// Finishes even if the page is left straight after a tap.
				keepalive: true
			}).catch(() => null);
			saveError = !res?.ok;
		});
		return queue;
	}

	function set(key: string, done: number) {
		const before = progress[key] ?? 0;
		if (done === before) return;
		progress[key] = done;
		void post({ key, done }).then(() => {
			if (saveError) progress[key] = before;
		});
	}

	/** A tap: one more round, or untick a finished step. */
	function tap(key: string, step: Step) {
		const done = progress[key] ?? 0;
		set(key, done >= timesOf(step) ? 0 : done + 1);
	}

	function tapRow(e: MouseEvent, key: string, step: Step) {
		// Abbreviations, photos and the minus button do their own thing.
		if ((e.target as HTMLElement).closest('button, a')) return;
		tap(key, step);
	}

	async function reset() {
		if (!confirm(`Start ${p.title} again? All your ticks will be cleared.`)) return;
		const before = progress;
		progress = {};
		picked = {};
		await post({ reset: true });
		if (saveError) progress = before;
	}

	function scrollToNext(smooth = true) {
		document
			.getElementById('next')
			?.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'instant' });
	}

	onMount(() => {
		if (Object.keys(progress).length) scrollToNext(false);
	});

	let term = $state<Term | null>(null);
	let photos = $state<{ names: string[]; start: number } | null>(null);
	const sectionDone = (section: Section) => copiesDone(section, progress).every(Boolean);
</script>

<svelte:head>
	<title>{p.title} · Hooked</title>
</svelte:head>

{#snippet text(t: string)}
	{#each tokenize(t, p.terms) as token, i (i)}
		{#if token.term}
			{@const tm = token.term}
			<button type="button" class="term" onclick={() => (term = tm)}>{token.text}</button>
		{:else}{token.text}{/if}
	{/each}
{/snippet}

{#snippet strip(names: string[], label: string)}
	<div class="strip" role="group" aria-label={label}>
		{#each names as name, i (name)}
			<button type="button" onclick={() => (photos = { names, start: i })}>
				<img src={imageUrl(p.slug, name)} alt="Photo {i + 1} of {names.length}" loading="lazy" />
			</button>
		{/each}
	</div>
{/snippet}

<main class="page">
	<a class="back" href="/">‹ Patterns</a>

	<header>
		<h1>{p.title}</h1>
		<p class="muted">by {p.designer}</p>
		<div class="bar" aria-hidden="true"><span style="width: {pct}%"></span></div>
		<p class="muted small">{sum.done} of {sum.total} rounds and steps · {pct}%</p>
	</header>

	{#if saveError}
		<p class="error" role="alert">Couldn't save that tick. Check your connection and try again.</p>
	{/if}

	{#if next && sum.done > 0}
		<Button onclick={() => scrollToNext()}>
			Carry on: {next.section.name}{(next.section.make ?? 1) > 1 ? ` ${next.copy + 1}` : ''} ·
			{next.step.label ? `${next.step.label}` : 'next step'}
		</Button>
	{:else if !next}
		<p class="note">All done. Lovely work!</p>
	{/if}

	<details class="card intro">
		<summary><h2>Before you start</h2></summary>
		<div class="intro-body">
			{#if p.summary}<p>{p.summary}</p>{/if}
			<h3>You'll need</h3>
			<ul>
				{#each p.materials as m (m)}<li>{m}</li>{/each}
			</ul>
			<h3>Notes</h3>
			<ul>
				{#each p.notes as n (n)}<li>{n}</li>{/each}
			</ul>
			<h3>Abbreviations</h3>
			<ul class="terms">
				{#each p.terms as t (t.abbr)}
					<li>
						<button type="button" class="term" onclick={() => (term = t)}>{t.abbr}</button>
						<span>{t.how || t.images ? `${t.meaning} ›` : t.meaning}</span>
					</li>
				{/each}
			</ul>
		</div>
	</details>

	{#each p.sections as section (section.id)}
		{@const make = section.make ?? 1}
		{@const copy = copyOf(section)}
		{@const copies = copiesDone(section, progress)}
		<section class="card section" class:finished={sectionDone(section)}>
			<header class="section-head">
				<h2>{section.name}</h2>
				{#if section.optional}<span class="muted small">Optional</span>{/if}
				{#if make > 1}<span class="muted small">Make {make}</span>{/if}
				{#if sectionDone(section)}<span class="done-tag">Done</span>{/if}
			</header>

			{#if make > 1}
				<div class="chips copies" role="group" aria-label="Which {section.name.toLowerCase()}">
					{#each copies as finished, i (i)}
						<button
							type="button"
							class="chip"
							class:on={i === copy}
							aria-pressed={i === copy}
							onclick={() => (picked[section.id] = i)}
						>
							{finished ? '✓ ' : ''}{i + 1} of {make}
						</button>
					{/each}
				</div>
			{/if}

			<ol class="steps">
				{#each section.steps as step (step.id)}
					{@const key = stepKey(section, copy, step)}
					{@const done = progress[key] ?? 0}
					{@const times = timesOf(step)}
					{@const complete = done >= times}
					{@const isNext = next?.key === key}
					<li id={isNext ? 'next' : undefined} class:complete class:next={isNext}>
						<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
						<div class="step" onclick={(e) => tapRow(e, key, step)}>
							<button
								type="button"
								class="tick"
								aria-pressed={complete}
								aria-label="{step.label ?? 'Step'} {complete
									? 'done'
									: times > 1
										? `${done} of ${times} done`
										: 'not done'}"
								onclick={() => tap(key, step)}
							>
								{#if complete}
									<svg viewBox="0 0 24 24" aria-hidden="true"
										><path d="M5 12.5l4.5 4.5L19 7.5" /></svg
									>
								{:else if times > 1}
									{done}/{times}
								{/if}
							</button>
							<div class="body">
								<p>
									{#if step.label}<strong>{step.label}:</strong>{/if}
									{@render text(step.text)}
									{#if step.count}<span class="count">[{step.count}]</span>{/if}
								</p>
								{#if times > 1 && !complete}
									<p class="muted small">
										Tap after each round · {times - done} to go
										{#if done > 0}
											<button type="button" class="minus" onclick={() => set(key, done - 1)}
												>Undo one</button
											>
										{/if}
									</p>
								{/if}
								{#if step.tip}<p class="tip">{@render text(step.tip)}</p>{/if}
							</div>
						</div>
						{#if step.images?.length}{@render strip(
								step.images,
								`Photos for ${step.label ?? 'this step'}`
							)}{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/each}

	<Button variant="destructive" onclick={reset}>Start again</Button>
</main>

<Sheet open={!!term} onclose={() => (term = null)} label={term?.meaning ?? ''}>
	{#if term}
		<h2><span class="abbr">{term.abbr}</span> {term.how ? term.meaning : ''}</h2>
		{#if !term.how}<p>{term.meaning}</p>{/if}
		{#if term.how}
			<ol class="how">
				{#each term.how as line (line)}<li>{@render text(line)}</li>{/each}
			</ol>
		{/if}
		{#if term.images}{@render strip(term.images, `Photos of ${term.meaning}`)}{/if}
		{#if term.video}
			<a class="video" href={term.video} target="_blank" rel="noopener">Watch the video ↗</a>
		{/if}
	{/if}
</Sheet>

<Sheet open={!!photos} onclose={() => (photos = null)} label="Photos" wide>
	{#if photos}
		{@const shown = photos}
		<div
			class="viewer"
			{@attach (el: HTMLElement) => {
				// After the sheet has opened: a closed dialog can't scroll.
				requestAnimationFrame(() => {
					const img = el.children[shown.start] as HTMLElement | undefined;
					el.scrollLeft = img?.offsetLeft ?? 0;
				});
			}}
		>
			{#each shown.names as name, i (name)}
				<img src={imageUrl(p.slug, name)} alt="Photo {i + 1} of {shown.names.length}" />
			{/each}
		</div>
		{#if shown.names.length > 1}<p class="muted small center">Swipe for more</p>{/if}
	{/if}
</Sheet>

<style>
	header h1 {
		margin-bottom: 2px;
	}
	header .bar {
		margin: 12px 0 6px;
	}
	.small {
		font-size: 13px;
	}
	.center {
		text-align: center;
	}

	.intro summary {
		list-style: none;
		cursor: pointer;
		padding: 16px;
		display: flex;
		justify-content: space-between;
	}
	.intro summary::after {
		content: '›';
		color: var(--muted);
		font-size: 20px;
		line-height: 1;
		transition: rotate 0.15s;
	}
	.intro[open] summary::after {
		rotate: 90deg;
	}
	.intro summary::-webkit-details-marker {
		display: none;
	}
	.intro-body {
		padding: 0 16px 16px;
		font-size: 15px;
	}
	.intro h3 {
		margin: 14px 0 6px;
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--muted);
	}
	.intro ul {
		margin: 0;
		padding-left: 18px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.intro ul.terms {
		list-style: none;
		padding: 0;
	}
	.terms li {
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.terms .term {
		min-width: 52px;
		text-align: left;
		font-weight: 800;
	}

	.section {
		padding: 16px 0 6px;
	}
	.section-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 0 16px 8px;
	}
	.section-head h2 {
		flex: 1;
		font-size: 20px;
	}
	.done-tag {
		font-size: 12px;
		font-weight: 800;
		padding: 2px 10px;
		border-radius: 999px;
		background: var(--note-bg);
		color: var(--note-ink);
	}
	.copies {
		padding: 0 16px 8px;
	}
	.copies .chip {
		min-height: 36px;
		padding: 0 12px;
		font-size: 14px;
	}

	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.steps li {
		border-top: 1px solid var(--line);
		scroll-margin: 80px;
	}
	.step {
		display: flex;
		gap: 12px;
		padding: 12px 16px;
		cursor: pointer;
		font-size: 17px;
		line-height: 1.45;
	}
	.next {
		background: var(--next-bg);
		box-shadow: inset 4px 0 0 var(--accent);
	}
	.complete .body > p:first-child {
		color: var(--muted);
		text-decoration: line-through;
		text-decoration-color: color-mix(in srgb, var(--muted) 50%, transparent);
	}
	.tick {
		flex-shrink: 0;
		width: 34px;
		height: 34px;
		margin-top: -3px;
		border-radius: 50%;
		border: 2px solid var(--field);
		background: var(--card);
		display: grid;
		place-items: center;
		font-size: 11px;
		font-weight: 800;
		color: var(--accent);
		cursor: pointer;
		padding: 0;
		transition:
			background-color 0.15s,
			border-color 0.15s,
			scale 0.1s;
	}
	.tick:active {
		scale: 0.88;
	}
	.next .tick {
		border-color: var(--accent);
	}
	.complete .tick {
		background: var(--accent);
		border-color: var(--accent);
	}
	.tick svg {
		width: 20px;
		height: 20px;
		fill: none;
		stroke: var(--on-accent);
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.count {
		white-space: nowrap;
		font-weight: 800;
		color: var(--accent);
	}
	.tip {
		font-size: 15px;
		color: var(--note-ink);
		background: var(--note-bg);
		padding: 8px 12px;
		border-radius: 10px;
	}
	.minus {
		border: 0;
		background: none;
		padding: 4px 6px;
		color: var(--accent);
		font-weight: 700;
		cursor: pointer;
	}

	.term {
		border: 0;
		background: none;
		padding: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
		text-decoration: underline dotted;
		text-decoration-color: var(--accent);
		text-underline-offset: 3px;
	}

	.strip {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 0 16px 12px 62px;
		scrollbar-width: none;
	}
	.strip button {
		flex-shrink: 0;
		border: 0;
		padding: 0;
		background: none;
		cursor: pointer;
	}
	.strip img {
		display: block;
		width: 76px;
		height: 76px;
		border-radius: 10px;
		object-fit: cover;
	}
	:global(dialog) .strip {
		padding: 4px 0 0;
	}

	.abbr {
		color: var(--accent);
	}
	.how {
		margin: 0;
		padding-left: 22px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		line-height: 1.45;
	}
	.video {
		font-weight: 700;
		color: var(--accent);
	}
	.viewer {
		display: flex;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		gap: 8px;
		scrollbar-width: none;
	}
	.viewer img {
		flex: 0 0 100%;
		width: 100%;
		aspect-ratio: 1;
		object-fit: contain;
		border-radius: 12px;
		scroll-snap-align: center;
		background: var(--line);
	}
</style>
