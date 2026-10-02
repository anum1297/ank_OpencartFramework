#Author: Aniket Ajay Umare

@Opencart
Feature: Address Functionality

Scenario: TC03 Verify address functionality with valid credentials
    Given user launch browser with url
    When user click on signin link and enter login credentails then click on login button
    Then user should verify "My Account" text
    And now user should navigate to address page with help of address link
    Then user should enter all address related details
    And user should save the adress at the end
    Then user should verify save address the "Address Book Entries" text