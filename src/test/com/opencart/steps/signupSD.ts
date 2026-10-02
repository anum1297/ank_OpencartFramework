import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../../../main/com/opencart/driver/fixtures';
import { generateSignupDetails } from '../../../../main/com/opencart/helpers/testdata';
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

When('user should enter duplicate signup details', async ({ signupPage }) => {
  const duplicateEmail = process.env.DUPLICATE_SIGNUP_EMAIL?.trim();
  if (!duplicateEmail) {
    throw new Error('Set DUPLICATE_SIGNUP_EMAIL to an email already registered on the OpenCart test site.');
  }

  const signupDetails = await generateSignupDetails();
  await signupPage.enterRegistrationDetails({ ...signupDetails, email: duplicateEmail });
});

When('user click on signup button', async ({signupPage}) => {
  // Step: And user click on signup button
  await signupPage.clickOnRegistrationButton();
  const signupDetails = await generateSignupDetails();
  const customerDetails = {
    firstName: signupDetails.firstName,
    lastName: signupDetails.lastName,
    email: signupDetails.email,
    telephone: signupDetails.telephone,
    password: signupDetails.password,
  };
  await test.step(`Created customer account: ${JSON.stringify(customerDetails)}`, async () => {});
});


Then('user should verify signup error message {string}', async ({signupPage}, expectedText: string) => {
  // Step: Then user should verify signup error message "Warning: E-Mail Address is already registered!"
  const actualText = await signupPage.verifyErrorMessage();
  await expect(actualText).toContainText(expectedText);
});
