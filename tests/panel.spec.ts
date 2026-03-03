import { test, expect } from '@grafana/plugin-e2e';

test('should render graphviz panel with DOT diagram', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });

  await expect(panelEditPage.panel.locator).toBeVisible();
  await expect(page.getByTestId('graphviz-panel')).toBeVisible();
  await expect(page.getByTestId('graphviz-panel-svg').locator('svg')).toBeVisible();
});
