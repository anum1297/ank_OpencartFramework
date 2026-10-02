#Author: Aniket Ajay Umare

@Opencart
Feature: Logout Functionality

Scenario: TC04 Verify Logout functionality
    Given user launch browser with url
    When user click on signin link and enter login credentails then click on login button
    And user click on logout link
    Then user should verify "Account Logout" text and click on continue