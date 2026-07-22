import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/coverage';

const DASHBOARD_FILE = 'panel-states.json';
const ZOOM_PAN_PANEL_ID = '10';
const SVG_CONTAINER_TEST_ID = 'graphviz-panel-rendered-svg';

const getSvgTransform = async (page: Page): Promise<string> => {
  return page
    .getByTestId(SVG_CONTAINER_TEST_ID)
    .locator('svg')
    .evaluate((element: SVGSVGElement) => element.style.transform);
};

test('Zoom and pan - mouse wheel zooms the diagram around the cursor', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to the zoom-enabled panel', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
    await gotoPanelEditPage({ dashboard, id: ZOOM_PAN_PANEL_ID });
    await expect(page.getByTestId(SVG_CONTAINER_TEST_ID).locator('svg')).toBeVisible();
  });

  await test.step('Zoom in with the mouse wheel', async () => {
    const container = page.getByTestId(SVG_CONTAINER_TEST_ID);
    const box = await container.boundingBox();
    if (!box) {
      throw new Error('SVG container has no bounding box');
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -240);

    await expect.poll(() => getSvgTransform(page)).toContain('scale(');
  });

  await test.step('Reset the view with a double click', async () => {
    const container = page.getByTestId(SVG_CONTAINER_TEST_ID);
    await container.dblclick({ position: { x: 5, y: 5 } });

    await expect.poll(() => getSvgTransform(page)).toBe('');
  });
});

test('Zoom and pan - dragging pans the diagram', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
  await test.step('Navigate to the zoom-enabled panel', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
    await gotoPanelEditPage({ dashboard, id: ZOOM_PAN_PANEL_ID });
    await expect(page.getByTestId(SVG_CONTAINER_TEST_ID).locator('svg')).toBeVisible();
  });

  await test.step('Drag to pan the diagram', async () => {
    const container = page.getByTestId(SVG_CONTAINER_TEST_ID);
    const box = await container.boundingBox();
    if (!box) {
      throw new Error('SVG container has no bounding box');
    }
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 60, startY + 40, { steps: 5 });
    await page.mouse.up();

    await expect.poll(() => getSvgTransform(page)).toContain('translate(');
  });
});

test('Zoom and pan - disabled by default leaves the diagram static', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to a panel without zoom enabled', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILE });
    await gotoPanelEditPage({ dashboard, id: '6' });
    await expect(page.getByTestId(SVG_CONTAINER_TEST_ID).locator('svg')).toBeVisible();
  });

  await test.step('Mouse wheel does not transform the diagram', async () => {
    const container = page.getByTestId(SVG_CONTAINER_TEST_ID);
    const box = await container.boundingBox();
    if (!box) {
      throw new Error('SVG container has no bounding box');
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -240);

    expect(await getSvgTransform(page)).toBe('');
  });
});
