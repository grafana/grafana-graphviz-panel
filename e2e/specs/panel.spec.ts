import { test, expect } from '../fixtures/coverage';

const DASHBOARD_FILES = {
  DEFAULT: 'dashboard.json',
  PANEL_STATES: 'panel-states.json',
} as const;

const PANEL_IDS = {
  // Builder Mode panels
  BUILDER_MODE_INVALID: '1',
  BUILDER_MODE_EMPTY: '2',
  BUILDER_MODE_VALID: '3',

  // Code Mode panels
  CODE_MODE_INVALID: '4',
  CODE_MODE_EMPTY: '5',
  CODE_MODE_VALID: '6',

  // Query Mode panels
  QUERY_MODE_INVALID: '7',
  QUERY_MODE_EMPTY: '8',
  QUERY_MODE_VALID: '9',
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

test('Builder mode - Invalid diagram - displays error message', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to Builder Mode - Invalid Diagram panel', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.BUILDER_MODE_INVALID });
  });

  await test.step('Verify error message is displayed', async () => {
    await expect(page.getByText(TEXT_PATTERNS.INVALID_DOT_DEFINITION)).toBeVisible();
  });

  await test.step('Verify SVG diagram is not displayed', async () => {
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).not.toBeVisible();
  });
});

test('Builder mode - Valid diagram - displays diagram with nodes', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to Builder Mode - Valid Diagram panel', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.BUILDER_MODE_VALID });
  });

  await test.step('Verify diagram is rendered', async () => {
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).toBeVisible();
  });

  await test.step('Verify diagram contains expected nodes', async () => {
    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg.locator('text').filter({ hasText: 'User' })).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'Panel' })).toBeVisible();
  });
});

test('Builder mode - Empty diagram - displays empty message and Add Node button in edit mode', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to Builder Mode - Empty Diagram panel in edit mode', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.BUILDER_MODE_EMPTY });
  });

  await test.step('Verify empty diagram message is displayed', async () => {
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_BUILDER_EMPTY)).toBeVisible();
    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).toBeVisible();
  });

  await test.step('Verify Add Node button is displayed in empty state', async () => {
    await expect(page.getByRole('button', { name: 'Add Node', exact: true })).toBeVisible();
  });

  await test.step('Click Add Node button to open modal', async () => {
    await page.getByRole('button', { name: 'Add Node', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Add Node' })).toBeVisible();
  });

  await test.step('Fill in node details', async () => {
    await page.getByTestId(TEST_IDS.NODE_FORM_ID_INPUT).fill('FirstNode');
    await page.getByTestId(TEST_IDS.NODE_FORM_LABEL_INPUT).fill('My First Node');
  });

  await test.step('Submit the Add Node form', async () => {
    const modal = page.getByTestId(TEST_IDS.PORTAL_CONTAINER);
    await modal.getByRole('button', { name: 'Add Node', exact: true }).click();
  });

  await test.step('Verify diagram is now rendered with the new node', async () => {
    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).not.toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED)).toBeVisible();

    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg).toBeVisible({ timeout: 5000 });
    await expect(svg.locator('text').filter({ hasText: 'My First Node' })).toBeVisible({ timeout: 5000 });
  });

  await test.step('Verify diagram persists (empty message gone)', async () => {
    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).not.toBeVisible();

    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'My First Node' })).toBeVisible();
  });
});

test('Code mode - Invalid diagram - displays error message', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to Code Mode - Invalid Diagram panel', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.CODE_MODE_INVALID });
  });

  await test.step('Verify error message is displayed', async () => {
    await expect(page.getByText(TEXT_PATTERNS.INVALID_DOT_DEFINITION)).toBeVisible();
  });

  await test.step('Verify SVG diagram is not displayed', async () => {
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).not.toBeVisible();
  });
});

test('Code mode - Valid diagram - displays diagram with nodes', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to Code Mode - Valid Diagram panel', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.CODE_MODE_VALID });
  });

  await test.step('Verify diagram is rendered', async () => {
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).toBeVisible();
  });

  await test.step('Verify diagram contains expected nodes', async () => {
    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg.locator('text').filter({ hasText: 'User' })).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'Panel' })).toBeVisible();
  });
});

test('Code mode - Empty diagram - displays empty message with code example in edit mode', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to Code Mode - Empty Diagram panel in edit mode', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.CODE_MODE_EMPTY });
  });

  await test.step('Verify empty diagram message is displayed', async () => {
    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).toBeVisible();
  });

  await test.step('Verify code example is shown', async () => {
    await expect(page.getByText(/add a node definition to the dot diagram source code/i)).toBeVisible();
    await expect(page.locator('code').filter({ hasText: /MyNode/ })).toBeVisible();
  });

  await test.step('Locate Monaco editor', async () => {
    const diagramOptions = page.getByTestId(TEST_IDS.OPTIONS_GROUP_DIAGRAM);
    await expect(diagramOptions).toBeVisible();

    const monacoTextarea = diagramOptions.locator('textarea.inputarea').first();
    await expect(monacoTextarea).toBeVisible();
  });

  await test.step('Type diagram code in Monaco editor', async () => {
    const monacoTextarea = page.getByTestId(TEST_IDS.OPTIONS_GROUP_DIAGRAM).locator('textarea.inputarea').first();
    await monacoTextarea.click();
    await page.keyboard.press('Meta+A');
    await page.keyboard.insertText('digraph G { TestNode [label="Test Node"]; }');
  });

  await test.step('Trigger editor blur to save changes', async () => {
    await page.getByText('Layout engine').click();
    await page.waitForTimeout(1000);
  });

  await test.step('Verify diagram is now rendered', async () => {
    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg).toBeVisible({ timeout: 5000 });
    await expect(svg.locator('text').filter({ hasText: 'Test Node' })).toBeVisible({ timeout: 5000 });
  });

  await test.step('Verify empty message is gone', async () => {
    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).not.toBeVisible();
  });
});

test('Query mode - Invalid diagram - displays error message', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to Query Mode - Invalid Diagram panel', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.QUERY_MODE_INVALID });
  });

  await test.step('Verify error message is displayed', async () => {
    await expect(page.getByText(TEXT_PATTERNS.INVALID_DOT_DEFINITION)).toBeVisible();
  });

  await test.step('Verify SVG diagram is not displayed', async () => {
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).not.toBeVisible();
  });
});

test('Query mode - Valid diagram - displays diagram from query results', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to Query Mode - Valid Diagram panel', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.QUERY_MODE_VALID });
  });

  await test.step('Verify diagram is rendered', async () => {
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg')).toBeVisible();
  });

  await test.step('Verify diagram contains expected nodes from query', async () => {
    const svg = page.getByTestId(TEST_IDS.GRAPHVIZ_PANEL_RENDERED_SVG).locator('svg');
    await expect(svg.locator('text').filter({ hasText: 'Dashboard' })).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'Panel' })).toBeVisible();
    await expect(svg.locator('text').filter({ hasText: 'Datasource' })).toBeVisible();
  });
});

test('Query mode - Empty diagram - displays empty message with query hint in edit mode', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  await test.step('Navigate to Query Mode - Empty Diagram panel in edit mode', async () => {
    const dashboard = await readProvisionedDashboard({ fileName: DASHBOARD_FILES.PANEL_STATES });
    await gotoPanelEditPage({ dashboard, id: PANEL_IDS.QUERY_MODE_EMPTY });
  });

  await test.step('Verify empty diagram message is displayed', async () => {
    await expect(page.getByText(TEXT_PATTERNS.EMPTY_DIAGRAM)).toBeVisible();
  });

  await test.step('Verify query hint message is shown', async () => {
    await expect(page.getByText(/no diagram definition found in the query results.*check your query/i)).toBeVisible();
  });

  await test.step('Verify no action button is displayed for Query Mode', async () => {
    await expect(page.getByRole('button', { name: 'Add Node', exact: true })).not.toBeVisible();
  });
});
