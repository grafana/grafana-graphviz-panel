import { Page, expect } from '@playwright/test';
import { dismissModal, submitModal, verifyModalError, verifyModalHeading, verifyModalDismissed } from './modal';

const TIMING = {
  DRAG_REGISTER: 200,
  TOOL_ACTIVATE: 500,
} as const;

export async function createNode(
  page: Page,
  options: {
    id: string;
    label?: string;
    shape?: string;
    triggerButton: 'empty-state' | 'tool-palette';
    testValidation?: boolean;
  }
) {
  const buttonTestId = options.triggerButton === 'empty-state' ? 'empty-state-add-node' : 'diagram-new-node';
  const button = page.getByTestId(buttonTestId);
  await button.click();

  await verifyModalHeading(page, 'Add Node');

  if (options.testValidation) {
    await submitModal(page, 'Add Node');
    await verifyModalError(page, 'Node ID is required');
    await dismissModal(page, 'Cancel');
    await button.click();
    await verifyModalHeading(page, 'Add Node');
  }

  const idInput = page.getByTestId('node-form-id-input');
  await idInput.fill(options.id);

  if (options.label) {
    const labelInput = page.getByTestId('node-form-label-input');
    await labelInput.fill(options.label);
  }

  if (options.shape) {
    const shapeSelect = page.getByTestId('node-form-shape-select');
    await shapeSelect.click();
    await page.waitForTimeout(TIMING.TOOL_ACTIVATE);
    const option = page.getByRole('option', { name: options.shape, exact: true });
    await expect(option).toBeVisible();
    await option.click();
  }

  await submitModal(page, 'Add Node');
  await verifyModalDismissed(page, 'Add Node');
}

export async function testDuplicateNodeValidation(
  page: Page,
  existingNodeId: string,
  newNodeId: string,
  shape?: string
) {
  const button = page.getByTestId('diagram-new-node');
  await button.click();
  await verifyModalHeading(page, 'Add Node');

  const idInput = page.getByTestId('node-form-id-input');

  await submitModal(page, 'Add Node');
  await verifyModalError(page, 'Node ID is required');

  await idInput.fill(existingNodeId);
  await submitModal(page, 'Add Node');
  await verifyModalError(page, 'Node ID already exists');

  await dismissModal(page, 'Cancel');

  await button.click();
  await verifyModalHeading(page, 'Add Node');
  await idInput.fill(newNodeId);

  if (shape) {
    const shapeSelect = page.getByTestId('node-form-shape-select');
    await shapeSelect.click();
    await page.waitForTimeout(TIMING.TOOL_ACTIVATE);
    const option = page.getByRole('option', { name: shape, exact: true });
    await expect(option).toBeVisible();
    await option.click();
  }

  await submitModal(page, 'Add Node');
  await verifyModalDismissed(page, 'Add Node');
}

export async function createEdgeByDragging(
  page: Page,
  options: {
    fromNodeText: string;
    fromNodeId?: string;
    toNodeText: string;
    testDismissal?: boolean;
    testCancellations?: boolean;
  }
) {
  const newEdgeButton = page.getByTestId('diagram-new-edge');
  await newEdgeButton.click();
  await page.waitForTimeout(TIMING.TOOL_ACTIVATE);

  const svg = page.getByTestId('graphviz-panel-rendered-svg').locator('svg');

  const fromNodeText = svg.locator('text').filter({ hasText: options.fromNodeText });
  await expect(fromNodeText).toBeVisible();
  const fromBox = await fromNodeText.boundingBox();
  if (!fromBox) {
    throw new Error(`Could not find ${options.fromNodeText} position`);
  }

  const toNodeText = svg.locator('text').filter({ hasText: options.toNodeText });
  const toBox = await toNodeText.boundingBox();
  if (!toBox) {
    throw new Error(`Could not find ${options.toNodeText} position`);
  }

  const nodeIdForModal = options.fromNodeId || options.fromNodeText;
  const modalHeading = `Add Edge from ${nodeIdForModal}`;

  if (options.testCancellations) {
    // Test cancellation: Release mouse outside any node
    await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(TIMING.DRAG_REGISTER);
    await page.mouse.move(fromBox.x - 100, fromBox.y - 100);
    await page.mouse.up();

    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: modalHeading })).not.toBeVisible();
  }

  // Successful drag to create edge
  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(TIMING.DRAG_REGISTER);
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2);
  await page.mouse.up();

  await verifyModalHeading(page, modalHeading);

  if (options.testDismissal) {
    await dismissModal(page, 'Cancel');
    await verifyModalDismissed(page, modalHeading);

    await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(TIMING.DRAG_REGISTER);
    await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2);
    await page.mouse.up();

    await verifyModalHeading(page, modalHeading);
  }

  await submitModal(page, 'Add Edge');
  await verifyModalDismissed(page, `Add Edge from ${nodeIdForModal}`);
}

export async function editNode(
  page: Page,
  options: {
    nodeId: string;
    newLabel?: string;
    newShape?: string;
    testDismissal?: boolean;
  }
) {
  const editToolButton = page.getByTestId('diagram-edit-elements');
  await editToolButton.click();

  const editButton = page.getByTestId(`edit-node-${options.nodeId}`);
  await expect(editButton).toBeVisible();
  await editButton.click();

  await verifyModalHeading(page, 'Edit Node');

  if (options.testDismissal) {
    await dismissModal(page, 'Cancel');
    await verifyModalDismissed(page, 'Edit Node');
    await editButton.click();
    await verifyModalHeading(page, 'Edit Node');
  }

  if (options.newLabel !== undefined) {
    const labelInput = page.getByTestId('node-edit-label-input');
    await labelInput.fill(options.newLabel);
  }

  if (options.newShape) {
    const shapeSelect = page.getByTestId('node-edit-shape-select');
    await shapeSelect.click();
    await page.getByText(options.newShape, { exact: true }).click();
  }

  await submitModal(page, 'Update Node');
  await verifyModalDismissed(page, 'Edit Node');

  await page.waitForFunction(() => {
    const svg = document.querySelector('[data-testid="graphviz-panel-rendered-svg"] svg');
    return svg && svg.querySelectorAll('text').length > 0;
  });
}

export async function editEdge(
  page: Page,
  options: {
    edgeId: string;
    newLabel: string;
  }
) {
  const editButton = page.getByTestId(options.edgeId);
  await expect(editButton).toBeVisible({ timeout: 5000 });
  await editButton.click();

  await verifyModalHeading(page, 'Edit Edge');

  const labelInput = page.getByTestId('edge-edit-label-input');
  await labelInput.fill(options.newLabel);

  await submitModal(page, 'Update Edge');
  await verifyModalDismissed(page, 'Edit Edge');

  await page.waitForFunction(() => {
    const svg = document.querySelector('[data-testid="graphviz-panel-rendered-svg"] svg');
    return svg && svg.querySelectorAll('g.edge').length > 0;
  });
}

export function getSvg(page: Page) {
  return page.getByTestId('graphviz-panel-rendered-svg').locator('svg');
}
