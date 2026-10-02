import { Page } from "@playwright/test"

export class SignupPage {

  constructor(private readonly page: Page) { }

  async openRegistration() {
    await this.page.locator(`//span[contains(text(),'My Account')]`).click();
    await this.page.locator(`//a[contains(text(),'Register')]`).click();
  }

  async enterRegistrationDetails(details: {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    password: string;
    passwordConfirm: string;
  }) {
    await this.page.getByPlaceholder(`First Name`).fill(details.firstName);
    await this.page.getByPlaceholder(`Last Name`).fill(details.lastName);
    await this.page.getByPlaceholder(`E-Mail`).fill(details.email);
    await this.page.getByPlaceholder(`Telephone`).fill(details.telephone);
    await this.page.locator(`#input-password`).fill(details.password);
    await this.page.getByPlaceholder(`Password Confirm`).fill(details.passwordConfirm);
    await this.page.locator(`//div[@class='col-sm-10']/label/child::input[@value='1']`).click();
    await this.page.locator(`//input[@type='checkbox']`).click();
  }

  async clickOnRegistrationButton() {
    await this.page.locator(`//input[@type='submit']`).click();
  }

  async verifyErrorMessage() {
    return this.page.getByText('Warning: E-Mail Address is already registered!');
  }
}