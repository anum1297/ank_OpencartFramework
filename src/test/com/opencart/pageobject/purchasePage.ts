import { Page } from "@playwright/test";

export class PurchasePage {
    constructor(private readonly page: Page) { }

        async clickOnPaymentAddress(){
            await this.page.locator(`//input[@id='button-payment-address']`).click();
        }

        async clickOnShippingAddress(){
            await this.page.locator(`//input[@id='button-shipping-address']`).click();
        }

        async clickOnShippingMethod(){
            await this.page.locator(`//input[@id='button-shipping-method']`).click();
        }

        async clickOnTermsandConditonCheckbox(){
            await this.page.locator(`//body/div[@id='checkout-checkout']/div[1]/div[1]/div[1]/div[5]/div[2]/div[1]/div[2]/div[1]/input[1]`).click();
        }

        async clickOnPaymentMethod(){
            await this.page.locator(`//input[@id='button-payment-method']`).click();
        }

        async clickOnConfirm(){
            await this.page.locator(`//input[@id='button-confirm']`).click();
        }

        async verifySuccessMassage(){
            return this.page.locator(`//h1[contains(text(),'Your order has been placed!')]`);
        }

}