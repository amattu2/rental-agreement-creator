import { Page, Locator, expect } from "@playwright/test";

import type { RenteeSchema, VehicleSchema } from "@/schemas/form";

import { BasePage } from "./base.page";

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
    this.statusFilter = page.getByLabel("Status", { exact: true });
    this.createButton = page.getByRole("button", { name: /create agreement/i });
    this.agreementsTable = page.locator('[role="grid"]');
    this.agreementDialog = page.locator('[role="dialog"]');
    this.customerSelect = page.getByLabel(/customer|rentee/i);
    this.vehicleSelect = page.getByLabel(/vehicle/i);
  }

  /**
   * Navigate to agreements list page
   */
  async goto(): Promise<void> {
    await this.navigate("/");
    await this.waitForPageLoad();
  }

  /**
   * Navigate to create new agreement form
   */
  async gotoCreateAgreement(): Promise<void> {
    await this.navigate("/agreement");
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
    await this.page.waitForTimeout(1000);
  }

  async filterByStatus(status: "all" | "active" | "archived" | "canceled"): Promise<void> {
    await this.statusFilter.click();
    // MUI Select renders options in a listbox outside the main DOM
    await this.page.getByRole("option", { name: new RegExp(`^${status}$`, "i") }).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click create agreement button (navigates to /agreement)
   */
  async clickCreateAgreement(): Promise<void> {
    await this.createButton.click();
    // Wait for navigation to create form
    await this.page.waitForURL("**/agreement");
  }

  /**
   * Get an agreement row by customer name or agreement ID
   */
  getAgreementRow(identifier: string): Locator {
    return this.agreementsTable.locator(`[role="row"]:has-text("${identifier}")`);
  }

  /**
   * Open the row actions menu for the specified agreement row.
   */
  private async openAgreementActions(identifier: string): Promise<void> {
    const row = this.getAgreementRow(identifier);
    await row.getByRole("menuitem", { name: /^more$/i }).click();
  }

  /**
   * Create a new agreement by filling the form fields directly.
   *
   * Avoids the selection dialogs (whose GridActionsCellItem onClick is unreliable under force:true)
   * and instead fills rentee/vehicle fields in-place. The form's onSubmit handler then upserts
   * those records into the database automatically.
   */
  async createAgreement(data: { customer: RenteeSchema; vehicle: VehicleSchema }): Promise<string> {
    await this.gotoCreateAgreement();
    await this.page
      .getByRole("button", { name: "Generate Agreement" })
      .waitFor({ state: "visible" });

    const agreementNumber = `AGR-${Date.now()}`;
    await this.page.getByLabel("Agreement number").fill(agreementNumber);

    // Use name-attribute selectors throughout — getByLabel is unreliable on this form because
    // MUI DatePicker section spans (Month/Day/Year) share aria-labels with text input labels
    await this.page.locator('input[name="rentee.full_name"]').fill(data.customer.full_name);
    await this.page
      .locator('input[name="rentee.address_street1"]')
      .fill(data.customer.address_street1);
    await this.page.locator('input[name="rentee.address_city"]').fill(data.customer.address_city);
    await this.page.locator('input[name="rentee.address_state"]').fill(data.customer.address_state);
    await this.page.locator('input[name="rentee.address_zip"]').fill(data.customer.address_zip);
    await this.page.locator('input[name="rentee.cell_phone"]').fill(data.customer.cell_phone);
    await this.page
      .locator('input[name="rentee.driver_license_number"]')
      .fill(data.customer.driver_license_number);
    await this.page
      .locator('input[name="rentee.driver_license_state"]')
      .fill(data.customer.driver_license_state);

    const licenseExpiry = data.customer.driver_license_expiration;
    // Click the first editable section span directly — clicking the group fires React onClick async,
    // which can leave focus on the previous field when keyboard.press() is called
    await this.page
      .getByRole("group", { name: "Driver's license expiration" })
      .locator('[data-sectionindex="0"]')
      .click();
    for (const char of `${String(licenseExpiry.getMonth() + 1).padStart(2, "0")}${String(licenseExpiry.getDate()).padStart(2, "0")}${licenseExpiry.getFullYear()}`) {
      await this.page.keyboard.press(char);
    }

    const dob = data.customer.date_of_birth;
    await this.page
      .getByRole("group", { name: "Date of birth" })
      .locator('[data-sectionindex="0"]')
      .click();
    for (const char of `${String(dob.getMonth() + 1).padStart(2, "0")}${String(dob.getDate()).padStart(2, "0")}${dob.getFullYear()}`) {
      await this.page.keyboard.press(char);
    }

    await this.page
      .locator('input[name="rental_vehicle.stock_number"]')
      .fill(data.vehicle.stock_number);
    await this.page.locator('input[name="rental_vehicle.VIN"]').fill(data.vehicle.VIN);
    await this.page
      .locator('input[name="rental_vehicle.license_plate"]')
      .fill(data.vehicle.license_plate);
    await this.page.locator('input[name="rental_vehicle.year"]').fill(data.vehicle.year.toString());
    await this.page.locator('input[name="rental_vehicle.make"]').fill(data.vehicle.make);
    await this.page.locator('input[name="rental_vehicle.model"]').fill(data.vehicle.model);
    await this.page.locator('input[name="rental_vehicle.color"]').fill(data.vehicle.color);

    // Rental agreement info — use name-attribute selectors, exact labels share substrings with DatePicker sections
    const pickupDate = new Date();
    pickupDate.setHours(9, 0, 0, 0);
    await this.typeDateTime("Pickup date", pickupDate);

    await this.page.locator('input[name="rental_agreement_info.odometer_out"]').fill("1000");
    await this.page.locator('input[name="rental_agreement_info.odometer_in"]').fill("1000");

    const returnDate = new Date(pickupDate);
    returnDate.setDate(returnDate.getDate() + 7);
    returnDate.setHours(10, 0, 0, 0);
    await this.typeDateTime("Return date", returnDate);

    // Confirm billing (required before Generate Agreement becomes clickable)
    await this.page.getByRole("button", { name: "Edit Charges" }).click();
    const chargesDialog = this.page.locator('[role="dialog"]').filter({ hasText: "Edit Charges" });
    await chargesDialog.waitFor({ state: "visible" });
    await chargesDialog
      .locator("button")
      .filter({ hasText: /save.*close/i })
      .click({ force: true });
    await chargesDialog.waitFor({ state: "hidden" });

    await this.page.getByRole("button", { name: "Generate Agreement" }).click();
    await this.page.waitForURL("**/agreement?uuid=*");

    // Return to list page so callers can assert against the agreements table
    await this.goto();

    return agreementNumber;
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
    await this.page.getByRole("button", { name: /save|submit/i }).click();

    // Wait for navigation
    await this.page.waitForURL("**/");
  }

  /**
   * Finalize an agreement (mark as archived)
   * Opens the finalization dialog and fills it
   */
  async finalizeAgreement(
    identifier: string,
    finalizationData: {
      vehicleReturnedAt: string;
      actualOdometerIn: number;
      actualFuelLevel: string;
    }
  ): Promise<void> {
    await this.openAgreementActions(identifier);
    await this.page.getByRole("menuitem", { name: /^finalize$/i }).click();

    const dialog = this.page.getByRole("dialog", { name: /finalize agreement/i });
    await dialog.waitFor({ state: "visible" });

    await dialog.getByLabel(/^odometer in$/i).fill(finalizationData.actualOdometerIn.toString());
    await dialog.getByLabel(/^fuel level in$/i).click();
    await this.page.getByRole("option", { name: finalizationData.actualFuelLevel }).click();

    await dialog.getByRole("button", { name: /^confirm$/i }).click();
    await dialog.waitFor({ state: "hidden" });
  }

  /**
   * Cancel an agreement
   */
  async cancelAgreement(identifier: string): Promise<void> {
    await this.openAgreementActions(identifier);
    await this.page.getByRole("menuitem", { name: /^cancel$/i }).click();

    const dialog = this.page.getByRole("dialog", { name: /cancel agreement/i });
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("button", { name: /^confirm$/i }).click();
    await dialog.waitFor({ state: "hidden" });
  }

  /**
   * Download agreement PDF
   */
  async downloadAgreementPDF(identifier: string): Promise<void> {
    const row = this.getAgreementRow(identifier);

    // Start download
    const downloadPromise = this.page.context().waitForEvent("download");
    await row.getByRole("button", { name: /pdf|download|view/i }).click();

    const download = await downloadPromise;
    await download.path();
  }

  /**
   * Assert agreement exists with given status
   */
  async expectAgreementExists(identifier: string, status?: string): Promise<void> {
    await this.search(identifier);
    const row = this.getAgreementRow(identifier);
    await expect(row).toBeVisible();

    if (status) {
      await expect(row.getByText(new RegExp(`^${status}$`, "i"))).toBeVisible();
    }
  }

  /**
   * Assert agreement does not exist
   */
  async expectAgreementNotExists(identifier: string): Promise<void> {
    await this.search(identifier);
    const row = this.getAgreementRow(identifier);
    await expect(row).toHaveCount(0);
  }

  /**
   * Get total number of agreement rows
   */
  async getAgreementCount(): Promise<number> {
    return this.agreementsTable.locator('[role="row"]').count();
  }
}
