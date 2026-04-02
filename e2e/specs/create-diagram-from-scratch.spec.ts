import { test, expect } from '../fixtures/coverage';
import { Page } from '@playwright/test';
import {
  createNode,
  testDuplicateNodeValidation,
  createEdgeByDragging,
  editNode,
  editEdge,
  getSvg,
} from '../helpers/diagram-builder';

const DASHBOARD_FILE = 'diagramming-before-and-after.json';
const PANEL_IDS = { START: '1', END: '2' } as const;

async function verifyFinalDiagramState(page: Page) {
  const svg = getSvg(page);
  await expect(svg).toBeVisible({ timeout: 10000 });

  await expect(svg.locator('g.node')).toHaveCount(3);
  await expect(svg.locator('text').filter({ hasText: 'Server1' })).toBeVisible();
  await expect(svg.locator('text').filter({ hasText: 'Server2' })).toBeVisible();
  await expect(svg.locator('text').filter({ hasText: 'Server 3' })).toBeVisible();

  await expect(svg.locator('g.edge')).toHaveCount(2);
  await expect(svg.locator('text').filter({ hasText: 'connects' })).toBeVisible();
  await expect(svg.locator('text').filter({ hasText: 'links to' })).toBeVisible();
}

test.describe('Create Diagram From Scratch', () => {
  test('Verify target diagram matches expected end state', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    await test.step('Navigate to target diagram panel', async () => {
      const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
      await gotoPanelEditPage({ dashboard, id: PANEL_IDS.END });
    });

    await test.step('Verify final diagram structure', async () => {
      await verifyFinalDiagramState(page);
    });
  });

  test('Build complete diagram using builder and code modes', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    await test.step('Navigate to empty builder mode panel', async () => {
      const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
      await gotoPanelEditPage({ dashboard, id: PANEL_IDS.START });
    });

    await test.step('Verify empty state displayed', async () => {
      await expect(page.getByTestId('empty-state-add-node')).toBeVisible({ timeout: 5000 });
    });

    await test.step('Create Server1 with validation errors', async () => {
      await createNode(page, {
        id: 'Server1',
        label: 'WrongServer1',
        triggerButton: 'empty-state',
        testValidation: true,
      });

      const svg = getSvg(page);
      await expect(svg).toBeVisible({ timeout: 5000 });
      await expect(svg.locator('text').filter({ hasText: 'WrongServer1' })).toBeVisible();
    });

    await test.step('Create Server2 with duplicate ID validation and triangle shape', async () => {
      await testDuplicateNodeValidation(page, 'Server1', 'Server2', 'Triangle');

      const svg = getSvg(page);
      await expect(svg.locator('text').filter({ hasText: 'Server2' })).toBeVisible({ timeout: 5000 });
      await expect(svg.locator('g.node')).toHaveCount(2);
    });

    await test.step('Connect Server1 to Server2 with cancellations and dismissal test', async () => {
      await createEdgeByDragging(page, {
        fromNodeText: 'WrongServer1',
        fromNodeId: 'Server1',
        toNodeText: 'Server2',
        testCancellations: true,
        testDismissal: true,
      });

      const svg = getSvg(page);
      await expect(svg.locator('g.edge')).toHaveCount(1, { timeout: 5000 });
    });

    await test.step('Edit Server1: fix label and change to circle shape', async () => {
      await editNode(page, {
        nodeId: 'Server1',
        newLabel: 'Server1',
        newShape: 'Circle',
        testDismissal: true,
      });

      const svg = getSvg(page);
      await expect(svg.locator('text').filter({ hasText: /^Server1$/ })).toBeVisible({ timeout: 5000 });
      await expect(svg.locator('text').filter({ hasText: 'WrongServer1' })).not.toBeVisible();
    });

    await test.step('Add label to Server1→Server2 edge', async () => {
      await editEdge(page, {
        edgeId: 'edit-edge-Server1-Server2',
        newLabel: 'connects',
      });

      const svg = getSvg(page);
      await expect(svg.locator('text').filter({ hasText: 'connects' })).toBeVisible({ timeout: 5000 });
    });

    await test.step('Switch to Code mode', async () => {
      await page.getByRole('radio', { name: 'Code' }).click();
      await expect(page.getByRole('radio', { name: 'Code' })).toBeChecked();
    });

    await test.step('Add Server3 and edge in DOT code', async () => {
      const diagramSection = page.locator('[data-testid*="data-testid Options group Diagram"]');
      const codeEditor = diagramSection.locator('.monaco-editor textarea').first();
      await expect(codeEditor).toBeVisible({ timeout: 5000 });

      await codeEditor.focus();
      await page.keyboard.press('End');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await page.keyboard.type('  Server3 [label="Server 3"];');
      await page.keyboard.press('Enter');
      await page.keyboard.type('  Server2 -> Server3 [label="links to"];');
      await page.keyboard.press('Escape');

      await page.waitForTimeout(1000);

      const svg = getSvg(page);
      await expect(svg.locator('text').filter({ hasText: 'Server 3' })).toBeVisible({ timeout: 5000 });
      await expect(svg.locator('text').filter({ hasText: 'links to' })).toBeVisible({ timeout: 5000 });
      await expect(svg.locator('g.node')).toHaveCount(3);
      await expect(svg.locator('g.edge')).toHaveCount(2);
    });

    await test.step('Change layout to Left to Right', async () => {
      const layoutDirectionInput = page.locator('#grafana-graphviz-panel-rankDirection');
      await layoutDirectionInput.click();
      await page.getByText('Left to Right', { exact: true }).click();
      await page.waitForTimeout(1000);

      const svg = getSvg(page);
      await expect(svg.locator('g.node')).toHaveCount(3);
      await expect(svg.locator('g.edge')).toHaveCount(2);
    });

    await test.step('Verify final diagram matches END state', async () => {
      await verifyFinalDiagramState(page);
    });
  });
});
