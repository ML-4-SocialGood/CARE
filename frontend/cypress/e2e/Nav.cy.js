/** @format */

describe("Navigation bar", () => {
  it("should show a sign in button if the user is not signed in", () => {
    cy.visit("/");
    cy.get('[data-cy="sign-in"]').should("have.text", "Sign in");
  });
});

describe("Signed in navigation bar", () => {
  beforeEach(function () {
    cy.loginToAuth0(Cypress.env("auth_username"), Cypress.env("auth_password"));
  });

  it("shows a button for the user profile", function () {
    cy.get('[data-cy="profile"]').should("be.visible");
  });

  it("contains a link to the Image Uploader", function () {
    const imageUploadLink = cy.contains("Image Uploader");
    imageUploadLink.should("be.visible");
    imageUploadLink.click();
    cy.url().should("contain", "/upload");
  });

  it("contains a link to the Stoat Index", function () {
    const stoatLink = cy.contains("Stoat Index");
    stoatLink.should("be.visible");
    stoatLink.click();
    cy.url().should("contain", "/stoats");
  });

  it("contains a link to Uploads", function () {
    const uploadLink = cy.contains("Uploads");
    uploadLink.should("be.visible");
    uploadLink.click();
    cy.url().should("contain", "/uploads");
  });

  it("contains a link to the Result Gallery", function () {
    const galleryLink = cy.contains("Result Gallery");
    galleryLink.should("be.visible");
    galleryLink.click();
    cy.url().should("contain", "/images");
  });

  it("collapses to a dropdown menu on mobile", function () {
    cy.viewport("iphone-8");
    cy.get('[data-cy="mobile-menu"]').should("be.visible");
    cy.contains("Image Uploader").should("not.be.visible");
    cy.get('[data-cy="mobile-menu"]').click();
    cy.contains("Image Uploader").should("be.visible");
  });
});
