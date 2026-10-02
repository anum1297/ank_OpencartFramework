import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../../../main/com/opencart/driver/fixtures';
import { getSignupCredentials } from '../../../../main/com/opencart/helpers/testdata';
const { When, Then } = createBdd(test);

//=========Login steps ==================

When('user click on signin link and enter login credentails then click on login button', async ({ loginPage }) => {
  // Step: When user click on signin link and enter login credentails then click on login button
  const credentials = await getSignupCredentials();
  await loginPage.enterLoginDetails(credentials);
  await test.step(`Signed in with customer account: ${credentials.email}`, async () => {});
});

When('user click on signin link and enter invalid login credentails then click on login button', async ({ loginPage }) => {
  const email = process.env.INVALID_LOGIN_EMAIL?.trim() || 'invalid-user@example.com';
  const password = process.env.INVALID_LOGIN_PASSWORD || 'NotARealPassword123!';
  await loginPage.enterLoginDetails({ email, password });
});

Then('user should verify {string} text', async ({ loginPage }, expectedText: string) => {
  // Step: Then user should verify "My account" text
  const actualText = await loginPage.verifyMyAccountText();
  await expect(actualText).toContainText(expectedText);
});

Then('user should verify invalid login warning text', async ({loginPage}) => {
  const actualText = await loginPage.verifyInvalidLoginText();
  await expect(actualText).toBeVisible();
});
