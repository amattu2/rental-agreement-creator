import { expect } from "@playwright/test";

import { test } from "../../fixtures";

test.describe("Navigation", () => {
  test("should load agreements route @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Rental Agreements" })).toBeVisible();
  });

  test("should navigate to customers from header @smoke", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Customers" }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible();
  });

  test("should navigate to vehicles from header @smoke", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Vehicles" }).click();
    await expect(page).toHaveURL(/\/vehicles$/);
    await expect(page.getByRole("heading", { name: "Vehicles" })).toBeVisible();
  });

  test("should return to agreements from header @smoke", async ({ page }) => {
    await page.goto("/customers");
    await page.getByRole("link", { name: "Agreements" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Rental Agreements" })).toBeVisible();
  });

  test("should open the agreement form from agreements list @smoke", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Create Agreement" }).click();

    await expect(page).toHaveURL(/\/agreement$/);
    await expect(page.getByLabel("Agreement number")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate Agreement" })).toBeDisabled();
  });
});
