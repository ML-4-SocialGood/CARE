/** @format */

describe("Uploads", () => {
  it("redirects for unauthenticated users", () => {
    cy.visit("/uploads");
    // User should be rerouted to homepage
    cy.contains("AI-Driven Identification").should("be.visible");
    cy.get('[data-cy="sign-in"]').should("have.text", "Sign in");
  });

  it("loads for authenticated users", () => {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
    cy.contains("Uploads").click();
    cy.url().should("contain", "/uploads");

    cy.get("h1").should("have.text", "Uploads");
    // We aren't stubbing any content, so there should be no data displayed
    cy.contains("No uploads found").should("be.visible");
  });
});
