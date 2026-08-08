import { Page, Locator, expect } from '@playwright/test';

import type { RenteeSchema } from '@/schemas/form';

import { BasePage } from './base.page';

/**
 * Page Object for Customers page (/customers)
 * Handles all customer-related interactions and assertions
 */
export class CustomersPage extends BasePage {
  // Selectors
  readonly searchInput: Locator;
  readonly createButton: Locator;
  readonly customersTable: Locator;
  readonly editorDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder('Search customers');
    this.createButton = page.getByRole('button', { name: /add|create|new/i });
    this.customersTable = page.locator('[role="grid"]');
    this.editorDialog = page.locator('[role="dialog"]');
  }

  /**
   * Navigate to customers page
   */
  async goto(): Promise<void> {
    await this.navigate('/customers');
    await this.waitForPageLoad();
  }

  /**
   * Search for a customer by name
   */
  async searchByName(name: string): Promise<void> {
    await this.searchInput.fill(name);
    // Wait for search results
    await this.page.waitForTimeout(500);
  }

  /**
   * Get a customer row by name
   */
  getCustomerRow(customerName: string): Locator {
    return this.customersTable.locator(`[role="row"]:has-text("${customerName}")`);
  }

  async createCustomer(customerData: RenteeSchema): Promise<void> {
    const createButtons = this.page.getByRole('button').filter({ hasText: /add|create|new/i });
    await createButtons.first().click();
    await this.editorDialog.waitFor({ state: 'visible' });

    await this.page.getByLabel(/full name/i).fill(customerData.full_name);
    await this.page.getByLabel(/street address/i).fill(customerData.address_street1);
    await this.page.getByLabel(/city/i).fill(customerData.address_city);
    await this.page.getByLabel(/state/i).first().fill(customerData.address_state);
    await this.page.getByLabel(/zip/i).fill(customerData.address_zip);
    await this.page.getByLabel(/cell phone|phone/i).first().fill(customerData.cell_phone);
    await this.page.getByLabel(/driver.?s license number/i).fill(customerData.driver_license_number);
    await this.page.getByLabel(/driver.?s license state/i).fill(customerData.driver_license_state);

    const licenseExpiry = customerData.driver_license_expiration;
    await this.page.getByLabel(/license.*expir/i).fill(
      `${String(licenseExpiry.getMonth() + 1).padStart(2, '0')}/${String(licenseExpiry.getDate()).padStart(2, '0')}/${licenseExpiry.getFullYear()}`
    );

    const dob = customerData.date_of_birth;
    await this.page.getByLabel(/date of birth/i).fill(
      `${String(dob.getMonth() + 1).padStart(2, '0')}/${String(dob.getDate()).padStart(2, '0')}/${dob.getFullYear()}`
    );

    if (customerData.email) {
      await this.page.getByLabel(/email/i).fill(customerData.email);
    }

    await this.page.getByRole('button', { name: /save|submit/i }).click();
    await this.editorDialog.waitFor({ state: 'hidden' });
  }

  async editCustomer(customerName: string, updates: Partial<RenteeSchema>): Promise<void> {
    await this.searchByName(customerName);
    const row = this.getCustomerRow(customerName);
    await row.getByRole('button', { name: /edit/i }).click();
    await this.editorDialog.waitFor({ state: 'visible' });

    if (updates.full_name) {
      const nameField = this.page.getByLabel(/full name/i);
      await nameField.clear();
      await nameField.fill(updates.full_name);
    }
    if (updates.cell_phone) {
      const phoneField = this.page.getByLabel(/cell phone|phone/i).first();
      await phoneField.clear();
      await phoneField.fill(updates.cell_phone);
    }
    if (updates.email) {
      const emailField = this.page.getByLabel(/email/i);
      await emailField.clear();
      await emailField.fill(updates.email);
    }

    await this.page.getByRole('button', { name: /save|submit/i }).click();
    await this.editorDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Assert customer exists in list
   */
  async expectCustomerExists(customerName: string): Promise<void> {
    await this.searchByName(customerName);
    const row = this.getCustomerRow(customerName);
    await expect(row).toBeVisible();
  }

  /**
   * Assert customer does not exist
   */
  async expectCustomerNotExists(customerName: string): Promise<void> {
    await this.searchByName(customerName);
    const row = this.getCustomerRow(customerName);
    await expect(row).toHaveCount(0);
  }

  /**
   * Get total number of visible customer rows
   */
  async getCustomerCount(): Promise<number> {
    return this.customersTable.locator('[role="row"]').count();
  }
}
