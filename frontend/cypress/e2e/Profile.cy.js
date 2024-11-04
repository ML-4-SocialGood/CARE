/** @format */

describe("Profile", () => {
  it("redirects for unauthenticated users", () => {
    cy.visit("/profile");
    // User should be rerouted to homepage
    cy.contains("AI-Driven Identification").should("be.visible");
    cy.get('[data-cy="sign-in"]').should("have.text", "Sign in");
  });

  it("loads for authenticated users", () => {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
    cy.get('[data-cy="profile"]').click();
    cy.url().should("contain", "/profile");

    cy.contains(Cypress.env("auth_username")).should("be.visible");
  });

  it("displays buttons to clear cache, view uploads, and log out for authorised users", () => {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
    cy.get('[data-cy="profile"]').click();
    cy.url().should("contain", "/profile");

    cy.contains("Clear cache").should("be.visible");
    cy.contains("Uploads").should("be.visible");
  });
});
