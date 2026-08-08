import { Page, Locator, expect } from '@playwright/test';

import { BasePage } from './base.page';

/**
 * Page Object for Agreements list page (/) and create/edit agreement form
 * Handles agreement CRUD operations, searches, and status filters
 */
export class AgreementsPage extends BasePage {
  // Home/List page selectors
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly createButton: Locator;
  readonly agreementsTable: Locator;

  // Create/Edit agreement form selectors
  readonly agreementDialog: Locator;
  readonly customerSelect: Locator;
  readonly vehicleSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByLabel(/search agreements/i);
    this.statusFilter = page.getByLabel(/status/i);
    this.createButton = page.getByRole('button', { name: /create agreement/i });
    this.agreementsTable = page.locator('[role="grid"]');
    this.agreementDialog = page.locator('[role="dialog"]');
    this.customerSelect = page.getByLabel(/customer|rentee/i);
    this.vehicleSelect = page.getByLabel(/vehicle/i);
  }

  /**
   * Navigate to agreements list page
   */
  async goto(): Promise<void> {
    await this.navigate('/');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to create new agreement form
   */
  async gotoCreateAgreement(): Promise<void> {
    await this.navigate('/agreement');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to edit agreement form
   */
  async gotoEditAgreement(uuid: string): Promise<void> {
    await this.navigate(`/agreement?uuid=${uuid}`);
    await this.waitForPageLoad();
  }

  /**
   * Search agreements by query
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for search results
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter agreements by status
   */
  async filterByStatus(status: 'all' | 'active' | 'archived' | 'canceled'): Promise<void> {
    await this.statusFilter.click();
    await this.page.getByRole('option', { name: status }).click();
    // Wait for filter to apply
    await this.page.waitForTimeout(500);
  }

  /**
   * Click create agreement button (navigates to /agreement)
   */
  async clickCreateAgreement(): Promise<void> {
    await this.createButton.click();
    // Wait for navigation to create form
    await this.page.waitForURL('**/agreement');
  }

  /**
   * Get an agreement row by customer name or agreement ID
   */
  getAgreementRow(identifier: string): Locator {
    return this.agreementsTable.locator(`[role="row"]:has-text("${identifier}")`);
  }

  /**
   * Create a new agreement via the form
   */
  async createAgreement(agreementData: {
    customerName: string;
    vehicleVin: string;
    startDate: string;
    endDate: string;
    dailyRate: string;
  }): Promise<void> {
    // Navigate to create form
    await this.gotoCreateAgreement();

    // Select customer
    await this.customerSelect.click();
    await this.page.getByRole('option').filter({ hasText: agreementData.customerName }).click();

    // Select vehicle
    await this.vehicleSelect.click();
    await this.page.getByRole('option').filter({ hasText: agreementData.vehicleVin }).click();

    // Fill dates and rate
    await this.page.getByLabel(/start date/i).fill(agreementData.startDate);
    await this.page.getByLabel(/end date/i).fill(agreementData.endDate);
    await this.page.getByLabel(/daily rate|rate/i).fill(agreementData.dailyRate);

    // Save agreement
    await this.page.getByRole('button', { name: /save|submit/i }).click();

    // Wait for navigation back to list
    await this.page.waitForURL('**/');
  }

  /**
   * Edit an existing agreement
   */
  async editAgreement(
    uuid: string,
    updates: { dailyRate?: string; mileageIn?: string }
  ): Promise<void> {
    await this.gotoEditAgreement(uuid);

    // Update fields
    if (updates.dailyRate) {
      const rateField = this.page.getByLabel(/daily rate|rate/i);
      await rateField.clear();
      await rateField.fill(updates.dailyRate);
    }

    if (updates.mileageIn) {
      const mileageField = this.page.getByLabel(/mileage|odometer/i);
      await mileageField.clear();
      await mileageField.fill(updates.mileageIn);
    }

    // Save
    await this.page.getByRole('button', { name: /save|submit/i }).click();

    // Wait for navigation
    await this.page.waitForURL('**/');
  }

  /**
   * Finalize an agreement (mark as archived)
   * Opens the finalization dialog and fills it
   */
  async finalizeAgreement(
    customerName: string,
    finalizationData: {
      vehicleReturnedAt: string;
      actualOdometerIn: number;
      actualFuelLevel: string;
    }
  ): Promise<void> {
    // Find the agreement row
    const row = this.getAgreementRow(customerName);

    // Click finalize/archive button
    await row.getByRole('button', { name: /finalize|archive/i }).click();

    // Wait for finalization dialog
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible' });

    // Fill finalization form
    await this.page.getByLabel(/vehicle returned|return date/i).fill(finalizationData.vehicleReturnedAt);
    await this.page.getByLabel(/odometer|mileage.*in/i).fill(finalizationData.actualOdometerIn.toString());
    await this.page.getByLabel(/fuel level|fuel/i).selectOption(finalizationData.actualFuelLevel);

    // Confirm finalization
    await this.page.getByRole('button', { name: /confirm|finalize|save/i }).click();

    // Wait for dialog to close
    await dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Cancel an agreement
   */
  async cancelAgreement(customerName: string): Promise<void> {
    const row = this.getAgreementRow(customerName);

    // Click cancel button
    await row.getByRole('button', { name: /cancel/i }).click();

    // Handle confirmation dialog if present
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes|cancel/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  /**
   * Download agreement PDF
   */
  async downloadAgreementPDF(customerName: string): Promise<void> {
    const row = this.getAgreementRow(customerName);

    // Start download
    const downloadPromise = this.page.context().waitForEvent('download');
    await row.getByRole('button', { name: /pdf|download|view/i }).click();

    const download = await downloadPromise;
    await download.path();
  }

  /**
   * Assert agreement exists with given status
   */
  async expectAgreementExists(customerName: string, status?: string): Promise<void> {
    await this.search(customerName);
    const row = this.getAgreementRow(customerName);
    await expect(row).toBeVisible();

    if (status) {
      await expect(row.locator(`text="${status}"`)).toBeVisible();
    }
  }

  /**
   * Assert agreement does not exist
   */
  async expectAgreementNotExists(customerName: string): Promise<void> {
    await this.search(customerName);
    const row = this.getAgreementRow(customerName);
    await expect(row).toHaveCount(0);
  }

  /**
   * Get total number of agreement rows
   */
  async getAgreementCount(): Promise<number> {
    return this.agreementsTable.locator('[role="row"]').count();
  }
}
