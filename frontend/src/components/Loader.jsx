/** @format */
import { Heading } from "./Heading";
import "./loader.css";
import PropTypes from "prop-types";

export default function Loader({ message = "Loading..." }) {
  return (
    <div className="loader-container">
      <span className="loader"></span>
      <Heading className="loader__text" level={3}>
        {message}
      </Heading>
    </div>
  );
}

Loader.propTypes = { message: PropTypes.string };
