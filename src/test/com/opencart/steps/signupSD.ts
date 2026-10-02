import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../../../main/com/opencart/driver/fixtures';
import { generateNameDetails, generateSignupDetails } from '../../../../main/com/opencart/helpers/testdata';
const { When, Then } = createBdd(test);

//=========Signup steps ==================

When('user click on signup link', async ({ signupPage }) => {
  // Step: When user click on signup link
  await signupPage.openRegistration();
});

When('user should enter signup details', async ({signupPage}) => {
  const signupDetails = await generateSignupDetails();
  await signupPage.enterRegistrationDetails(signupDetails);
});

When('user should register once before testing duplicate signup', async ({ signupPage, logoutPage }) => {
  const profile = await generateNameDetails();
  const signupDetails = await generateSignupDetails(profile);
  await signupPage.enterRegistrationDetails(signupDetails);
  await signupPage.clickOnRegistrationButton();
  await expect(await signupPage.verifyAccountCreatedText()).toBeVisible();
  await signupPage.continueAfterRegistration();

  await logoutPage.clickOnLogoutButton();
  await expect(await logoutPage.verifyLogoutText()).toBeVisible();
  await logoutPage.clickOnContinueButton();
  await signupPage.openRegistration();
  await signupPage.enterRegistrationDetails(signupDetails);
});

When('user click on signup button', async ({signupPage}) => {
  await signupPage.clickOnRegistrationButton();
});


Then('user should verify signup error message {string}', async ({signupPage}, expectedText: string) => {
  // Step: Then user should verify signup error message "Warning: E-Mail Address is already registered!"
  const actualText = await signupPage.verifyErrorMessage();
  await expect(actualText).toContainText(expectedText);
});
