import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { generateAddressDetails } from '../../../../main/com/opencart/helpers/testdata';
import { test } from '../../../../main/com/opencart/driver/fixtures';
const { When, Then } = createBdd(test);

let generatedAddressDetails: Awaited<ReturnType<typeof generateAddressDetails>> | undefined;

Then('now user should navigate to address page with help of address link', async ({ addressPage }) => {
  await addressPage.navigateToAddressPage();
});

Then('user should enter all address related details', async ({ addressPage }) => {
  const addressDetails = await generateAddressDetails();
  generatedAddressDetails = addressDetails;
  await addressPage.enterAddressDetails(addressDetails);
});

Then('user should save the adress at the end', async ({ addressPage }) => {
  await addressPage.saveAddress();
});

Then('user should verify save address the {string} text', async ({ addressPage }, expectedText: string) => {
  const actualText = await addressPage.verifyAddressSavedText();
  await expect(actualText).toHaveText(expectedText);
  if (!generatedAddressDetails) {
    throw new Error('Generated address details are unavailable for the Extent report');
  }

  await test.step(`Saved address details: ${JSON.stringify(generatedAddressDetails)}`, async () => {});
  generatedAddressDetails = undefined;
});
