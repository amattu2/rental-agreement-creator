import { Page, Locator, expect } from "@playwright/test";

import type { RenteeSchema } from "@/schemas/form";

import { BasePage } from "./base.page";

/**
 * Page Object for Customers page (/customers)
 * Handles all customer-related interactions and assertions
 */
export class CustomersPage extends BasePage {
  readonly searchInput: Locator;
  readonly createButton: Locator;
  readonly customersTable: Locator;
  readonly editorDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByLabel("Search customers");
    this.createButton = page.getByRole("button", { name: "Create" });
    this.customersTable = page.locator('[role="grid"]');
    this.editorDialog = page.locator('[role="dialog"]');
  }

  /**
   * Navigate to customers page
   */
  async goto(): Promise<void> {
    await this.navigate("/customers");
    await this.waitForPageLoad();
  }

  /**
   * Search for a customer by name
   */
  async searchByName(name: string): Promise<void> {
    await this.searchInput.fill(name);
  }

  /**
   * Get a customer row by name
   */
  getCustomerRow(customerName: string): Locator {
    return this.customersTable.locator(`[role="row"]:has-text("${customerName}")`);
  }

  /**
   * Create a customer via the create dialog.
   */
  async createCustomer(customerData: RenteeSchema): Promise<void> {
    await this.createButton.click();
    await this.editorDialog.waitFor({ state: "visible" });

    await this.editorDialog.getByLabel("Full name").fill(customerData.full_name);
    // Use .first() — "Street address", "City", "State", "Zip code" also appear in the employer section
    await this.editorDialog.getByLabel("Street address").first().fill(customerData.address_street1);
    await this.editorDialog.getByLabel("City").first().fill(customerData.address_city);
    await this.editorDialog.getByLabel("State").first().fill(customerData.address_state);
    await this.editorDialog.getByLabel("Zip code").first().fill(customerData.address_zip);
    await this.editorDialog.getByLabel("Email address").fill(customerData.email ?? "");
    await this.editorDialog.getByLabel("Cell phone").fill(customerData.cell_phone);
    await this.editorDialog
      .getByLabel("Driver's license number")
      .fill(customerData.driver_license_number);
    await this.editorDialog
      .getByLabel("Driver's license state")
      .fill(customerData.driver_license_state);

    // MUI v7 DatePicker uses section-based inputs — click the group then type digits
    const licenseExpiry = customerData.driver_license_expiration;
    await this.editorDialog.getByRole("group", { name: "Driver's license expiration" }).click();
    await this.page.keyboard.type(
      `${String(licenseExpiry.getMonth() + 1).padStart(2, "0")}${String(licenseExpiry.getDate()).padStart(2, "0")}${licenseExpiry.getFullYear()}`
    );

    const dob = customerData.date_of_birth;
    await this.editorDialog.getByRole("group", { name: "Date of birth" }).click();
    await this.page.keyboard.type(
      `${String(dob.getMonth() + 1).padStart(2, "0")}${String(dob.getDate()).padStart(2, "0")}${dob.getFullYear()}`
    );

    await this.editorDialog.getByRole("button", { name: "Save" }).click();
    await this.editorDialog.waitFor({ state: "hidden" });
  }

  /**
   * Edit a customer matched by name using the row edit action.
   */
  async editCustomer(customerName: string, updates: Partial<RenteeSchema>): Promise<void> {
    await this.searchByName(customerName);
    await this.page.locator('[aria-label="Edit"]').click();
    await this.editorDialog.waitFor({ state: "visible" });

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

    await this.page.getByRole("button", { name: "Save" }).click();
    await this.editorDialog.waitFor({ state: "hidden" });
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
