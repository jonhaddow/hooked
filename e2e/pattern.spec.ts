import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('ticks off a pattern, a round at a time', async ({ page }) => {
	await open(page, '/');
	await page.getByRole('link', { name: /Test Bear/ }).click();
	await expect(page.getByRole('heading', { name: 'Test Bear' })).toBeVisible();
	await expect(page.getByText('0 of 7 rounds and steps')).toBeVisible();

	// Tapping the row ticks it.
	await page.getByText('6 sc in a magic ring').click();
	await expect(page.getByRole('button', { name: 'Rnd 1 done' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	// A repeated round counts up, one tap a round.
	const repeat = page.locator('.tick').nth(1);
	await repeat.click();
	await expect(repeat).toHaveText('1/3');
	await page.getByRole('button', { name: 'Undo one' }).click();
	await expect(repeat).toHaveText('0/3');
	await repeat.click();
	await repeat.click();
	const saved = page.waitForResponse((r) => r.request().postData()?.includes('"done":3') ?? false);
	await repeat.click();
	await expect(page.getByRole('button', { name: 'Rnd 2-4 done' })).toBeVisible();

	// Ticks are saved.
	await saved;
	await page.reload();
	await expect(page.getByText('4 of 7 rounds and steps')).toBeVisible();
	await expect(page.getByRole('button', { name: /Carry on: Head/ })).toBeVisible();
});

test('makes each copy of a section', async ({ page }) => {
	await open(page, '/p/test-bear');
	const ears = page.locator('section', { has: page.getByRole('heading', { name: 'Ears' }) });
	await ears.getByRole('button', { name: 'Rnd 1 not done' }).click();
	// The first ear is done; on to the second.
	await expect(ears.getByRole('button', { name: '✓ 1 of 2' })).toBeVisible();
	await ears.getByRole('button', { name: '2 of 2' }).click();
	await expect(ears.getByRole('button', { name: 'Rnd 1 not done' })).toBeVisible();
});

test('explains abbreviations', async ({ page }) => {
	await open(page, '/p/test-bear');
	await page.getByRole('button', { name: 'inc', exact: true }).first().click();
	const sheet = page.getByRole('dialog');
	await expect(sheet.getByText('Two sc in the same stitch.')).toBeVisible();
	await sheet.getByRole('button', { name: 'Close' }).click();
	await expect(sheet).toBeHidden();
});

test('starts again', async ({ page }) => {
	await open(page, '/p/test-bear');
	await page.getByRole('button', { name: 'Start again' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Clear my ticks' }).click();
	await expect(page.getByText('0 of 7 rounds and steps')).toBeVisible();
	await page.reload();
	await expect(page.getByText('0 of 7 rounds and steps')).toBeVisible();
});
