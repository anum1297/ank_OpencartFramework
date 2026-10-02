import { test as base } from 'playwright-bdd';
import { LoginPage } from '../../../../test/com/opencart/pageobject/loginPage';
import { SignupPage } from '../../../../test/com/opencart/pageobject/signupPage';
import { LogoutPage } from '../../../../test/com/opencart/pageobject/logoutPage';
import { ShoppingcartPage } from '../../../../test/com/opencart/pageobject/shoppingcartPage';
import { PurchasePage } from '../../../../test/com/opencart/pageobject/purchasePage';
import { AddressPage } from '../../../../test/com/opencart/pageobject/addressPage';

type Fixtures = {
  signupPage: SignupPage;
  loginPage: LoginPage;
  logoutPage: LogoutPage;
  shoppingcartPage: ShoppingcartPage
  purchasePage: PurchasePage;
  addressPage: AddressPage;
};

export const test = base.extend<Fixtures>({
  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  logoutPage: async ({ page }, use) => {
    await use(new LogoutPage(page));
  },
  shoppingcartPage: async ({ page }, use) => {
    await use(new ShoppingcartPage(page));
  },
  purchasePage: async ({ page }, use) => {
    await use(new PurchasePage(page));
  },
  addressPage: async ({ page }, use) => {
    await use(new AddressPage(page));
  }
});