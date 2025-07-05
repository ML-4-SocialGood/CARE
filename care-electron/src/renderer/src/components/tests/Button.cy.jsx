/** @format */

import React from "react";
import { Button } from "../Button";

describe("<Button />", () => {
  it("renders", () => {
    cy.mount(<Button />);
  });

  it("uses custom text for the button label", () => {
    cy.mount(<Button>Test</Button>);
    cy.get("button").should("contains.text", "Test");
  });

  it("accepts a primary variant to alter its styling", () => {
    cy.mount(<Button variant="primary">Test</Button>);
    cy.get("button").should("satisfy", ($el) => {
      const classList = Array.from($el[0].classList);
      return classList.includes("button-primary");
    });
  });

  it("accepts a secondary variant to alter its styling", () => {
    cy.mount(<Button variant="secondary">Test</Button>);
    cy.get("button").should("satisfy", ($el) => {
      const classList = Array.from($el[0].classList);
      return classList.includes("button-secondary");
    });
  });

  it("accepts an aria-label for accessibility purposes", () => {
    cy.mount(<Button ariaLabel="Hello">Test</Button>);
    cy.get("[aria-label='Hello']").should("be.visible");
  });

  it("accepts an onClick", () => {
    const onClickSpy = cy.spy().as("onClickSpy");

    cy.mount(
      <Button data-cy="button-test" onClick={onClickSpy}>
        Test
      </Button>
    );
    cy.get("[data-cy=button-test]").click();
    cy.get("@onClickSpy").should("have.been.called");
  });
});
