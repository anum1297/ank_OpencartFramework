import { Page } from "@playwright/test";
import { getSignupCredentials } from "../../../../main/com/opencart/helpers/testdata";

export class LoginPage {

    constructor(private page: Page) {
    }

    async enterLoginDetails(credentials?: { email: string; password: string }) {
        await this.page.locator(`//span[contains(text(),'My Account')]`).click();
        await this.page.locator(`//a[contains(text(),'Login')]`).click();
        const loginCredentials = credentials ?? await getSignupCredentials();
        await this.page.getByPlaceholder(`E-Mail Address`).fill(loginCredentials.email);
        await this.page.locator(`#input-password`).fill(loginCredentials.password);
        await this.page.locator(`//input[@value='Login']`).click();
    }

    async verifyMyAccountText() {
        return this.page.locator(`//h2[text()='My Account']`);
    }

    async verifyInvalidLoginText(){
        return this.page.getByText(/Warning: (?:No match for E-Mail Address and\/or Password\.|Your account has exceeded allowed number of login attempts\. Please try again in 1 hour\.)/);
    }
}