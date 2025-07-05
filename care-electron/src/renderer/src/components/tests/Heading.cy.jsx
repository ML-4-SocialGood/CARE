/** @format */

import React from "react";
import { Heading } from "../Heading";

describe("<Heading />", () => {
  it("renders", () => {
    cy.mount(<Heading />);
  });

  it("accepts and renders custom text", () => {
    cy.mount(<Heading>Sample text</Heading>);

    cy.contains("Sample text").should("be.visible");
  });

  it("accepts a level prop to change the rendered tag", () => {
    cy.mount(<Heading level={3}>Sample text</Heading>);

    cy.get("h3").should("have.text", "Sample text");
  });

  it("accepts an optional classname", () => {
    cy.mount(<Heading className="additional">Sample text</Heading>);
    cy.get("h3").should("satisfy", ($el) => {
      const classList = Array.from($el[0].classList);
      return classList.includes("heading3") && classList.includes("additional");
    });
  });
});
