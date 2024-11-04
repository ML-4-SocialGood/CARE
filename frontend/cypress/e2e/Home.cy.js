/** @format */

describe("Home page", () => {
  it("successfully loads", () => {
    cy.visit("/");
  });

  it("Get Started redirects the user to Auth0", () => {
    cy.visit("/");
    cy.get("[data-cy='hero-sign-in']")
      .should("have.text", "Get started")
      .click();
  });
});
