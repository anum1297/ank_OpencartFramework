#Author: Aniket Ajay Umare

@Opencart
Feature: Shoppingcart Functionality

Scenario: TC05 Verify shoppingcart functionality
    Given user launch browser with url
    When user click on signin link and enter login credentails then click on login button
    Then user should navigate to Laptop And Notebook section
    And user should select Laptop as product and click add to cart
    Then user should verify Laptop as product name "HP LP3065" text
    And user should remove Laptop as product from the cart