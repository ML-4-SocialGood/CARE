/** @format */

function loginViaAuth0Ui(username, password) {
  // App landing page redirects to Auth0.
  cy.visit("/");

  cy.get('[data-cy="sign-in"]').click((button) => {
    console.log(cy.get("#username"));
  });

  cy.origin(
    Cypress.env("auth_audience"),
    { args: { username, password } },
    ({ username, password }) => {
      cy.get("input#username").type(username);
      cy.get("input#password").type(password, { log: false });
      cy.contains("button[value=default]", "Continue").click();
    }
  );

  // Ensure Auth0 has redirected us back to the RWA.
  cy.url().should("equal", "http://localhost:5173/");
}

Cypress.Commands.add("loginToAuth0", (username, password) => {
  const log = Cypress.log({
    displayName: "AUTH0 LOGIN",
    message: [`🔐 Authenticating | ${username}`],
    // @ts-ignore
    autoEnd: false,
  });
  log.snapshot("before");

  loginViaAuth0Ui(username, password);

  log.snapshot("after");
  log.end();
});
