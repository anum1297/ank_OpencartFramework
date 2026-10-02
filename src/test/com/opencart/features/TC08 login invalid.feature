#Author: Aniket Ajay Umare

@Opencart
Feature: Login Functionality

Scenario: TC08 Verify login functionality with invalid credentials
    Given user launch browser with url
    When user click on signin link and enter invalid login credentails then click on login button
    Then user should verify invalid login warning text