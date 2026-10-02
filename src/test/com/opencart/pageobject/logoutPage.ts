import { Page } from "@playwright/test";

export class LogoutPage {
    constructor(private readonly page: Page) { }

    async clickOnLogoutButton() {
        await this.page.locator(`//div[@class="list-group"]/child::a[text()='Logout']`).click();
    }

    async verifyLogoutText() {
        return this.page.locator(`//h1[text()='Account Logout']`);
    }

    async clickOnContinueButton() {
        await this.page.locator(`//a[text()='Continue']`).click();
    }
}