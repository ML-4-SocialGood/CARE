/** @format */

describe("Stoat Index", () => {
  it("redirects for unauthenticated users", () => {
    cy.visit("/stoats");
    // User should be rerouted to homepage
    cy.contains("AI-Driven Identification").should("be.visible");
    cy.get('[data-cy="sign-in"]').should("have.text", "Sign in");
  });

  it("loads for authenticated users", () => {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
    cy.contains("Stoat Index").click();
    cy.url().should("contain", "/stoats");

    cy.get("h1").should("have.text", "Stoat index");
  });

  it("displays a button to add a new stoat", () => {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
    cy.contains("Stoat Index").click();

    cy.get("[aria-label='Add stoat']").should("be.visible").click();
    cy.url().should("contain", "stoats/new");
  });
});
