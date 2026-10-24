import { describe, expect, it } from 'vitest';
import {
	allSteps,
	copiesDone,
	nextStep,
	stepTimes,
	tokenize,
	totals,
	type Pattern,
	type Term
} from './pattern.ts';

const pattern: Pattern = {
	slug: 'p',
	title: 'P',
	designer: 'D',
	notes: [],
	materials: [],
	terms: [],
	sections: [
		{
			id: 'body',
			name: 'Body',
			steps: [
				{ id: 'r1', text: 'mr 6', count: 6 },
				{ id: 'r2', text: 'sc around', times: 3 }
			]
		},
		{ id: 'petal', name: 'Petal', make: 2, steps: [{ id: 'r1', text: '6 inc' }] },
		{ id: 'face', name: 'Face', optional: true, steps: [{ id: 'smile', text: 'Smile' }] }
	]
};

describe('steps', () => {
	it('lists each copy of a section in turn', () => {
		expect(allSteps(pattern).map((s) => s.key)).toEqual([
			'body/0/r1',
			'body/0/r2',
			'petal/0/r1',
			'petal/1/r1',
			'face/0/smile'
		]);
	});

	it('knows how many times a step is done, and refuses unknown keys', () => {
		expect(stepTimes(pattern, 'body/0/r2')).toBe(3);
		expect(stepTimes(pattern, 'petal/1/r1')).toBe(1);
		expect(stepTimes(pattern, 'petal/2/r1')).toBeNull();
	});
});

describe('progress', () => {
	it('counts rounds, leaving out optional sections', () => {
		expect(totals(pattern, {})).toEqual({ done: 0, total: 6 });
		expect(totals(pattern, { 'body/0/r1': 1, 'body/0/r2': 2, 'face/0/smile': 1 })).toEqual({
			done: 3,
			total: 6
		});
	});

	it('finds the next step, optional ones last', () => {
		expect(nextStep(pattern, {})?.key).toBe('body/0/r1');
		// Part way through a repeated round: still that round.
		expect(nextStep(pattern, { 'body/0/r1': 1, 'body/0/r2': 2 })?.key).toBe('body/0/r2');
		const allButOptional = { 'body/0/r1': 1, 'body/0/r2': 3, 'petal/0/r1': 1, 'petal/1/r1': 1 };
		expect(nextStep(pattern, allButOptional)?.key).toBe('face/0/smile');
		expect(nextStep(pattern, { ...allButOptional, 'face/0/smile': 1 })).toBeNull();
	});

	it('knows which copies are finished', () => {
		expect(copiesDone(pattern.sections[1], { 'petal/1/r1': 1 })).toEqual([false, true]);
	});
});

describe('tokenize', () => {
	const terms: Term[] = [
		{ abbr: 'sc', meaning: 'Single crochet' },
		{ abbr: 'hdc', meaning: 'Half double crochet' },
		{ abbr: 'hdc-inc', meaning: 'Half double crochet increase' },
		{ abbr: 'inc', meaning: 'Increase' },
		{ abbr: 'close the opening', meaning: 'Closing an opening' }
	];
	const linked = (text: string) =>
		tokenize(text, terms)
			.map((t) => (t.term ? `[${t.text}]` : t.text))
			.join('');

	it('links whole abbreviations, longest first', () => {
		expect(linked('2 inc, 2 hdc-inc, sc')).toBe('2 [inc], 2 [hdc-inc], [sc]');
		expect(linked('(sc, inc) x8')).toBe('([sc], [inc]) x8');
	});

	it('leaves words that only contain one alone', () => {
		expect(linked('scissors and incs')).toBe('scissors and incs');
	});

	it('links phrases', () => {
		expect(linked('FO and close the opening.')).toBe('FO and [close the opening].');
	});
});
