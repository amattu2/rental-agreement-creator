import { expect, type Page } from "@playwright/test";

import { test } from "../../fixtures";

const saveChargesAndClose = async (page: Page) => {
  await page.getByRole("button", { name: "Edit Charges" }).click();
  const chargesDialog = page.locator('[role="dialog"]').filter({ hasText: "Edit Charges" });
  await chargesDialog.waitFor({ state: "visible" });
  await chargesDialog
    .locator("button")
    .filter({ hasText: /save.*close/i })
    .click({ force: true });
  await chargesDialog.waitFor({ state: "hidden" });
};

const expectGenerateTooltip = async (page: Page, expectedText: string) => {
  const generateButton = page.getByRole("button", { name: "Generate Agreement" });
  await generateButton.locator("xpath=..").hover();
  await expect(page.getByRole("tooltip").filter({ hasText: expectedText })).toBeVisible();
};

test.describe("Agreements", () => {
  test.beforeEach(async ({ agreementsPage }) => {
    await agreementsPage.goto();
  });

  test("should list agreements @smoke", async ({ agreementsPage }) => {
    const searchField = agreementsPage.searchInput;
    await expect(searchField).toBeVisible();

    const createButton = agreementsPage.createButton;
    await expect(createButton).toBeVisible();
  });

  test("should create a new agreement @smoke", async ({ agreementsPage, testDataContext }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });

    await agreementsPage.expectAgreementExists(agreementNumber, "active");
  });

  test("should show newly created agreement in active status filter", async ({
    agreementsPage,
    testDataContext,
  }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });

    await agreementsPage.filterByStatus("active");
    await agreementsPage.expectAgreementExists(agreementNumber);
  });

  test("should search agreements by customer name", async ({ agreementsPage, testDataContext }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];

    const agreementNumber1 = await agreementsPage.createAgreement({
      customer: customer1,
      vehicle: vehicle1,
    });
    await agreementsPage.createAgreement({ customer: customer2, vehicle: vehicle2 });

    await agreementsPage.search(customer1.full_name);
    await expect(agreementsPage.getAgreementRow(agreementNumber1)).toBeVisible();
    await expect(agreementsPage.getAgreementRow(customer2.full_name)).toHaveCount(0);
  });

  test("should create multiple distinct agreements", async ({
    agreementsPage,
    testDataContext,
  }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];

    const agreementNumber1 = await agreementsPage.createAgreement({
      customer: customer1,
      vehicle: vehicle1,
    });
    const agreementNumber2 = await agreementsPage.createAgreement({
      customer: customer2,
      vehicle: vehicle2,
    });

    await agreementsPage.expectAgreementExists(agreementNumber1);
    await agreementsPage.search(agreementNumber2);
    await agreementsPage.expectAgreementExists(agreementNumber2);
  });

  test("should open agreement details from agreement row link", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });

    const row = agreementsPage.getAgreementRow(agreementNumber);
    await row.getByRole("link").click();
    await expect(page).toHaveURL(/\/agreement\?uuid=/);
  });

  test("should block generation until billing is confirmed and required fields are valid", async ({
    agreementsPage,
    page,
  }) => {
    await agreementsPage.clickCreateAgreement();

    await expect(page.getByLabel("Agreement number")).toBeVisible();
    // Generate Agreement is disabled until billing is confirmed (by design)
    await expect(page.getByRole("button", { name: "Generate Agreement" })).toBeDisabled();

    await saveChargesAndClose(page);
    await expect(page.getByRole("button", { name: "Generate Agreement" })).toBeEnabled();

    await page.getByRole("button", { name: "Generate Agreement" }).click();
    await expect(page.getByText("Rentee name is required").first()).toBeVisible();
  });

  test("should show a pending-billing tooltip before charges are confirmed", async ({
    agreementsPage,
    page,
  }) => {
    await agreementsPage.gotoCreateAgreement();

    await expect(page.getByRole("button", { name: "Generate Agreement" })).toBeDisabled();
    await expectGenerateTooltip(
      page,
      "No charges have been calculated yet. Please calculate the charges before proceeding."
    );
  });

  test("should show a stale-billing tooltip when billable inputs change", async ({
    agreementsPage,
    page,
  }) => {
    await agreementsPage.gotoCreateAgreement();

    const generateButton = page.getByRole("button", { name: "Generate Agreement" });
    await saveChargesAndClose(page);
    await expect(generateButton).toBeEnabled();

    await page.getByRole("button", { name: "Add rate" }).click();
    await expect(generateButton).toBeDisabled();

    await expectGenerateTooltip(
      page,
      "The available charges have changed since they were last confirmed. Please review and save the charges again."
    );
  });

  test("should show tooltip validation for odometer at return below pickup", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);
    await page.locator('input[name="rental_agreement_info.odometer_out"]').fill("1000");
    await page.locator('input[name="rental_agreement_info.odometer_in"]').fill("900");
    await page.keyboard.press("Tab");

    await page.getByRole("button", { name: "Generate Agreement" }).click();
    await expectGenerateTooltip(
      page,
      "Odometer at return must be greater than or equal to odometer at pickup"
    );
  });

  test("should show tooltip validation for odometer exceeding max distance", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[1],
      vehicle: testDataContext.vehicles[1],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);
    await page.locator('input[name="rental_agreement_info.odometer_out"]').fill("1000");
    await page.locator('input[name="rental_agreement_info.max_distance"]').fill("10");
    await page.locator('input[name="rental_agreement_info.odometer_in"]').fill("1200");
    await page.keyboard.press("Tab");

    await page.getByRole("button", { name: "Generate Agreement" }).click();
    await expectGenerateTooltip(
      page,
      "Odometer at return cannot exceed odometer at pickup plus maximum distance"
    );
  });

  test("should recalculate and persist charges after quantity, tax, and deposit edits", async ({
    agreementsPage,
    page,
  }) => {
    await agreementsPage.gotoCreateAgreement();

    await page.getByRole("button", { name: "Add rate" }).click();
    await page.getByLabel("Cost Per Unit").first().fill("50");

    await page.getByRole("button", { name: "Edit Charges" }).click();
    const chargesDialog = page.locator('[role="dialog"]').filter({ hasText: "Edit Charges" });
    await chargesDialog.waitFor({ state: "visible" });

    await chargesDialog.getByLabel("Quantity").first().fill("3");
    await chargesDialog.getByLabel("Sales Tax Rate (%)").fill("10");
    await chargesDialog.getByLabel("Deposit Amount").fill("20");

    await expect(chargesDialog.getByText("Sales Tax: $15.00")).toBeVisible();
    await expect(chargesDialog.getByText("Total Due: $145.00")).toBeVisible();

    await chargesDialog
      .locator("button")
      .filter({ hasText: /save.*close/i })
      .click({ force: true });
    await chargesDialog.waitFor({ state: "hidden" });

    await page.getByRole("button", { name: "Edit Charges" }).click();
    await chargesDialog.waitFor({ state: "visible" });

    await expect(chargesDialog.getByLabel("Quantity").first()).toHaveValue("3");
    await expect(chargesDialog.getByLabel("Sales Tax Rate (%)")).toHaveValue("10");
    await expect(chargesDialog.getByLabel("Deposit Amount")).toHaveValue("20");
  });

  test("should require billing reconfirmation when billable inputs change", async ({
    agreementsPage,
    page,
  }) => {
    await agreementsPage.gotoCreateAgreement();

    const generateButton = page.getByRole("button", { name: "Generate Agreement" });
    await expect(generateButton).toBeDisabled();

    await saveChargesAndClose(page);
    await expect(generateButton).toBeEnabled();

    await page.getByRole("button", { name: "Add rate" }).click();
    await expect(generateButton).toBeDisabled();

    await saveChargesAndClose(page);
    await expect(generateButton).toBeEnabled();
  });

  test("should keep agreement creation consistent for save-close and save-generate charge actions", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumberWithClose = await agreementsPage.createAgreementWithOptions(
      {
        customer: testDataContext.customers[0],
        vehicle: testDataContext.vehicles[0],
      },
      { chargesAction: "save-close" }
    );

    await agreementsPage.expectAgreementExists(agreementNumberWithClose, "active");
    await agreementsPage.openAgreementDetails(agreementNumberWithClose);
    await expect(page.getByTestId("iframe")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);

    await agreementsPage.goto();

    const agreementNumberWithGenerate = await agreementsPage.createAgreementWithOptions(
      {
        customer: testDataContext.customers[1],
        vehicle: testDataContext.vehicles[1],
      },
      { chargesAction: "save-generate" }
    );

    await agreementsPage.expectAgreementExists(agreementNumberWithGenerate, "active");
    await agreementsPage.openAgreementDetails(agreementNumberWithGenerate);
    await expect(page.getByTestId("iframe")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);
  });

  test("should preserve or discard edits correctly through reset confirmation", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);
    await expect(page.locator('input[name="rentee.full_name"]')).toHaveValue(
      testDataContext.customers[0].full_name
    );

    const fullNameInput = page.locator('input[name="rentee.full_name"]');
    const originalName = await fullNameInput.inputValue();
    const updatedName = `${originalName}-TEMP`;

    await fullNameInput.fill(updatedName);
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("stale-overlay")).toBeVisible();

    await page.getByRole("button", { name: "Reset" }).click();
    const resetDialog = page.getByRole("dialog", { name: "Discard Changes?" });
    await expect(resetDialog).toBeVisible();
    await resetDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(resetDialog).toBeHidden();

    await expect(fullNameInput).toHaveValue(updatedName);
    await expect(page.getByTestId("stale-overlay")).toBeVisible();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(resetDialog).toBeVisible();
    await resetDialog.getByRole("button", { name: "Reset" }).click();
    await expect(resetDialog).toBeHidden();

    await expect(fullNameInput).toHaveValue(originalName);
    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);
  });

  test("should mark preview stale after editing saved agreement and clear stale state when changes are reverted", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[1],
      vehicle: testDataContext.vehicles[1],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);
    await expect(page.locator('input[name="rentee.full_name"]')).toHaveValue(
      testDataContext.customers[1].full_name
    );
    await expect(page.getByTestId("iframe")).toBeVisible();
    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);

    const fullNameInput = page.locator('input[name="rentee.full_name"]');
    const originalName = await fullNameInput.inputValue();
    const modifiedName = `${originalName}-REVIEW`;

    await fullNameInput.fill(modifiedName);
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("stale-overlay")).toBeVisible();
    await expect(page.getByTestId("stale-overlay")).toContainText('Click "Generate Agreement"');

    await fullNameInput.fill(originalName);
    await page.keyboard.press("Tab");

    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);
    await expect(page.getByTestId("iframe")).toBeVisible();
  });

  test("should bind selected existing customer and vehicle data into the agreement form", async ({
    agreementsPage,
    customersPage,
    vehiclesPage,
    testDataContext,
    page,
  }) => {
    const uniqueToken = Date.now().toString(36).toUpperCase();
    const customer = {
      ...testDataContext.customers[2],
      full_name: `SELECT-CUSTOMER-${uniqueToken}`,
      email: `select-${uniqueToken}@test.com`,
      driver_license_number: `DL-SEL-${uniqueToken}`,
    };
    const vehicle = {
      ...testDataContext.vehicles[2],
      VIN: `S${uniqueToken}AAA`.slice(0, 17),
      stock_number: `STK-SEL-${uniqueToken}`,
      license_plate: `SEL${uniqueToken.slice(-5)}`,
    };

    await customersPage.goto();
    await customersPage.createCustomer(customer);

    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(vehicle);

    await agreementsPage.gotoCreateAgreement();

    await page.getByRole("button", { name: "Select an existing customer" }).click();
    const customerDialog = page.getByRole("dialog", { name: /select customer/i });
    await customerDialog.getByLabel("Search").fill(customer.full_name);
    await customerDialog
      .locator(`[role="row"]:has-text("${customer.full_name}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await expect(page.getByText("Existing Customer")).toBeVisible();
    await expect(page.locator('input[name="rentee.full_name"]')).toHaveValue(customer.full_name);
    await expect(page.locator('input[name="rentee.cell_phone"]')).toHaveValue(customer.cell_phone);

    await page.getByRole("button", { name: "Select an existing vehicle" }).click();
    const vehicleDialog = page.getByRole("dialog", { name: /select vehicle/i });
    await vehicleDialog.getByLabel("Search").fill(vehicle.VIN);
    await vehicleDialog
      .locator(`[role="row"]:has-text("${vehicle.VIN}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await expect(page.getByText("Existing Vehicle")).toBeVisible();
    await expect(page.locator('input[name="rental_vehicle.stock_number"]')).toHaveValue(
      vehicle.stock_number
    );
    await expect(page.locator('input[name="rental_vehicle.VIN"]')).toHaveValue(vehicle.VIN);
  });

  test("should clear selected existing customer and vehicle from the agreement form", async ({
    agreementsPage,
    customersPage,
    vehiclesPage,
    testDataContext,
    page,
  }) => {
    const uniqueToken = Date.now().toString(36).toUpperCase();
    const customer = {
      ...testDataContext.customers[1],
      full_name: `CLEAR-CUSTOMER-${uniqueToken}`,
      email: `clear-${uniqueToken}@test.com`,
      driver_license_number: `DL-CLR-${uniqueToken}`,
    };
    const vehicle = {
      ...testDataContext.vehicles[1],
      VIN: `C${uniqueToken}AAA`.slice(0, 17),
      stock_number: `STK-CLR-${uniqueToken}`,
      license_plate: `CLR${uniqueToken.slice(-5)}`,
    };

    await customersPage.goto();
    await customersPage.createCustomer(customer);
    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(vehicle);

    await agreementsPage.gotoCreateAgreement();

    await page.getByRole("button", { name: "Select an existing customer" }).click();
    const customerDialog = page.getByRole("dialog", { name: /select customer/i });
    await customerDialog.getByLabel("Search").fill(customer.full_name);
    await customerDialog
      .locator(`[role="row"]:has-text("${customer.full_name}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await page.getByRole("button", { name: "Select an existing vehicle" }).click();
    const vehicleDialog = page.getByRole("dialog", { name: /select vehicle/i });
    await vehicleDialog.getByLabel("Search").fill(vehicle.VIN);
    await vehicleDialog
      .locator(`[role="row"]:has-text("${vehicle.VIN}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await expect(page.getByText("Existing Customer")).toBeVisible();
    await expect(page.getByText("Existing Vehicle")).toBeVisible();

    await page
      .locator('[aria-label="Clear customer selection"] .MuiChip-deleteIcon')
      .click({ force: true });
    await page
      .locator('[aria-label="Clear vehicle selection"] .MuiChip-deleteIcon')
      .click({ force: true });

    await expect(page.getByText("Existing Customer")).toHaveCount(0);
    await expect(page.getByText("Existing Vehicle")).toHaveCount(0);
    await expect(page.locator('input[name="rentee.full_name"]')).toHaveValue("");
    await expect(page.locator('input[name="rental_vehicle.stock_number"]')).toHaveValue("");
    await expect(page.locator('input[name="rental_vehicle.VIN"]')).toHaveValue("");
  });

  test("should reject agreement submission when driver's license is expired", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);

    // Override DL expiration with a clearly past date
    await page
      .getByRole("group", { name: "Driver's license expiration" })
      .locator("[data-sectionindex='0']")
      .click();
    for (const char of "01012020") {
      await page.keyboard.press(char);
    }

    await page.getByRole("button", { name: "Generate Agreement" }).click();

    await expect(page.getByText("Driver's license cannot be expired").first()).toBeVisible();
    await expect(page).toHaveURL(/\/agreement\?uuid=/);
  });

  test("should reject agreement submission when return date is before pickup date", async ({
    agreementsPage,
    customersPage,
    vehiclesPage,
    testDataContext,
    page,
  }) => {
    const uniqueToken = Date.now().toString(36).toUpperCase();
    const customer = {
      ...testDataContext.customers[0],
      full_name: `DATE-RULE-CUSTOMER-${uniqueToken}`,
      email: `date-rule-${uniqueToken}@test.com`,
      driver_license_number: `DL-DR-${uniqueToken}`,
    };
    const vehicle = {
      ...testDataContext.vehicles[0],
      VIN: `D${uniqueToken}AAA`.slice(0, 17),
      stock_number: `STK-DR-${uniqueToken}`,
      license_plate: `DR${uniqueToken.slice(-5)}`,
    };

    await customersPage.goto();
    await customersPage.createCustomer(customer);
    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(vehicle);

    await agreementsPage.gotoCreateAgreement();
    await page.getByLabel("Agreement number").fill(`AGR-DATE-${Date.now()}`);

    await page.getByRole("button", { name: "Select an existing customer" }).click();
    const customerDialog = page.getByRole("dialog", { name: /select customer/i });
    await customerDialog.getByLabel("Search").fill(customer.full_name);
    await customerDialog
      .locator(`[role="row"]:has-text("${customer.full_name}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await page.getByRole("button", { name: "Select an existing vehicle" }).click();
    const vehicleDialog = page.getByRole("dialog", { name: /select vehicle/i });
    await vehicleDialog.getByLabel("Search").fill(vehicle.VIN);
    await vehicleDialog
      .locator(`[role="row"]:has-text("${vehicle.VIN}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    const pickupDate = new Date();
    pickupDate.setHours(10, 0, 0, 0);
    const returnDate = new Date(pickupDate);
    returnDate.setHours(9, 0, 0, 0);

    await agreementsPage.typeDateTimeField("Pickup date", pickupDate);
    await agreementsPage.typeDateTimeField("Return date", returnDate);
    await page.locator('input[name="rental_agreement_info.odometer_out"]').fill("1000");
    await page.locator('input[name="rental_agreement_info.odometer_in"]').fill("1000");

    await saveChargesAndClose(page);
    await page.getByRole("button", { name: "Generate Agreement" }).click();

    await expect(
      page.getByText("Return date and time must be after pickup date and time").first()
    ).toBeVisible();
    await expect(page).toHaveURL(/\/agreement$/);
  });

  test("should reject agreement submission when return odometer is less than pickup odometer", async ({
    agreementsPage,
    customersPage,
    vehiclesPage,
    testDataContext,
    page,
  }) => {
    const uniqueToken = Date.now().toString(36).toUpperCase();
    const customer = {
      ...testDataContext.customers[1],
      full_name: `ODOMETER-RULE-CUSTOMER-${uniqueToken}`,
      email: `odometer-rule-${uniqueToken}@test.com`,
      driver_license_number: `DL-OR-${uniqueToken}`,
    };
    const vehicle = {
      ...testDataContext.vehicles[1],
      VIN: `O${uniqueToken}AAA`.slice(0, 17),
      stock_number: `STK-OR-${uniqueToken}`,
      license_plate: `OR${uniqueToken.slice(-5)}`,
    };

    await customersPage.goto();
    await customersPage.createCustomer(customer);
    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(vehicle);

    await agreementsPage.gotoCreateAgreement();
    await page.getByLabel("Agreement number").fill(`AGR-ODO-${Date.now()}`);

    await page.getByRole("button", { name: "Select an existing customer" }).click();
    const customerDialog = page.getByRole("dialog", { name: /select customer/i });
    await customerDialog.getByLabel("Search").fill(customer.full_name);
    await customerDialog
      .locator(`[role="row"]:has-text("${customer.full_name}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await page.getByRole("button", { name: "Select an existing vehicle" }).click();
    const vehicleDialog = page.getByRole("dialog", { name: /select vehicle/i });
    await vehicleDialog.getByLabel("Search").fill(vehicle.VIN);
    await vehicleDialog
      .locator(`[role="row"]:has-text("${vehicle.VIN}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    const pickupDate = new Date();
    pickupDate.setHours(9, 0, 0, 0);
    const returnDate = new Date(pickupDate);
    returnDate.setDate(returnDate.getDate() + 1);
    returnDate.setHours(10, 0, 0, 0);

    await agreementsPage.typeDateTimeField("Pickup date", pickupDate);
    await agreementsPage.typeDateTimeField("Return date", returnDate);
    await page.locator('input[name="rental_agreement_info.odometer_out"]').fill("1500");
    await page.locator('input[name="rental_agreement_info.odometer_in"]').fill("1400");

    await saveChargesAndClose(page);
    await page.getByRole("button", { name: "Generate Agreement" }).click();

    await expect(
      page
        .getByText("Odometer at return must be greater than or equal to odometer at pickup")
        .first()
    ).toBeVisible();
    await expect(page).toHaveURL(/\/agreement$/);
  });

  test("should carry vehicle rental rates into the Edit Charges dialog upon selection", async ({
    vehiclesPage,
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const uniqueToken = Date.now().toString(36).toUpperCase();
    const vehicle = {
      ...testDataContext.vehicles[2],
      VIN: `R${uniqueToken}AAA`.slice(0, 17),
      stock_number: `STK-R-${uniqueToken}`,
      license_plate: `RTE${uniqueToken.slice(-5)}`,
    };

    await vehiclesPage.goto();
    await vehiclesPage.createButton.click();
    await vehiclesPage.editorDialog.waitFor({ state: "visible" });
    await vehiclesPage.editorDialog.getByLabel("VIN").fill(vehicle.VIN);
    await vehiclesPage.editorDialog.getByLabel("Stock number").fill(vehicle.stock_number);
    await vehiclesPage.editorDialog.getByLabel("License plate").fill(vehicle.license_plate);
    await vehiclesPage.editorDialog.getByLabel("Year").fill(vehicle.year.toString());
    await vehiclesPage.editorDialog.getByLabel("Make").fill(vehicle.make);
    await vehiclesPage.editorDialog.getByLabel("Model").fill(vehicle.model);
    await vehiclesPage.editorDialog.getByLabel("Color").fill(vehicle.color);
    // Add a rental rate to the vehicle before saving
    await vehiclesPage.editorDialog.getByRole("button", { name: "Add Rate" }).click();
    await vehiclesPage.editorDialog.getByLabel("Cost Per Unit").fill("50");
    await vehiclesPage.editorDialog.getByRole("button", { name: "Save" }).click();
    await vehiclesPage.editorDialog.waitFor({ state: "hidden" });

    await agreementsPage.gotoCreateAgreement();
    await page.getByRole("button", { name: "Select an existing vehicle" }).click();
    const selectionDialog = page.getByRole("dialog", { name: /select vehicle/i });
    await selectionDialog.getByLabel("Search").fill(vehicle.VIN);
    await selectionDialog
      .locator(`[role="row"]:has-text("${vehicle.VIN}") [aria-label="Select"]`)
      .first()
      .click({ force: true });
    await expect(page.getByText("Existing Vehicle")).toBeVisible();

    await page.getByRole("button", { name: "Edit Charges" }).click();
    const chargesDialog = page.locator('[role="dialog"]').filter({ hasText: "Edit Charges" });
    await chargesDialog.waitFor({ state: "visible" });

    // The vehicle's rental rate should appear as a line item in the billing dialog
    await expect(chargesDialog.getByText("HOURS", { exact: true })).toBeVisible();
    await expect(chargesDialog.getByText(/\$50\.00.*PER HOUR/).first()).toBeVisible();
  });

  test("should persist changes to an active agreement after saving", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);

    const fullNameInput = page.locator('input[name="rentee.full_name"]');
    const originalName = await fullNameInput.inputValue();
    const updatedName = `${originalName}-EDITED`;

    await fullNameInput.fill(updatedName);
    await page.keyboard.press("Tab");

    await page.getByRole("button", { name: "Generate Agreement" }).click();
    await expect(page.getByTestId("iframe")).toBeVisible({ timeout: 15_000 });

    await agreementsPage.goto();
    await agreementsPage.openAgreementDetails(agreementNumber);

    await expect(page.locator('input[name="rentee.full_name"]')).toHaveValue(updatedName);
  });

  test("should search agreements by agreement number", async ({
    agreementsPage,
    testDataContext,
  }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];

    const agreementNumber1 = await agreementsPage.createAgreement({
      customer: customer1,
      vehicle: vehicle1,
    });
    await agreementsPage.createAgreement({ customer: customer2, vehicle: vehicle2 });

    await agreementsPage.search(agreementNumber1);
    await expect(agreementsPage.getAgreementRow(agreementNumber1)).toBeVisible();
    await expect(agreementsPage.getAgreementRow(customer2.full_name)).toHaveCount(0);
  });

  test("should persist clerk signature after saving", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);

    const signatureCanvas = page.getByLabel("Authorized Rental Clerk Signature");
    await expect(signatureCanvas).toBeVisible();

    const canvasHasInk = async () =>
      signatureCanvas.evaluate((canvasElement: HTMLCanvasElement) => {
        const context = canvasElement.getContext("2d");
        if (!context) {
          return false;
        }

        const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
        for (let index = 3; index < imageData.data.length; index += 4) {
          if (imageData.data[index] !== 0) {
            return true;
          }
        }
        return false;
      });

    expect(await canvasHasInk()).toBe(false);

    await signatureCanvas.evaluate((canvasElement) => {
      const rect = canvasElement.getBoundingClientRect();
      const fire = (type: string, x: number, y: number, buttons: number) => {
        canvasElement.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 1,
            bubbles: true,
            clientX: rect.left + x,
            clientY: rect.top + y,
            buttons,
          })
        );
      };

      fire("pointerdown", 20, 20, 1);
      fire("pointermove", 170, 55, 1);
      fire("pointerup", 170, 55, 0);
    });

    expect(await canvasHasInk()).toBe(true);

    await page.getByRole("button", { name: "Generate Agreement" }).click();
    await expect(page).toHaveURL(/\/agreement\?uuid=/);

    await agreementsPage.goto();
    await agreementsPage.openAgreementDetails(agreementNumber);

    const persistedSignatureCanvas = page.getByLabel("Authorized Rental Clerk Signature");
    await expect(persistedSignatureCanvas).toBeVisible();

    const persistedCanvasHasInk = await persistedSignatureCanvas.evaluate(
      (canvasElement: HTMLCanvasElement) => {
        const context = canvasElement.getContext("2d");
        if (!context) {
          return false;
        }

        const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
        for (let index = 3; index < imageData.data.length; index += 4) {
          if (imageData.data[index] !== 0) {
            return true;
          }
        }
        return false;
      }
    );

    expect(persistedCanvasHasInk).toBe(true);
  });

  test("should persist optional renter and protection sections after saving", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);

    await page.locator('input[name="rentee.alternate_phone"]').fill("555-0199");
    await page.locator('input[name="rentee.employer.company"]').fill("Acme Corp");
    await page.locator('input[name="rentee.employer.position"]').fill("Manager");
    await page.locator('input[name="rentee.insurance.company"]').fill("SafeShield");
    await page.locator('input[name="rentee.insurance.policy_number"]').fill("POL-7788");

    await page.getByRole("button", { name: "Add Vehicle Damage Waiver" }).click();
    await page.locator('input[name="vehicle_damage_waiver.rate_per_day"]').fill("12");
    await page.locator('input[name="vehicle_damage_waiver.rate_per_week"]').fill("60");
    await page.locator('input[name="vehicle_damage_waiver.damage_liability_limit"]').fill("500");

    await page.getByRole("button", { name: "Add Personal Accident Insurance" }).click();
    await page.locator('input[name="personal_accident_insurance.rate_per_day"]').fill("7");

    await page.getByRole("button", { name: "Edit Charges" }).click();
    const chargesDialog = page.locator('[role="dialog"]').filter({ hasText: "Edit Charges" });
    await chargesDialog.waitFor({ state: "visible" });
    await chargesDialog
      .locator("button")
      .filter({ hasText: /save.*generate/i })
      .click({ force: true });
    await chargesDialog.waitFor({ state: "hidden" });

    // A successful submit resets form dirtiness, which enables stable persistence checks.
    await expect(page.getByRole("button", { name: "Reset" })).toBeDisabled({ timeout: 15_000 });

    await agreementsPage.goto();
    await agreementsPage.openAgreementDetails(agreementNumber);

    await expect(page.locator('input[name="rentee.alternate_phone"]')).toHaveValue("555-0199");
    await expect(page.locator('input[name="rentee.employer.company"]')).toHaveValue("Acme Corp");
    await expect(page.locator('input[name="rentee.employer.position"]')).toHaveValue("Manager");
    await expect(page.locator('input[name="rentee.insurance.company"]')).toHaveValue("SafeShield");
    await expect(page.locator('input[name="rentee.insurance.policy_number"]')).toHaveValue(
      "POL-7788"
    );
    await expect(page.locator('input[name="vehicle_damage_waiver.rate_per_day"]')).toHaveValue(
      "12"
    );
    await expect(page.locator('input[name="vehicle_damage_waiver.rate_per_week"]')).toHaveValue(
      "60"
    );
    await expect(
      page.locator('input[name="vehicle_damage_waiver.damage_liability_limit"]')
    ).toHaveValue("500");
    await expect(
      page.locator('input[name="personal_accident_insurance.rate_per_day"]')
    ).toHaveValue("7");
  });

  test("should require additional driver name when an additional driver is added", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[1],
      vehicle: testDataContext.vehicles[1],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);

    await page.getByRole("button", { name: "Add driver" }).click();
    await page.locator('input[name="additional_drivers.0.driver_license_number"]').fill("ADL-100");

    const additionalDobGroup = page.getByRole("group", { name: "Date of birth" }).nth(1);
    await additionalDobGroup.locator('[data-sectionindex="0"]').click();
    for (const char of "01011990") {
      await page.keyboard.press(char);
    }

    const additionalExpirationGroup = page
      .getByRole("group", { name: "Driver's license expiration" })
      .nth(1);
    await additionalExpirationGroup.locator('[data-sectionindex="0"]').click();
    for (const char of "12312099") {
      await page.keyboard.press(char);
    }

    await page.getByRole("button", { name: "Generate Agreement" }).click();
    await expect(page.getByText("Additional driver name is required").first()).toBeVisible();
    await expect(page).toHaveURL(/\/agreement\?uuid=/);
  });
});
