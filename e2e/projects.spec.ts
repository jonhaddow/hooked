import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('adds a project, links a pattern, notes it and deletes it', async ({ page }) => {
	await open(page, '/projects');
	await page.getByRole('textbox', { name: 'New project name' }).fill('Bear for Sam');
	await page.getByRole('button', { name: 'Add' }).click();
	await expect(page).toHaveURL(/\/projects\/\d+$/);

	await page.getByText('Making', { exact: true }).click();
	await page.getByLabel('Pattern').selectOption({ label: 'Test Bear' });
	await page.getByLabel('Notes').fill('Brown yarn, 3.5 mm hook');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
	await expect(page.getByText('0% of the pattern ticked')).toBeVisible();

	await page.reload();
	await expect(page.getByLabel('Notes')).toHaveValue('Brown yarn, 3.5 mm hook');

	await page.getByRole('link', { name: '‹ Projects' }).click();
	await expect(page.getByRole('link', { name: /Bear for Sam.*Test Bear.*Making/s })).toBeVisible();

	await page.getByRole('link', { name: /Bear for Sam/ }).click();
	await page.getByRole('button', { name: 'Delete project' }).click();
	await page.getByRole('button', { name: 'Delete', exact: true }).click();
	await expect(page).toHaveURL(/\/projects$/);
	await expect(page.getByText('Nothing on the go.', { exact: false })).toBeVisible();
});
