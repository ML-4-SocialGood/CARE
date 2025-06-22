/** @format */

import React, { useContext, useEffect } from "react";
import PropTypes from "prop-types";
import "./button.css";
import clsx from "clsx";
import { useAuth0 } from "@auth0/auth0-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@renderer/components/auth";

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

export function SignInButton({ className, children, ...props }) {
  const { loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  return (
    <Button
      className={className}
      //onClick={() => loginWithRedirect()}
      onClick={() => navigate("/signin")}
      {...props}
    >
      {children}
    </Button>
  );
}

SignInButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export const SignOutButton = ({ className, children, ...props }) => {
  //const { logout } = useAuth0();
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  return (
    <Button
      className={className}
      onClick={() =>
        //logout({ logoutParams: { returnTo: window.location.origin } })
        {
          authContext.setAuthenticated(false);
          navigate("/");
        }

      }
      {...props}
    >
      {children}
    </Button>
  );
};

SignOutButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
