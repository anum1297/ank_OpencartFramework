import { Page } from "@playwright/test"

export class SignupPage {

  constructor(private readonly page: Page) { }

  async openRegistration() {
    await this.page.locator('a.dropdown-toggle').filter({ hasText: 'My Account' }).click();
    await this.page.getByRole('link', { name: 'Register', exact: true }).click();
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

  async verifyAccountCreatedText() {
    return this.page.getByRole('heading', { name: 'Your Account Has Been Created!', exact: true });
  }

  async continueAfterRegistration() {
    await this.page.getByRole('link', { name: 'Continue', exact: true }).click();
  }

  async verifyErrorMessage() {
    return this.page.getByText('Warning: E-Mail Address is already registered!');
  }
}