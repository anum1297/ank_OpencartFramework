#Author: Aniket Ajay Umare

@Opencart
Feature: SignUp Functionality

Scenario: TC01 Verify signup functionality with valid credentials
    Given user launch browser with url
    When user click on signup link
    And user should enter signup details
    And user click on signup button