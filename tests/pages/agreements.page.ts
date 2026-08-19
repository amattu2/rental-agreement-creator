import { createCanvas } from "@napi-rs/canvas";
import { Page, Locator, expect, type TestInfo } from "@playwright/test";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import type { RenteeSchema, VehicleSchema } from "@/schemas/form";

import { BasePage } from "./base.page";

declare global {
  interface Window {
    __openCalls?: Array<Array<unknown>>;
    __originalOpen?: Window["open"];
  }
}

const isCanvasRenderingContext2D = (value: unknown): value is CanvasRenderingContext2D => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "canvas" in value && "fillRect" in value && "getImageData" in value;
};

/**
 * Page Object for Agreements list page (/) and create/edit agreement form
 * Handles agreement CRUD operations, searches, and status filters
 */
export class AgreementsPage extends BasePage {
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly createButton: Locator;
  readonly agreementsTable: Locator;

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
  }

  /**
   * Filter agreements by status from the Status select control.
   */
  async filterByStatus(status: "all" | AgreementStatus): Promise<void> {
    await this.statusFilter.click();
    // MUI Select renders options in a listbox outside the main DOM
    await this.page.getByRole("option", { name: new RegExp(`^${status}$`, "i") }).click();
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
   * Spy on window.open calls so PDF popup URLs can be inspected in tests.
   */
  async installWindowOpenSpy(): Promise<void> {
    await this.page.evaluate(() => {
      window.__openCalls = [];

      if (!window.__originalOpen) {
        window.__originalOpen = window.open;
      }

      window.open = (...args: Array<unknown>) => {
        window.__openCalls?.push(args);
        return null;
      };
    });
  }

  /**
   * Wait for the first captured window.open URL and return it.
   */
  private async getFirstWindowOpenUrl(): Promise<string> {
    await expect
      .poll(async () =>
        this.page.evaluate(() => {
          return window.__openCalls?.length ?? 0;
        })
      )
      .toBeGreaterThan(0);

    return this.page.evaluate(() => {
      return String(window.__openCalls?.[0]?.[0] ?? "");
    });
  }

  /**
   * Assert that a captured window.open call points to a generated PDF blob URL.
   */
  async expectWindowOpenCalledWithBlobUrl(): Promise<void> {
    const firstUrl = await this.getFirstWindowOpenUrl();

    expect(firstUrl).toContain("blob:");
  }

  /**
   * Open an agreement row PDF action, attach the PDF and rendered page screenshots, and return PDF form fields.
   */
  async capturePdfScreenshot(
    actionName: "View Agreement" | "View Receipt",
    artifactBaseName: string,
    testInfo: TestInfo
  ): Promise<Record<string, Array<object>> | null> {
    await this.installWindowOpenSpy();
    await this.page.getByRole("menuitem", { name: actionName }).click();

    const pdfUrl = await this.getFirstWindowOpenUrl();
    expect(pdfUrl).toContain("blob:");

    const pdfBase64 = await this.page.evaluate(async (url: string) => {
      const data = await fetch(url).then((response) => response.arrayBuffer());
      const bytes = new Uint8Array(data);
      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }

      return btoa(binary);
    }, pdfUrl);
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    await testInfo.attach(`${artifactBaseName}.pdf`, {
      body: pdfBuffer,
      contentType: "application/pdf",
    });

    const pdfBytes = new Uint8Array(pdfBuffer);
    const pdf = await pdfjsLib.getDocument({
      data: pdfBytes,
      useSystemFonts: true,
    }).promise;
    const fieldObjects = await pdf.getFieldObjects();

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const pdfPage = await pdf.getPage(pageNumber);
      const viewport = pdfPage.getViewport({ scale: 1.5 });

      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext("2d");
      if (!isCanvasRenderingContext2D(context)) {
        throw new Error("Failed to initialize a 2D canvas context for PDF screenshot rendering");
      }

      await pdfPage.render({ canvas: null, canvasContext: context, viewport }).promise;
      const screenshot = canvas.toBuffer("image/png");

      await testInfo.attach(`${artifactBaseName}_${pageNumber}.png`, {
        body: screenshot,
        contentType: "image/png",
      });
    }

    return fieldObjects;
  }

  /**
   * Create a new agreement by filling the form fields directly.
   *
   * Avoids the selection dialogs and instead fills rentee/vehicle fields in-place.
   * The form's onSubmit handler then upserts those records into the database automatically.
   */
  async createAgreement(data: { customer: RenteeSchema; vehicle: VehicleSchema }): Promise<string> {
    return this.createAgreementWithOptions(data, { chargesAction: "save-close" });
  }

  /**
   * Create a new agreement and choose how charges are confirmed.
   */
  async createAgreementWithOptions(
    data: { customer: RenteeSchema; vehicle: VehicleSchema },
    options: { chargesAction: "save-close" | "save-generate" }
  ): Promise<string> {
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
    await this.typeDate("Driver's license expiration", licenseExpiry);

    const dob = data.customer.date_of_birth;
    await this.typeDate("Date of birth", dob);

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
    pickupDate.setDate(pickupDate.getDate() - 2);
    pickupDate.setHours(9, 0, 0, 0);
    await this.typeDateTime("Pickup date", pickupDate);

    await this.page.locator('input[name="rental_agreement_info.odometer_out"]').fill("1000");
    await this.page.locator('input[name="rental_agreement_info.odometer_in"]').fill("1000");

    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 7);
    returnDate.setHours(10, 0, 0, 0);
    await this.typeDateTime("Return date", returnDate);

    // Confirm billing (required before Generate Agreement becomes clickable)
    await this.page.getByRole("button", { name: "Edit Charges" }).click();
    const chargesDialog = this.page.locator('[role="dialog"]').filter({ hasText: "Edit Charges" });
    await chargesDialog.waitFor({ state: "visible" });
    if (options.chargesAction === "save-generate") {
      await chargesDialog
        .locator("button")
        .filter({ hasText: /save.*generate/i })
        .click();
    } else {
      await chargesDialog
        .locator("button")
        .filter({ hasText: /save.*close/i })
        .click();
      await this.page.getByRole("button", { name: "Generate Agreement" }).click();
    }
    await chargesDialog.waitFor({ state: "hidden" });
    await this.page.waitForURL("**/agreement?uuid=*");

    // Return to list page so callers can assert against the agreements table
    await this.goto();

    return agreementNumber;
  }

  /**
   * Open an agreement details page from the list by clicking its agreement number link.
   */
  async openAgreementDetails(identifier: string): Promise<void> {
    const row = this.getAgreementRow(identifier);
    await row.getByRole("link").click();
    await this.page.waitForURL("**/agreement?uuid=*");
  }

  /**
   * Type a Date into a MUI DateTimePicker field identified by its group label.
   */
  async typeDateTimeField(label: string, date: Date): Promise<void> {
    await this.typeDateTime(label, date);
  }

  /**
   * Edit an existing agreement
   */
  async editAgreement(
    uuid: string,
    updates: { dailyRate?: string; mileageIn?: string }
  ): Promise<void> {
    await this.gotoEditAgreement(uuid);

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

    await this.page.getByRole("button", { name: /save|submit/i }).click();
    await this.page.waitForURL("**/");
  }

  /**
   * Finalize an agreement (mark as archived)
   * Opens the finalization dialog and fills it
   */
  async finalizeAgreement(
    identifier: string,
    finalizationData: {
      vehicleReturnedAt: Date;
      actualOdometerIn: number;
      actualFuelLevel: string;
    }
  ): Promise<void> {
    await this.openAgreementActions(identifier);
    const finalizeAction = this.page.getByRole("menuitem", { name: /^finalize$/i });
    await finalizeAction.waitFor({ state: "visible" });
    await finalizeAction.click();

    const dialog = this.page.getByRole("dialog", { name: /finalize agreement/i });
    await dialog.waitFor({ state: "visible" });

    await this.typeDateTime("Return date", finalizationData.vehicleReturnedAt);

    await dialog
      .locator('input[name="actual_odometer_in"]')
      .fill(finalizationData.actualOdometerIn.toString());
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
    const downloadPromise = this.page.context().waitForEvent("download");
    await row.getByRole("button", { name: /pdf|download|view/i }).click();

    const download = await downloadPromise;
    await download.path();
  }

  /**
   * Assert agreement exists with given status
   */
  async expectAgreementExists(identifier: string, status?: AgreementStatus): Promise<void> {
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
