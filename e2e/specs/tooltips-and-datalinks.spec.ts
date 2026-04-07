import { test, expect } from '../fixtures/coverage';
import { getSvg, getNodeById, getEdgeById } from '../helpers/diagram-builder';

const DASHBOARD_FILE = 'tooltips-and-datalinks.json';

test.describe('Tooltips and DataLinks', () => {
  test.beforeEach(async ({ gotoDashboardPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
    await gotoDashboardPage({ uid: dashboard.uid });

    const panel = page.getByRole('region', { name: 'Tooltips & Datalinks Demo' });
    await expect(panel).toBeVisible({ timeout: 10000 });

    const svg = getSvg(page);
    await expect(svg).toBeVisible({ timeout: 10000 });
  });

  test.describe('Node Tooltips', () => {
    test('should display tooltip on hover over WebServer node', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');
      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');

      await test.step('Find the WebServer node', async () => {
        await expect(webServerNode).toBeVisible();
      });

      await test.step('Hover over the node', async () => {
        await webServerNode.hover();
      });

      await test.step('Verify tooltip is visible with correct content', async () => {
        await expect(tooltip).toBeVisible();
        await expect(tooltip.getByText('CPU: 45%', { exact: false })).toBeVisible();
        await expect(tooltip.getByText('Memory: 62%', { exact: false })).toBeVisible();
        await expect(tooltip.getByText('Status: healthy', { exact: false })).toBeVisible();
      });
    });

    test('should display tooltip with datalinks for API node', async ({ page }) => {
      const svg = getSvg(page);
      const apiNode = getNodeById(page, 'API');
      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');

      await test.step('Hover over API node', async () => {
        await apiNode.hover();
      });

      await test.step('Verify tooltip with datalink', async () => {
        await expect(tooltip).toBeVisible();

        const link = tooltip.getByRole('link', { name: 'Server Dashboard' });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', 'https://grafana.com/docs?server=API');
        await expect(link).toHaveAttribute('target', '_blank');
      });
    });

    test('should display tooltip with only datalinks for Database node', async ({ page }) => {
      const svg = getSvg(page);
      const databaseNode = getNodeById(page, 'Database');
      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');

      await test.step('Hover over Database node', async () => {
        await databaseNode.hover();
      });

      await test.step('Verify tooltip with datalinks only', async () => {
        await expect(tooltip).toBeVisible();

        const link1 = tooltip.getByRole('link', { name: 'View Logs' });
        const link2 = tooltip.getByRole('link', { name: 'View Metrics' });

        await expect(link1).toBeVisible();
        await expect(link2).toBeVisible();
        await expect(link1).toHaveAttribute('href', 'https://grafana.com/docs/logs?id=Database');
        await expect(link2).toHaveAttribute('href', 'https://grafana.com/docs/metrics?id=Database');
        await expect(link1).toHaveAttribute('target', '_self');
        await expect(link2).toHaveAttribute('target', '_blank');
      });
    });

    test('should display tooltip with only datalinks for Cache node', async ({ page }) => {
      const svg = getSvg(page);
      const cacheNode = getNodeById(page, 'Cache');

      await cacheNode.hover();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      const link1 = tooltip.getByRole('link', { name: 'View Logs' });
      const link2 = tooltip.getByRole('link', { name: 'View Metrics' });

      await expect(link1).toBeVisible();
      await expect(link2).toBeVisible();

      await expect(link1).toHaveAttribute('href', 'https://grafana.com/docs/logs?id=Cache');
      await expect(link2).toHaveAttribute('href', 'https://grafana.com/docs/metrics?id=Cache');
    });

    test('should hide tooltip when mouse leaves node (unpinned)', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');

      await webServerNode.hover();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      await page.mouse.move(0, 0);

      await expect(tooltip).not.toBeVisible();
    });
  });

  test.describe('Edge Tooltips', () => {
    test('should display tooltip on hover over WebServer->API edge', async ({ page }) => {
      const svg = getSvg(page);

      await test.step('Find and hover over edge', async () => {
        const edge = getEdgeById(page, 'WebServer__to__API');
        await expect(edge).toBeVisible();
        await edge.hover();
      });

      await test.step('Verify tooltip content', async () => {
        const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
        await expect(tooltip).toBeVisible();
        await expect(tooltip.getByText('Latency: 12ms', { exact: false })).toBeVisible();
        await expect(tooltip.getByText('Requests/sec: 450', { exact: false })).toBeVisible();
      });
    });

    test('should display tooltip with datalinks for API->Database edge', async ({ page }) => {
      const svg = getSvg(page);

      await test.step('Hover over edge', async () => {
        const edge = getEdgeById(page, 'API__to__Database');
        await edge.hover();
      });

      await test.step('Verify tooltip with datalinks', async () => {
        const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
        await expect(tooltip).toBeVisible();

        const link1 = tooltip.getByRole('link', { name: 'View Traffic Dashboard' });
        const link2 = tooltip.getByRole('link', { name: 'View Latency Metrics' });

        await expect(link1).toBeVisible();
        await expect(link2).toBeVisible();
        await expect(link1).toHaveAttribute('href', 'https://grafana.com/docs?edge=API__to__Database');
        await expect(link2).toHaveAttribute('href', 'https://grafana.com/docs?from=API&to=Database');
        await expect(link1).toHaveAttribute('target', '_blank');
        await expect(link2).toHaveAttribute('target', '_self');
      });
    });

    test('should display tooltip with content only for API->Cache edge', async ({ page }) => {
      const svg = getSvg(page);
      const edge = getEdgeById(page, 'API__to__Cache');

      await edge.hover();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      await expect(tooltip.getByText('Type: Redis', { exact: false })).toBeVisible();
      await expect(tooltip.getByText('Status: active', { exact: false })).toBeVisible();

      const links = tooltip.locator('a');
      await expect(links).toHaveCount(0);
    });
  });

  test.describe('Click-to-Pin Behavior', () => {
    test('should pin tooltip when clicking on node', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');

      await webServerNode.click();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      await page.mouse.move(0, 0);

      await expect(tooltip).toBeVisible();

      const closeButton = tooltip.getByRole('button', { name: 'Close' });
      await expect(closeButton).toBeVisible();
    });

    test('should allow clicking on datalinks when tooltip is pinned', async ({ page }) => {
      const svg = getSvg(page);
      const apiNode = getNodeById(page, 'API');

      await apiNode.click();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      const link = tooltip.getByRole('link', { name: 'Server Dashboard' });
      await expect(link).toBeVisible();

      await link.hover();
      await expect(tooltip).toBeVisible();

      await expect(link).toHaveAttribute('href', 'https://grafana.com/docs?server=API');
    });

    test('should close pinned tooltip when clicking close button', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');

      await webServerNode.click();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      const closeButton = tooltip.getByRole('button', { name: 'Close' });
      await closeButton.click();

      await expect(tooltip).not.toBeVisible();
    });

    test('should close pinned tooltip when clicking outside', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');

      await webServerNode.click();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      await page.click('body', { position: { x: 10, y: 10 } });

      await expect(tooltip).not.toBeVisible();
    });

    test('should show only one pinned tooltip at a time', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');
      const apiNode = getNodeById(page, 'API');

      await webServerNode.click();

      let tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();
      await expect(tooltip.getByText('CPU: 45%', { exact: false })).toBeVisible();

      await apiNode.click();

      const tooltips = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltips).toHaveCount(1);

      tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip.getByText('CPU: 78%', { exact: false })).toBeVisible();
    });

    test('should toggle tooltip off when clicking same node twice', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');

      await webServerNode.click();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      await webServerNode.click();

      await expect(tooltip).not.toBeVisible();
    });

    test('should pin edge tooltip on click', async ({ page }) => {
      const svg = getSvg(page);
      const edge = getEdgeById(page, 'WebServer__to__API');

      await edge.click();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      await page.mouse.move(0, 0);

      await expect(tooltip).toBeVisible();
      await expect(tooltip.getByText('Latency: 12ms', { exact: false })).toBeVisible();
    });

    test('should allow switching between node and edge pinned tooltips', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');
      const edge = getEdgeById(page, 'API__to__Cache');

      await webServerNode.click();

      let tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();
      await expect(tooltip.getByText('CPU: 45%', { exact: false })).toBeVisible();

      await edge.click();

      const tooltips = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltips).toHaveCount(1);

      tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip.getByText('Type: Redis', { exact: false })).toBeVisible();
    });
  });

  test.describe('Tooltip Styling', () => {
    test('should have larger corner radius', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');

      await webServerNode.hover();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      const borderRadius = await tooltip.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius;
      });

      expect(borderRadius).toBe('8px');
    });

    test('should have proper section dividers', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');

      await webServerNode.hover();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      const sections = await tooltip.evaluate((el) => {
        const children = Array.from(el.children);
        return children.length;
      });

      expect(sections).toBeGreaterThanOrEqual(2);
    });

    test('should use small typography', async ({ page }) => {
      const svg = getSvg(page);
      const webServerNode = getNodeById(page, 'WebServer');

      await webServerNode.hover();

      const tooltip = page.locator('[data-portal="graphviz-tooltip"]');
      await expect(tooltip).toBeVisible();

      const fontSize = await tooltip.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });

      const fontSizeNum = parseInt(fontSize, 10);
      expect(fontSizeNum).toBeLessThanOrEqual(13);
    });
  });
});
