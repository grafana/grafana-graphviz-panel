import { test, expect } from '../fixtures/coverage';

const DASHBOARD_FILE = 'dashboard-variables.json';

test('Dashboard variables - Verify variable interpolation in SVG diagram content', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to dashboard', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
    await gotoDashboardPage({ uid: dashboard.uid });
  });

  await test.step('Verify initial variable value', async () => {
    const variableValue = page.getByText('Environment').locator('..').getByText('production');
    await expect(variableValue).toBeVisible();
  });

  await test.step('Verify variable in Application Server Status SVG', async () => {
    const panel = page.getByRole('region', { name: 'Application server status' });
    await expect(panel.getByText('Server environment: production')).toBeVisible();
  });

  await test.step('Verify variable in Network Status SVG', async () => {
    const panel = page.getByRole('region', { name: 'Network status' });
    await expect(panel.getByText('Network environment: production')).toBeVisible();
  });

  await test.step('Click different environment node', async () => {
    const envHealthPanel = page.getByRole('region', { name: 'Environment health checks' });
    const stagingLink = envHealthPanel.getByText('staging').locator('..');
    await stagingLink.click();
  });

  await test.step('Wait for page reload', async () => {
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/var-environment=staging/);
  });

  await test.step('Verify updated variable in Application Server Status SVG', async () => {
    const panel = page.getByRole('region', { name: 'Application server status' });
    await expect(panel.getByText('Server environment: staging')).toBeVisible();
  });

  await test.step('Verify updated variable in Network Status SVG', async () => {
    const panel = page.getByRole('region', { name: 'Network status' });
    await expect(panel.getByText('Network environment: staging')).toBeVisible();
  });
});
