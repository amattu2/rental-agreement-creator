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
}
