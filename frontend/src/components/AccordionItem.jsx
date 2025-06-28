/** @format */

import "./accordionitem.css";
import { useState } from "react";
import PropTypes from "prop-types";

export default function AccordionItem({ buttonText, content }) {
  const [showing, setShowing] = useState(false);
  return (
    <div className="accordion-item">
      <button
        className={`accordion-button ${showing ? "open" : ""}`}
        onClick={() => setShowing(!showing)}
      >
        {buttonText}
      </button>
      {showing && <div className="accordion-content">{content}</div>}
    </div>
  );
}

AccordionItem.propTypes = {
  buttonText: PropTypes.string,
  content: PropTypes.object,
};
