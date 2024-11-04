/** @format */

import SiteLogo from "./SiteLogo";
import "./footer.css";
import { Button, SignInButton, SignOutButton } from "./Button";
import Logo from "../assets/Logo-cropped.png";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useContext } from "react";
import { AuthContext } from "../hook/auth";

export const Footer = () => {
  //const { isAuthenticated } = useAuth0();
  const{isAuthenticated} = useContext(AuthContext);

  return (
    <div className="footer__background">
      <div className="footer__content">
        <SiteLogo imageSrc={Logo} />
        <ul className="footer__links">
          <Link to="/about" className="footer__link">
            About
          </Link>
          {isAuthenticated ? (
            <Link to="/user-guide" className="footer__link">
              User Guide
            </Link>
          ) : (
            <Link to="/help" className="footer__link">
              Help
            </Link>
          )}
        </ul>
        <div className="footer__actions">
          {isAuthenticated ? (
            <SignOutButton data-cy="sign-out-footer" variant="primary">
              Sign out
            </SignOutButton>
          ) : (
            <>
              <SignInButton
                ariaLabel="Sign in"
                className="nav__link-button"
                data-cy="sign-in-footer"
                variant="primary"
              >
                Sign in
              </SignInButton>
            </>
          )}
        </div>
      </div>
      <div className="line" />
      <div className="copyright">
        Copyright © 2024 Project Care. All rights reserved.
      </div>
    </div>
  );
};
