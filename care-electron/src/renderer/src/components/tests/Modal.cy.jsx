/** @format */

import React from "react";
import Modal from "../Modal";

describe("<Modal />", () => {
  it("renders", () => {
    cy.mount(<Modal />);
  });

  it("accepts and renders its children", () => {
    cy.mount(
      <Modal>
        <h1>Testing</h1>
      </Modal>
    );

    cy.get("h1").should("be.visible").should("have.text", "Testing");
  });

  it("accepts an onCloseClick prop to close the modal", () => {
    const onClickSpy = cy.spy().as("onClickSpy");

    cy.mount(<Modal onCloseClick={onClickSpy} />);

    cy.get("[data-cy=close-modal]").click();
    cy.get("@onClickSpy").should("have.been.called");
  });

  it("accepts an optional classname", () => {
    cy.mount(<Modal className="additional">Sample text</Modal>);
    cy.get(".modal").should("satisfy", ($el) => {
      const classList = Array.from($el[0].classList);
      return classList.includes("additional");
    });
  });
});
