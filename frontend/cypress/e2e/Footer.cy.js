/** @format */

describe("Footer", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should show a sign in button if the user is not signed in", () => {
    cy.get('[data-cy="sign-in-footer"]').should("have.text", "Sign in");
  });

  it("should link to the About page", () => {
    cy.contains("About").should("be.visible");
    cy.contains("About").click();
    cy.url().should("include", "/about");
  });
});

describe("Signed out footer", () => {
  it("should contain a link to the Help page if the user is signed in", function () {
    cy.visit("/");
    cy.contains("Help").should("be.visible");
    cy.contains("Help").click();
    cy.url().should("include", "/help");
  });
});

describe("Signed in footer", () => {
  beforeEach(function () {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
  });

  it("shows a button to sign out", function () {
    const footer = cy.get('[data-cy="sign-out-footer"]');
    footer.should("be.visible");
    footer.should("have.text", "Sign out");
  });

  it("should contain a link to the User Guide if the user is signed in", () => {
    cy.contains("User Guide").should("be.visible");
    cy.contains("User Guide").click();
    cy.url().should("include", "/user-guide");
  });
});
