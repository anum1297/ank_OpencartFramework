import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../../../main/com/opencart/driver/fixtures';
const { When, Then } = createBdd(test);

//=========Purchase steps ==================

Then('now user should click on check out button and navigate to check out page', async ({shoppingcartPage}) => {
  // Step: And now user should click on check out button and navigate to check out page
  await shoppingcartPage.checkOut();
});

Then('user should go through all details and confirm order at the end', async ({purchasePage}) => {
  // Step: Then user should go through all details and confirm order at the end
  await purchasePage.clickOnPaymentAddress();
  await purchasePage.clickOnShippingAddress();
  await purchasePage.clickOnShippingMethod();
  await purchasePage.clickOnTermsandConditonCheckbox();
  await purchasePage.clickOnPaymentMethod();
  await purchasePage.clickOnConfirm();

});

Then('user should verify order been placed with {string} text', async ({purchasePage}, expectedText: string) => {
  // Step: And user should verify order been placed with "Your order has been placed!" text
      const actualText = await purchasePage.verifySuccessMassage();
    await expect(actualText).toContainText(expectedText);
});