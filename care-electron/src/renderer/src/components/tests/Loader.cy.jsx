/** @format */

import React from "react";
import Loader from "../Loader";

describe("<Heading />", () => {
  it("renders", () => {
    cy.mount(<Loader />);
  });

  it("accepts and renders a different message", () => {
    cy.mount(<Loader message="I'm loading..." />);

    cy.contains("I'm loading").should("be.visible");
  });

  it("displays an animated loader", () => {
    cy.mount(<Loader />);

    cy.get("span.loader").should("be.visible");
  });
});
