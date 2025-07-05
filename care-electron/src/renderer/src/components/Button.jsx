/** @format */

import PropTypes from "prop-types";
import "./button.css";
import clsx from "clsx";
import { Link } from "react-router-dom";

export function Button({
  variant = "none",
  className,
  children,
  isLink,
  href,
  ariaLabel,
  onClick,
  ...props
}) {
  const buttonClass = clsx(
    className,
    "button",
    variant === "secondary" && `button-secondary`,
    variant === "primary" && "button-primary"
  );

  return isLink ? (
    <Link className={buttonClass} to={href} onClick={onClick} {...props}>
      {children}
    </Link>
  ) : (
    <button
      className={buttonClass}
      aria-label={ariaLabel}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  href: PropTypes.string,
  isLink: PropTypes.bool,
  children: PropTypes.node,
  variant: PropTypes.string, // primary or secondary
  onClick: PropTypes.func,
};
