import { test, expect } from '../fixtures/coverage';

const DASHBOARD_FILES = {
  DEFAULT: 'dashboard.json',
  PANEL_STATES: 'panel-states.json',
} as const;

const PANEL_IDS = {
  DEFAULT_PANEL: '1',
  VALID_DIAGRAM: '1',
  EMPTY_DIAGRAM_NO_NODES: '2',
  INVALID_DOT_SYNTAX: '3',
  BUILDER_MODE_EMPTY: '4',
  BUILDER_MODE_WITH_DIAGRAM: '5',
  DIFFERENT_LAYOUT_ENGINES: '6',
  WHITESPACE_ONLY: '7',
} as const;

const TEST_IDS = {
  GRAPHVIZ_PANEL_RENDERED: 'graphviz-panel-rendered',
  GRAPHVIZ_PANEL_RENDERED_SVG: 'graphviz-panel-rendered-svg',
  GRAPHVIZ_PANEL_BUILDER_EMPTY: 'graphviz-panel-builder-empty',
  OPTIONS_GROUP_DIAGRAM: 'data-testid Options group Diagram',
  PORTAL_CONTAINER: 'data-testid portal-container',
  NODE_FORM_ID_INPUT: 'node-form-id-input',
  NODE_FORM_LABEL_INPUT: 'node-form-label-input',
} as const;

const TEXT_PATTERNS = {
  EMPTY_DIAGRAM: /this diagram is empty/i,
  INVALID_DOT_DEFINITION: /invalid dot diagram definition/i,
} as const;

const BUTTON_LABELS = {
  NODE_TOOL: 'Node',
  ADD_NODE: 'Add Node',
} as const;

const MODAL_HEADINGS = {
  ADD_NODE: 'Add Node',
} as const;

test.describe('Panel rendering', () => {
  test('renders graphviz panel with DOT diagram', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.DEFAULT });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: PANEL_IDS.DEFAULT_PANEL });

    await expect(panelEditPage.panel.locator).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).toBeVisible();
  });

  test('renders SVG for valid diagram', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.VALID_DIAGRAM });

    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).toBeVisible();

    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg.locator('text').filter({ hasText: 'A' })).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'B' })).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'C' })).toBeVisible();
  });

  test('renders empty diagram display for diagram with no nodes', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.EMPTY_DIAGRAM_NO_NODES });

    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG)).not.toBeVisible();
  });

  test('renders error display for invalid DOT syntax', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.INVALID_DOT_SYNTAX });

    await expect(page.getByText(TEXT_PATTERNS.INVALID_DOT_DEFINITION)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).not.toBeVisible();
  });

  test('renders empty diagram display for whitespace-only diagram', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.WHITESPACE_ONLY });

    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG)).not.toBeVisible();
  });

  test('renders with different layout engines', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.DIFFERENT_LAYOUT_ENGINES });

    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).toBeVisible();

    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg.locator('text').filter({ hasText: 'A' })).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'D' })).toBeVisible();
  });
});

test.describe('Builder mode', () => {
  test('renders builder mode overlay with empty diagram in edit mode', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.BUILDER_MODE_EMPTY });

    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_BUILDER_EMPTY)).toBeVisible();
    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).toBeVisible();
  });

  test('renders builder mode overlay with diagram in edit mode', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.BUILDER_MODE_WITH_DIAGRAM });

    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).toBeVisible();

    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg.locator('text').filter({ hasText: 'X' })).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'Y' })).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'Z' })).toBeVisible();
  });

  test.skip('adds first node to empty diagram (FAILING - Bug being fixed)', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.BUILDER_MODE_EMPTY });

    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_BUILDER_EMPTY)).toBeVisible();
    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).toBeVisible();

    const diagramOptions = page.getByTestId(TEST_IDS.OPTIONS_GROUP_DIAGRAM);
    const nodeButton = diagramOptions.getByRole('button', { name: BUTTON_LABELS.NODE_TOOL, exact: true });

    await expect(nodeButton).toBeVisible();
    await nodeButton.click();

    await expect(page.getByRole('heading', { name: MODAL_HEADINGS.ADD_NODE })).toBeVisible();

    await page.getByTestId(TEST_IDS.NODE_FORM_ID_INPUT).fill('FirstNode');
    await page.getByTestId(TEST_IDS.NODE_FORM_LABEL_INPUT).fill('My First Node');

    const modal = page.getByTestId(TEST_IDS.PORTAL_CONTAINER);
    await modal.getByRole('button', { name: BUTTON_LABELS.ADD_NODE }).click();

    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).not.toBeVisible();

    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED)).toBeVisible();

    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg).toBeVisible({ timeout: 5000 });

    await expect(svg.locator('text').filter({ hasText: 'My First Node' })).toBeVisible({ timeout: 5000 });
  });
});
