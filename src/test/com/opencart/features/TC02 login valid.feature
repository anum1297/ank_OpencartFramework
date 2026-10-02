#Author: Aniket Ajay Umare

@Opencart
Feature: Login Functionality

Scenario: TC02 Verify login functionality with valid credentials
    Given user launch browser with url
    When user click on signin link and enter login credentails then click on login button
    Then user should verify "My Account" text