import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../../../main/com/opencart/driver/fixtures';
const { When, Then } = createBdd(test);

//=========Logout steps ==================

When('user click on logout link', async ({logoutPage}) => {
  // Step: And user click on logout link
  logoutPage.clickOnLogoutButton();
});

Then('user should verify {string} text and click on continue', async ({logoutPage}, expectedText: string) => {
  // Step: Then user should navigate to home page "Discover the Future of Electronics"
  const actualText = await logoutPage.verifyLogoutText();
  await expect(actualText).toContainText(expectedText);
  logoutPage.clickOnContinueButton();
});