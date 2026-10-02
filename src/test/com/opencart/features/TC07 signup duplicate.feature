#Author: Aniket Ajay Umare

@Opencart
Feature: SignUp Functionality

Scenario: TC07 Verify signup functionality with duplicate credentials
    Given user launch browser with url
    When user click on signup link
    And user should register once before testing duplicate signup
    And user click on signup button
    Then user should verify signup error message "Warning: E-Mail Address is already registered!"