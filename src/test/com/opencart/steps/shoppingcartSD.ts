import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../../../main/com/opencart/driver/fixtures';
const { When, Then } = createBdd(test);

//=========Shoppingcart steps ==================


Then('user should navigate to Laptop And Notebook section', async ({ shoppingcartPage }) => {
    // Step: Then user should navigate to Laptop And Notebook section
    await shoppingcartPage.clearCart();
    await shoppingcartPage.navigateToLaptopAndNotebookSection();
});

Then('user should select Laptop as product and click add to cart', async ({ shoppingcartPage }) => {
    // Step: And user should select product and click add to cart
    await shoppingcartPage.addLaptopProduct();
    await shoppingcartPage.addToCart();
});

Then('user should verify Laptop as product name {string} text', async ({ shoppingcartPage }, expectedText: string) => {
    // Step: Then user should verify product name "HP LP3065" text
    await shoppingcartPage.navigateToShoppingcart();
    const actualText = await shoppingcartPage.verifyLaptopProductText(expectedText);
    await expect(actualText).toContainText(expectedText);
});

Then('user should remove Laptop as product from the cart', async ({shoppingcartPage}) => {
  // Step: And user should remove Laptop as product from the cart
    await shoppingcartPage.removeProduct();
});