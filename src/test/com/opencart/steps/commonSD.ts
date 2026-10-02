import { createBdd } from 'playwright-bdd';
import { test } from '../../../../main/com/opencart/driver/fixtures';
import { Utilities } from '../../../../main/com/opencart/helpers/utilities';

const { Given } = createBdd(test);
const utilities = new Utilities();

Given('user launch browser with url', async ({ page }) => {
  const baseURL = utilities.getProperty('baseURL');
  if (!baseURL) {
    throw new Error('Missing required "baseURL" in qaConfig.properties');
  }

  await page.goto(baseURL);
});