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
    this.searchInput = page.getByLabel('Search vehicles');
    this.createButton = page.getByRole('button', { name: 'Create' });
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
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get a vehicle row by VIN
   */
  getVehicleRow(vin: string): Locator {
    return this.vehiclesTable.locator(`[role="row"]:has-text("${vin}")`);
  }

  async createVehicle(vehicleData: VehicleSchema): Promise<void> {
    await this.createButton.click();
    await this.editorDialog.waitFor({ state: 'visible' });

    await this.editorDialog.getByLabel('VIN').fill(vehicleData.VIN);
    await this.editorDialog.getByLabel('Stock number').fill(vehicleData.stock_number);
    await this.editorDialog.getByLabel('License plate').fill(vehicleData.license_plate);
    await this.editorDialog.getByLabel('Year').fill(vehicleData.year.toString());
    await this.editorDialog.getByLabel('Make').fill(vehicleData.make);
    await this.editorDialog.getByLabel('Model').fill(vehicleData.model);
    await this.editorDialog.getByLabel('Color').fill(vehicleData.color);

    await this.editorDialog.getByRole('button', { name: 'Save' }).click();
    await this.editorDialog.waitFor({ state: 'hidden' });
  }

  async editVehicle(vin: string, updates: Partial<VehicleSchema>): Promise<void> {
    await this.search(vin);
    // MUI DataGrid action buttons need force:true to bypass actionability checks
    await this.page.locator('[aria-label="Edit"]').click({ force: true });
    await this.editorDialog.waitFor({ state: 'visible' });

    if (updates.make) {
      const makeField = this.editorDialog.getByLabel('Make');
      await makeField.clear();
      await makeField.fill(updates.make);
    }
    if (updates.model) {
      const modelField = this.editorDialog.getByLabel('Model');
      await modelField.clear();
      await modelField.fill(updates.model);
    }
    if (updates.year) {
      const yearField = this.editorDialog.getByLabel('Year');
      await yearField.clear();
      await yearField.fill(updates.year.toString());
    }
    if (updates.color) {
      const colorField = this.editorDialog.getByLabel('Color');
      await colorField.clear();
      await colorField.fill(updates.color);
    }

    await this.editorDialog.getByRole('button', { name: 'Save' }).click();
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
