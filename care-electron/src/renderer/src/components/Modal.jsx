/** @format */

import clsx from "clsx";
import PropTypes from "prop-types";
import "./modal.css";
import closeIconWhite from "../assets/closewhite.png";
import { Button } from "./Button";
import {useEffect} from "react";

export default function Modal({show, className, children, onCloseClick }) {
    useEffect(() => {
        const modal = document.querySelector(`.${className}`);
        if (show) {
            modal.classList.add("show");
        } else {
            modal.classList.remove("show");
        }
    }, [show, className]);
    return (
    <div className={clsx("modal", className)}>
      <Button className="modal__close-button" onClick={onCloseClick}>
        <img
          alt="Close modal"
          className="modal__close-icon"
          data-cy="close-modal"
          src={closeIconWhite}
        />
      </Button>
      {children}
    </div>
  );
}

Modal.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  onCloseClick: PropTypes.func,
};
