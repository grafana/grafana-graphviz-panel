import { Page, expect } from '@playwright/test';

const PORTAL_CONTAINER_TESTID = 'data-testid portal-container';

export async function dismissModal(page: Page, buttonName: string) {
  const modal = page.getByTestId(PORTAL_CONTAINER_TESTID);
  await modal.getByRole('button', { name: buttonName }).click();
}

export async function submitModal(page: Page, buttonName: string) {
  const modal = page.getByTestId(PORTAL_CONTAINER_TESTID);
  await modal.getByRole('button', { name: buttonName }).click();
}

export async function verifyModalError(page: Page, errorText: string) {
  await expect(page.getByText(errorText)).toBeVisible();
}

export async function verifyModalHeading(page: Page, headingText: string) {
  await expect(page.getByRole('heading', { name: headingText })).toBeVisible();
}

export async function verifyModalDismissed(page: Page, headingText: string) {
  await expect(page.getByRole('heading', { name: headingText })).not.toBeVisible();
}
