import { Page, Locator, expect } from '@playwright/test';

import type { VehicleSchema } from '@/schemas/form';

import { BasePage } from './base.page';

/**
 * Page Object for Vehicles page (/vehicles)
 * Handles all vehicle-related interactions and assertions
 */
export class VehiclesPage extends BasePage {
  // Selectors
  readonly searchInput: Locator;
  readonly createButton: Locator;
  readonly vehiclesTable: Locator;
  readonly editorDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder('Search vehicles');
    this.createButton = page.getByRole('button', { name: /add|create|new/i });
    this.vehiclesTable = page.locator('[role="grid"]');
    this.editorDialog = page.locator('[role="dialog"]');
  }

  /**
   * Navigate to vehicles page
   */
  async goto(): Promise<void> {
    await this.navigate('/vehicles');
    await this.waitForPageLoad();
  }

  /**
   * Search for a vehicle by VIN or make/model
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for search results
    await this.page.waitForTimeout(500);
  }

  /**
   * Get a vehicle row by VIN
   */
  getVehicleRow(vin: string): Locator {
    return this.vehiclesTable.locator(`[role="row"]:has-text("${vin}")`);
  }

  async createVehicle(vehicleData: VehicleSchema): Promise<void> {
    const createButtons = this.page.getByRole('button').filter({ hasText: /add|create|new/i });
    await createButtons.first().click();
    await this.editorDialog.waitFor({ state: 'visible' });

    await this.page.getByLabel(/VIN/i).fill(vehicleData.VIN);
    await this.page.getByLabel(/stock number/i).fill(vehicleData.stock_number);
    await this.page.getByLabel(/license plate/i).fill(vehicleData.license_plate);
    await this.page.getByLabel(/year/i).fill(vehicleData.year.toString());
    await this.page.getByLabel(/make/i).fill(vehicleData.make);
    await this.page.getByLabel(/model/i).fill(vehicleData.model);
    await this.page.getByLabel(/color/i).fill(vehicleData.color);

    await this.page.getByRole('button', { name: /save|submit/i }).click();
    await this.editorDialog.waitFor({ state: 'hidden' });
  }

  async editVehicle(vin: string, updates: Partial<VehicleSchema>): Promise<void> {
    await this.search(vin);
    const row = this.getVehicleRow(vin);
    await row.getByRole('button', { name: /edit/i }).click();
    await this.editorDialog.waitFor({ state: 'visible' });

    if (updates.make) {
      const makeField = this.page.getByLabel(/make/i);
      await makeField.clear();
      await makeField.fill(updates.make);
    }
    if (updates.model) {
      const modelField = this.page.getByLabel(/model/i);
      await modelField.clear();
      await modelField.fill(updates.model);
    }
    if (updates.year) {
      const yearField = this.page.getByLabel(/year/i);
      await yearField.clear();
      await yearField.fill(updates.year.toString());
    }
    if (updates.color) {
      const colorField = this.page.getByLabel(/color/i);
      await colorField.clear();
      await colorField.fill(updates.color);
    }

    await this.page.getByRole('button', { name: /save|submit/i }).click();
    await this.editorDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Assert vehicle exists in list
   */
  async expectVehicleExists(vin: string): Promise<void> {
    await this.search(vin);
    const row = this.getVehicleRow(vin);
    await expect(row).toBeVisible();
  }

  /**
   * Assert vehicle does not exist
   */
  async expectVehicleNotExists(vin: string): Promise<void> {
    await this.search(vin);
    const row = this.getVehicleRow(vin);
    await expect(row).toHaveCount(0);
  }

  /**
   * Get total number of visible vehicle rows
   */
  async getVehicleCount(): Promise<number> {
    return this.vehiclesTable.locator('[role="row"]').count();
  }
}
