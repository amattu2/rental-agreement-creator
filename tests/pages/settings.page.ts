import { BasePage } from "./base.page";

export class SettingsPage extends BasePage {
  /**
   * Navigate to the settings page.
   */
  async goto(): Promise<void> {
    await this.navigate("/settings");
    await this.waitForPageLoad();
  }
}
