import { Page } from "@playwright/test";
import { Utilities } from "../../../../main/com/opencart/helpers/utilities";

export class ShoppingcartPage {
    constructor(private readonly page: Page) { }

    async navigateToLaptopAndNotebookSection() {
        await this.page.locator(`//body/div[1]/nav[1]/div[2]/ul[1]/li[2]/a[1]`).click();
        await this.page.locator(`//a[contains(text(),'Show All Laptops & Notebooks')]`).click();
    }

    async addLaptopProduct() {
        const config = new Utilities();
        const productNameToSearch = (config.getProperty('product1') ?? 'HP LP3065').trim();
        const products = this.page.locator(`//div[@class='product-thumb']//div[@class='caption']/h4/a`);
        const totalProducts = await products.count();

        for (let i = 0; i < totalProducts; i++) {
            const productName = await products.nth(i).textContent();
            if (productName?.trim().toLowerCase() === productNameToSearch.toLowerCase()) {
                await products.nth(i).click();
                return;
            }
        }
        throw new Error(`Product not found: ${productNameToSearch}`);
    }

    async addToCart() {
        const addToCartResponse = this.page.waitForResponse((response) =>
            response.url().includes('route=checkout/cart/add') && response.request().method() === 'POST',
        );
        await this.page.locator(`//button[@id='button-cart']`).click();
        const response = await addToCartResponse;
        const responseBody = await response.json();
        if (!response.ok() || !responseBody.success) {
            throw new Error(`Failed to add product to cart: ${JSON.stringify(responseBody)}`);
        }
    }

    async clearCart() {
        await this.navigateToShoppingcart();
        const removeButtons = this.page.locator(`#content button[data-original-title='Remove']`);

        while (await removeButtons.count()) {
            const previousCount = await removeButtons.count();
            const removeResponse = this.page.waitForResponse((response) =>
                response.url().includes('route=checkout/cart/remove') && response.request().method() === 'POST',
            );
            await removeButtons.first().click();
            const response = await removeResponse;
            if (!response.ok()) {
                throw new Error(`Failed to remove an existing cart item: ${response.status()}`);
            }

            await this.page.waitForFunction((count) =>
                document.querySelectorAll(`#content button[data-original-title='Remove']`).length < count,
            previousCount);
        }
    }

    async navigateToShoppingcart() {
        await this.page.locator(`//span[text()='Shopping Cart']`).click();
    }

    async verifyLaptopProductText(productName: string) {
        return this.page.locator(`#content td.text-left`).getByRole(`link`, { name: productName, exact: true });
    }

    async removeProduct() {
        await this.page.locator(`//button[@data-original-title='Remove']`).click();
    }

    async checkOut() {
        await this.page.locator(`//a[@class='btn btn-primary']`).click();
    }
}