// A crochet pattern as steps to tick off, and how far someone has got.
// Pure, so the pages and the server share it and it's unit tested.

export type Step = {
	/** Unique within its section. */
	id: string;
	/** "Rnd 3", "Rnd 6–12", "1". */
	label?: string;
	text: string;
	/** Stitches at the end of the round. */
	count?: number;
	/** Done this many times in a row ("Rnd 6–12" is 7). */
	times?: number;
	tip?: string;
	/** Photo names (image keys without the pattern's slug). */
	images?: string[];
};

export type Section = {
	id: string;
	name: string;
	/** Make this many ("Make 4"): each copy is ticked off separately. */
	make?: number;
	optional?: boolean;
	steps: Step[];
};

/** An abbreviation or technique; its `abbr` is linked wherever it appears in a step. */
export type Term = {
	abbr: string;
	meaning: string;
	how?: string[];
	images?: string[];
	video?: string;
};

export type Pattern = {
	slug: string;
	title: string;
	designer: string;
	cover?: string;
	summary?: string;
	notes: string[];
	materials: string[];
	terms: Term[];
	sections: Section[];
};

/** Rounds done per step, by stepKey. Missing means not started. */
export type Progress = Record<string, number>;

export const stepKey = (section: Section, copy: number, step: Step) =>
	`${section.id}/${copy}/${step.id}`;

export const timesOf = (step: Step) => step.times ?? 1;

export const imageUrl = (slug: string, name: string) => `/images/${slug}/${name}`;

/** Every step to tick, in order, with each copy of a "Make 4" section in turn. */
export function allSteps(pattern: Pattern) {
	return pattern.sections.flatMap((section) =>
		Array.from({ length: section.make ?? 1 }, (_, copy) =>
			section.steps.map((step) => ({ section, copy, step, key: stepKey(section, copy, step) }))
		).flat()
	);
}

/** How many times a step has to be done, if the key is one of the pattern's. */
export function stepTimes(pattern: Pattern, key: string) {
	const found = allSteps(pattern).find((s) => s.key === key);
	return found ? timesOf(found.step) : null;
}

const isDone = (progress: Progress, key: string, step: Step) =>
	(progress[key] ?? 0) >= timesOf(step);

/** Rounds done out of the total, optional sections left out. */
export function totals(pattern: Pattern, progress: Progress) {
	let done = 0;
	let total = 0;
	for (const { section, step, key } of allSteps(pattern)) {
		if (section.optional) continue;
		total += timesOf(step);
		done += Math.min(progress[key] ?? 0, timesOf(step));
	}
	return { done, total };
}

/** Which copies of a section are finished. */
export function copiesDone(section: Section, progress: Progress) {
	return Array.from({ length: section.make ?? 1 }, (_, copy) =>
		section.steps.every((step) => isDone(progress, stepKey(section, copy, step), step))
	);
}

/** The first step not yet done, optional sections last. */
export function nextStep(pattern: Pattern, progress: Progress) {
	const steps = allSteps(pattern);
	const todo = (optional: boolean) =>
		steps.find((s) => !!s.section.optional === optional && !isDone(progress, s.key, s.step));
	return todo(false) ?? todo(true) ?? null;
}

export type Token = { text: string; term?: Term };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Splits a step's text so the pattern's abbreviations can be tapped. Longest
 * first ("hdc-inc" before "hdc"), whole words only, case as written.
 */
export function tokenize(text: string, terms: Term[]): Token[] {
	if (!terms.length) return [{ text }];
	const sorted = [...terms].sort((a, b) => b.abbr.length - a.abbr.length);
	const pattern = new RegExp(
		`(?<![\\w-])(${sorted.map((t) => escape(t.abbr)).join('|')})(?![\\w-])`,
		'g'
	);
	const tokens: Token[] = [];
	let last = 0;
	for (const match of text.matchAll(pattern)) {
		if (match.index > last) tokens.push({ text: text.slice(last, match.index) });
		tokens.push({ text: match[0], term: sorted.find((t) => t.abbr === match[0]) });
		last = match.index + match[0].length;
	}
	if (last < text.length) tokens.push({ text: text.slice(last) });
	return tokens;
}
