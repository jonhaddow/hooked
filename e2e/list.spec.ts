import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('filters patterns by craft and search', async ({ page }) => {
	await open(page, '/');
	const bear = page.getByRole('link', { name: /Test Bear/ });
	const scarf = page.getByRole('link', { name: /Test Scarf/ });
	await expect(bear).toBeVisible();
	await expect(scarf).toBeVisible();

	await page.getByText('Knitting', { exact: true }).click();
	await expect(bear).toBeHidden();
	await expect(scarf).toBeVisible();

	await page.getByText('All', { exact: true }).click();
	await page.getByRole('searchbox', { name: 'Search patterns' }).fill('bear');
	await expect(bear).toBeVisible();
	await expect(scarf).toBeHidden();

	await page.getByText('Crochet', { exact: true }).click();
	await page.getByRole('searchbox', { name: 'Search patterns' }).fill('scarf');
	await expect(page.getByText('No patterns match.')).toBeVisible();
});
