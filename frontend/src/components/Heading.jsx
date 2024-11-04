/** @format */

import clsx from "clsx";
import PropTypes from "prop-types";
import "./heading.css";

export const Heading = ({ className, level = 3, children }) => {
  const headingClasses = clsx(`heading${level}`, className);
  const HeadingTag = `h${level}`;

  return <HeadingTag className={headingClasses}>{children}</HeadingTag>;
};

Heading.propTypes = {
  className: PropTypes.string,
  level: PropTypes.number,
  children: PropTypes.node,
};
