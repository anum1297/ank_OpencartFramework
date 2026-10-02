import { Page } from "@playwright/test";

export class AddressPage {

    constructor(private page: Page) {
    }

    async navigateToAddressPage() {
        await this.page.locator(`//span[contains(text(),'My Account')]`).click();
        await this.page.locator(`//a[contains(text(),'Address Book')]`).click();
    }

    async enterAddressDetails(details: {
        firstName: string;
        lastName: string;
        company: string;
        address1: string;
        address2: string;
        city: string;
        postCode: string;
        country: string;
        region: string;
    }) {
        await this.page.locator(`//a[contains(text(),'New Address')]`).click();
        await this.page.getByPlaceholder(`First Name`).fill(details.firstName);
        await this.page.getByPlaceholder(`Last Name`).fill(details.lastName);
        await this.page.getByPlaceholder(`Company`).fill(details.company);
        await this.page.getByPlaceholder(`Address 1`).fill(details.address1);
        await this.page.getByPlaceholder(`Address 2`).fill(details.address2);
        await this.page.getByPlaceholder(`City`).fill(details.city);
        await this.page.getByPlaceholder(`Post Code`).fill(details.postCode);
        await this.page.locator(`#input-country`).selectOption({ label: details.country });
        await this.page.locator(`#input-zone`).selectOption({ label: details.region });
    }

    async saveAddress() {
        await this.page.locator(`//input[@value='Continue']`).click();
    }

    async verifyAddressSavedText() {
        return this.page.getByText(` Address Book Entries`);
    }
}