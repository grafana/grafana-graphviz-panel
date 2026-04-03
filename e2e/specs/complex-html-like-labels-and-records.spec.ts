import { test, expect } from '../fixtures/coverage';
import { getSvg } from '../helpers/diagram-builder';

const DASHBOARD_FILE = 'html-labels-and-records.json';
const PANEL_ID = '6';

test.describe('Complex HTML Labels and Records with Port-Based Edge Overrides', () => {
  test('Verify port-based edge overrides are applied correctly', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    await test.step('Navigate to Port Support Demo panel', async () => {
      const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
      await gotoPanelEditPage({ dashboard, id: PANEL_ID });

      const svg = getSvg(page);
      await expect(svg).toBeVisible({ timeout: 10000 });
    });

    await test.step('Verify diagram contains expected nodes with HTML and record labels', async () => {
      const svg = getSvg(page);

      await expect(svg.locator('text').filter({ hasText: 'Web Server' })).toBeVisible();
      await expect(svg.locator('text').filter({ hasText: 'Database' })).toBeVisible();
      await expect(svg.locator('text').filter({ hasText: 'Client' })).toBeVisible();
      await expect(svg.locator('text').filter({ hasText: 'Processor' })).toBeVisible();
      await expect(svg.locator('text').filter({ hasText: 'REST API' })).toBeVisible();
    });

    await test.step('Verify data-driven edge override: Client__to__Server:https with color, width, and label', async () => {
      const svg = getSvg(page);

      await expect(svg.locator('text').filter({ hasText: 'HTTPS - 1.2 Gbps' })).toBeVisible();

      const edges = svg.locator('g.edge');
      const edgeCount = await edges.count();

      let foundHttpsEdge = false;
      for (let i = 0; i < edgeCount; i++) {
        const edge = edges.nth(i);
        const titleText = await edge.locator('title').textContent();

        if (titleText && titleText.includes('Client__to__Server:https')) {
          const edgePath = edge.locator('path').first();
          const strokeColor = await edgePath.getAttribute('stroke');
          const strokeWidth = await edgePath.getAttribute('stroke-width');
          const labelElement = edge.locator('text');
          const hasLabel = (await labelElement.count()) > 0;

          expect(strokeColor).toMatch(/#f2495c|rgb\(242,\s*73,\s*92\)/i);
          expect(parseFloat(strokeWidth || '0')).toBeGreaterThanOrEqual(4);

          if (hasLabel) {
            const labelText = await labelElement.textContent();
            expect(labelText).toContain('1.2 Gbps');
          }

          foundHttpsEdge = true;
          break;
        }
      }

      expect(foundHttpsEdge).toBe(true);
    });

    await test.step('Verify data-driven edge override: Server:http__to__Database:read exists and renders', async () => {
      const svg = getSvg(page);

      const edges = svg.locator('g.edge');
      const edgeCount = await edges.count();

      let foundReadEdge = false;
      for (let i = 0; i < edgeCount; i++) {
        const edge = edges.nth(i);
        const titleText = await edge.locator('title').textContent();

        if (titleText && titleText.includes('Server:http__to__Database:read')) {
          const edgePath = edge.locator('path').first();
          await expect(edgePath).toBeVisible();

          const strokeColor = await edgePath.getAttribute('stroke');
          expect(strokeColor).toBeTruthy();

          foundReadEdge = true;
          break;
        }
      }

      expect(foundReadEdge).toBe(true);
    });

    await test.step('Verify manual edge override: LoadBalancer:out__to__APIGateway:api with static color and width', async () => {
      const svg = getSvg(page);

      const edges = svg.locator('g.edge');
      const edgeCount = await edges.count();

      let foundManualEdge = false;
      for (let i = 0; i < edgeCount; i++) {
        const edge = edges.nth(i);
        const titleText = await edge.locator('title').textContent();

        if (titleText && titleText.includes('LoadBalancer:out__to__APIGateway:api')) {
          const edgePath = edge.locator('path').first();
          const strokeColor = await edgePath.getAttribute('stroke');
          const strokeWidth = await edgePath.getAttribute('stroke-width');

          expect(strokeColor).toMatch(/#ff6b6b|rgb\(255,\s*107,\s*107\)/i);
          expect(parseFloat(strokeWidth || '0')).toBeGreaterThanOrEqual(3);
          foundManualEdge = true;
          break;
        }
      }

      expect(foundManualEdge).toBe(true);
    });

    await test.step('Verify edges render correctly', async () => {
      const svg = getSvg(page);
      const edges = svg.locator('g.edge');

      await expect(edges.first()).toBeVisible();
    });

    await test.step('Verify all expected edges are present', async () => {
      const svg = getSvg(page);
      const edges = svg.locator('g.edge');

      const edgeCount = await edges.count();
      expect(edgeCount).toBe(5);
    });
  });
});
