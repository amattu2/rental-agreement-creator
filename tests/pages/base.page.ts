import { Page, Locator } from "@playwright/test";

/**
 * Base Page class for all page objects.
 * Provides common navigation and utility methods.
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a relative path
   */
  async navigate(path: string = "/"): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to fully load (network idle)
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for a specific locator to be visible
   */
  async waitForElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: "visible" });
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Check if an element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible().catch(() => false);
  }

  /**
   * Wait for navigation to complete after an action
   */
  async waitForNavigation(action: () => Promise<void>): Promise<void> {
    await Promise.all([this.page.waitForNavigation(), action()]);
  }

  /**
   * Fill a form field
   */
  async fillField(label: string, value: string): Promise<void> {
    const field = this.page.getByLabel(label);
    await field.fill(value);
  }

  /**
   * Click a button by name
   */
  async clickButton(name: string): Promise<void> {
    await this.page.getByRole("button", { name }).click();
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Type a date/time value into a MUI DateTimePicker field group using keyboard input.
   */
  protected async typeDateTime(label: string, date: Date): Promise<void> {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const hours24 = date.getHours();
    const meridiem = hours24 >= 12 ? "PM" : "AM";
    const hours12 = String(((hours24 + 11) % 12) + 1).padStart(2, "0");

    await this.page.getByRole("group", { name: label }).locator("[data-sectionindex='0']").click();
    await this.page.keyboard.type(`${month}${day}${year}${hours12}${minutes}${meridiem[0]}`);
  }

  /**
   * Type a date value into a MUI DatePicker field group.
   */
  protected async typeDate(label: string, date: Date): Promise<void> {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    await this.page.getByRole("group", { name: label }).locator("[data-sectionindex='0']").click();
    await this.page.keyboard.type(`${month}${day}${year}`);
  }
}
