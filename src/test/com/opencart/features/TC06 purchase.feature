#Author: Aniket Ajay Umare

@Opencart
Feature: Purchase Functionality

Scenario: TC06 Verify purchase functionality with add product to the cart
    Given user launch browser with url
    When user click on signin link and enter login credentails then click on login button
    Then user should navigate to Laptop And Notebook section
    And user should select Laptop as product and click add to cart
    Then user should verify Laptop as product name "HP LP3065" text
    And now user should click on check out button and navigate to check out page
    Then user should go through all details and confirm order at the end
    And user should verify order been placed with "Your order has been placed!" text