import { test, expect } from '../fixtures/coverage';

const DASHBOARD_FILE = 'dashboard-variables.json';

test('Dashboard variables - Diagrams with node/edge overrides', async ({
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

test('Dashboard variables - Diagram without overrides', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to dashboard', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
    await gotoDashboardPage({ uid: dashboard.uid });
  });

  await test.step('Verify initial variable value is production', async () => {
    const variableValue = page.getByText('Environment').locator('..').getByText('production');
    await expect(variableValue).toBeVisible();
  });

  await test.step('Verify Hostname panel exists', async () => {
    const panel = page.getByRole('region', { name: 'Hostname' });
    await expect(panel).toBeVisible({ timeout: 10000 });
  });

  await test.step('Verify hostname interpolation in Hostname panel (production)', async () => {
    const panel = page.getByRole('region', { name: 'Hostname' });

    // The Server node should show the actual hostname value "web-01.prod"
    // NOT the literal string "${hostname}"
    await expect(panel.getByText('web-01.prod')).toBeVisible();

    // Should NOT show the literal "${hostname}" text
    const literalHostname = panel.getByText('${hostname}', { exact: true });
    await expect(literalHostname).not.toBeVisible();
  });

  await test.step('Change environment to staging', async () => {
    const envHealthPanel = page.getByRole('region', { name: 'Environment health checks' });
    const stagingLink = envHealthPanel.getByText('staging').locator('..');
    await stagingLink.click();
  });

  await test.step('Wait for page reload', async () => {
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/var-environment=staging/);
  });

  await test.step('Verify hostname interpolation updates for staging environment', async () => {
    const panel = page.getByRole('region', { name: 'Hostname' });

    // Should show staging hostname
    await expect(panel.getByText('web-01.staging')).toBeVisible();

    // Should NOT show production hostname
    await expect(panel.getByText('web-01.prod')).not.toBeVisible();

    // Should NOT show the literal "${hostname}" text
    const literalHostname = panel.getByText('${hostname}', { exact: true });
    await expect(literalHostname).not.toBeVisible();
  });

  await test.step('Change environment to development', async () => {
    const envHealthPanel = page.getByRole('region', { name: 'Environment health checks' });
    const devLink = envHealthPanel.getByText('development').locator('..');
    await devLink.click();
  });

  await test.step('Wait for page reload', async () => {
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/var-environment=development/);
  });

  await test.step('Verify hostname interpolation updates for development environment', async () => {
    const panel = page.getByRole('region', { name: 'Hostname' });

    // Should show development hostname
    await expect(panel.getByText('web-01.dev')).toBeVisible();

    // Should NOT show staging or production hostnames
    await expect(panel.getByText('web-01.staging')).not.toBeVisible();
    await expect(panel.getByText('web-01.prod')).not.toBeVisible();

    // Should NOT show the literal "${hostname}" text
    const literalHostname = panel.getByText('${hostname}', { exact: true });
    await expect(literalHostname).not.toBeVisible();
  });
});
