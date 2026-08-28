import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const registered: Array<Record<string, unknown>> = [];
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        registerTool(tool: Record<string, unknown>) {
          registered.push(tool);
        },
      },
    });
    Object.defineProperty(window, '__ledgerTools', { configurable: true, value: registered });
  });
});

test('observe, understand, draft, and prove within the fictional boundary', async ({ page }) => {
  const offOriginRequests: string[] = [];
  page.on('request', (request) => {
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') offOriginRequests.push(request.url());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Personal Ledger' })).toBeVisible();
  await expect(page.getByText('Fictional demo', { exact: true })).toBeVisible();
  await expect(page.getByText(/not financial advice/i)).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Demo state ready');

  await page.getByLabel('Category filter').selectOption('Groceries');
  const table = page.getByRole('table', { name: 'Demo transactions' });
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await expect(table.getByText('Groceries')).toHaveCount(1);
  await expect(table.getByText('Pine & Rail')).toHaveCount(0);

  await page.getByRole('button', { name: 'Draft an entry' }).click();
  await page.getByLabel('Merchant').fill('Juniper Home Supply');
  await page.getByLabel('Amount').fill('42.99');
  await page.getByLabel('Draft category').selectOption('Home');
  await page.getByRole('button', { name: 'Save demo draft' }).click();
  await expect(page.getByRole('status')).toContainText('Draft created');

  await page.getByLabel('Category filter').selectOption('Home');
  await expect(table.getByText('draft', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear drafts' }).click();
  await expect(page.getByRole('status')).toContainText('cleared');
  await expect(table.getByText('draft', { exact: true })).toHaveCount(0);

  const registeredToolNames = await page.evaluate(() =>
    ((window as unknown as { __ledgerTools: Array<{ name: string }> }).__ledgerTools ?? []).map(
      (tool) => tool.name,
    ),
  );
  expect(registeredToolNames).toEqual([
    'get_ledger_summary',
    'list_demo_transactions',
    'create_demo_entry',
  ]);
  expect(offOriginRequests).toEqual([]);
});

test('layout remains usable at the configured viewport', async ({ page }) => {
  await page.goto('/');
  const body = page.locator('body');
  const dimensions = await body.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole('button', { name: 'Draft an entry' })).toBeVisible();
});
