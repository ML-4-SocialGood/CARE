/** @format */

describe("Bulk uploader", () => {
  it("redirects for unauthenticated users", () => {
    cy.visit("/upload");
    // User should be rerouted to homepage
    cy.contains("AI-Driven Identification").should("be.visible");
    cy.get('[data-cy="sign-in"]').should("have.text", "Sign in");
  });

  it("loads for authenticated users", () => {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
    cy.contains("Image Uploader").click();
    cy.url().should("contain", "/upload");

    cy.contains("Upload images").should("be.visible");
  });

  it("should display an option to bulk upload images", () => {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
    cy.contains("Image Uploader").click();

    cy.contains("Drag and drop files").should("be.visible");
    cy.contains("click to add").should("be.visible").click();

    cy.get('input[type="file"]').as("fileInput");
  });

  it("file input should accept image uploads", () => {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
    cy.contains("Image Uploader").click();

    cy.get('input[type="file"]').as("fileInput");

    cy.get("@fileInput").selectFile(
      {
        contents: "cypress/fixtures/close.png",
        fileName: "example.png",
        mimeType: "image/png",
        action: "drag-drop",
      },
      { force: true }
    );

    cy.contains("example.png");
    cy.get("[aria-label='Remove file example.png']").should("be.visible");
  });
});
