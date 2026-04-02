import { test, expect } from '../fixtures/coverage';
import { getSvg } from '../helpers/diagram-builder';

const DASHBOARD_FILE = 'diagramming-before-and-after.json';
const PANEL_IDS = { START: '4', END: '5' } as const;

test.describe('Configure Node & Edge Overrides', () => {
  test('Apply node fill color and edge stroke color overrides', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    await test.step('Navigate to panel with diagram', async () => {
      const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
      await gotoPanelEditPage({ dashboard, id: PANEL_IDS.START });

      const svg = getSvg(page);
      await expect(svg).toBeVisible({ timeout: 10000 });
      await expect(svg.locator('g.node')).toHaveCount(3);
      await expect(svg.locator('g.edge')).toHaveCount(2);
    });

    await test.step('Add node override and verify all nodes are available', async () => {
      const addButton = page.getByRole('button', { name: 'Add node override rule' });
      await addButton.click();
      await page.waitForTimeout(500);

      const multiSelect = page.getByText('Select nodes...').last();
      await multiSelect.click();
      await page.waitForTimeout(500);

      await expect(page.getByRole('option', { name: 'Server1', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Server2', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Server3', exact: true })).toBeVisible();

      await page.keyboard.press('Escape');
    });

    await test.step('Apply fill color to Server1 node', async () => {
      // Select Server1 in the node selector
      const multiSelect = page.getByText('Select nodes...').last();
      await multiSelect.click();
      await page.waitForTimeout(500);

      await page.getByRole('option', { name: 'Server1', exact: true }).click();
      await page.waitForTimeout(500);

      // Click "Override node property" button
      const overrideButton = page.getByRole('button', { name: 'Override node property' }).last();
      await overrideButton.click();
      await page.waitForTimeout(500);

      // Select "Fill Color" from menu
      await page.getByRole('menuitem', { name: 'Fill Color' }).click();
      await page.waitForTimeout(1000);

      // Verify the fill color rule was added
      await expect(page.getByText('Fill Color Override')).toBeVisible();
    });

    await test.step('Verify Server1 node has green fill color applied', async () => {
      const svg = getSvg(page);

      // Find the Server1 node in the SVG - it should have a green fill
      const server1Node = svg.locator('g.node').filter({ hasText: 'Server1' });
      await expect(server1Node).toBeVisible();

      // Check that it has a green fill color (#00FF00 or rgb(0, 255, 0))
      const ellipse = server1Node.locator('ellipse, polygon, path').first();
      await expect(ellipse).toHaveAttribute('fill', /#00ff00|rgb\(0,\s*255,\s*0\)/i);
    });

    await test.step('Add edge override and verify all edges are available', async () => {
      const addButton = page.getByRole('button', { name: 'Add edge override rule' });
      await addButton.click();
      await page.waitForTimeout(500);

      const multiSelect = page.getByText('Select edges...').last();
      await multiSelect.click();
      await page.waitForTimeout(500);

      await expect(page.getByRole('option', { name: 'Server1__to__Server2', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Server2__to__Server3', exact: true })).toBeVisible();

      await page.keyboard.press('Escape');
    });

    await test.step('Apply stroke color to Server1__to__Server2 edge', async () => {
      // Select Server1__to__Server2 in the edge selector
      const multiSelect = page.getByText('Select edges...').last();
      await multiSelect.click();
      await page.waitForTimeout(500);

      await page.getByRole('option', { name: 'Server1__to__Server2', exact: true }).click();
      await page.waitForTimeout(500);

      // Click "Override edge property" button
      const overrideButton = page.getByRole('button', { name: 'Override edge property' }).last();
      await overrideButton.click();
      await page.waitForTimeout(500);

      // Select "Stroke Color" from menu
      await page.getByRole('menuitem', { name: 'Stroke Color' }).click();
      await page.waitForTimeout(1000);

      // Verify the stroke color rule was added
      await expect(page.getByText('Stroke Color Override')).toBeVisible();
    });
  });
});
