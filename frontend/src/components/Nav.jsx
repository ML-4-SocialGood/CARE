/** @format */
import { useState, useEffect, useRef ,useContext} from "react";
import PropTypes from "prop-types";
import { SignOutButton, Button, SignInButton } from "./Button";
import clsx from "clsx";
import "./Nav.css";
import userAvatar from "../assets/user.png";

import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { AuthContext } from "../hook/auth";

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef();
  const location = useLocation();
  //const { isAuthenticated, isLoading } = useAuth0();
  const {isAuthenticated} = useContext(AuthContext);

  const handleClick = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    if (menuOpen) {
      navRef.current?.focus();
    }
  }, [menuOpen]);

  const createLinks = () =>
    // TODO: update these links
    isAuthenticated ? (
      <>
        <NavLink
          className={
            location.pathname === "/upload" ? "nav__link__anchor-active" : null
          }
          href="/upload"
        >
          Image Uploader
        </NavLink>

        {/* <NavLink
          className={
            location.pathname === "/stoats" ? "nav__link__anchor-active" : null
          }
          href="/stoats"
        >
          Stoat Index
        </NavLink> */}

        <NavLink
          className={
            location.pathname === "/uploads" ? "nav__link__anchor-active" : null
          }
          href="/uploads"
        >
          Image Gallery
        </NavLink>

        <NavLink
          className={
            location.pathname === "/images" ? "nav__link__anchor-active" : null
          }
          href="/images"
        >
          Detection Gallery
        </NavLink>

        <NavLink
            className={
                location.pathname === "/reid" ? "nav__link__anchor-active" : null
            }
            href="/reid"
        >
            ReID Gallery
        </NavLink>

        <div className="vl">
        </div>

        <DropdownMenu>
        </DropdownMenu>

        <Button
          ariaLabel="Profile"
          data-cy="profile"
          className="nav__link-profile"
          variant="primary"
          isLink
          href="/profile"
        >
          <img
            src={userAvatar}
            alt="User"
            className="nav__link-profile__icon"
          />
        </Button>
        {/* <SignOutButton>Sign Out</SignOutButton> */}
      </>
    ) : (
      <>
        {/* <NavLink isAnchor href="#whoweare">
          Who we are
        </NavLink> */}
        {/* <NavLink isAnchor href="#whycare">
          Why choose CARE?
        </NavLink> */}

        <DropdownMenu>
        </DropdownMenu>

        <SignInButton
          ariaLabel="Sign in"
          className="nav__link-button"
          variant="primary"
          data-cy="sign-in"
        >
          Sign in
        </SignInButton>
      </>
    );

  return (
    <>
      <BurgerButton handleClick={handleClick} menuOpen={menuOpen} />
      <nav
        className={clsx(`nav__container`, !menuOpen && `nav__container-closed`)}
        data-menu-open={menuOpen}
        ref={navRef}
      >
        <ul
          className={clsx(
            "nav__links",
            isAuthenticated && "nav__links--signed-in"
          )}
        >
          { createLinks()}
        </ul>
      </nav>
    </>
  );
}

const DropdownMenu = () => {
  const location = useLocation();
  const {isAuthenticated} = useContext(AuthContext);

  const createLinks = () =>
    isAuthenticated ? (
      <>
        <div className="dropdown">
          <button className="dropdown-button">
            Navigation
          </button>
            <div className="dropdown-menu">
                <NavLink className={
                  location.pathname === "/" ? "nav__link__anchor-active" : null
                }
                href = "/"
                >
                  Home
                </NavLink>
                <NavLink className={
                  location.pathname === "/about" ? "nav__link__anchor-active" : null
                }
                href = "/about"
                >
                  About
                </NavLink>
                {/* <NavLink className={
                  location.pathname === "/help" ? "nav__link__anchor-active" : null
                }
                href = "/help"
                >
                  Help
                </NavLink> */}
                <NavLink className={
                  location.pathname === "/user-guide" ? "nav__link__anchor-active" : null
                }
                href = "/user-guide"
                >
                  User Guide
                </NavLink>
            </div>
        </div>
      </>
    ) : (
      <>
        <div className="dropdown">
          <button className="dropdown-button">
            Navigation
          </button>
            <div className="dropdown-menu">
                <NavLink className={
                  location.pathname === "/" ? "nav__link__anchor-active" : null
                }
                href = "/"
                >
                  Home
                </NavLink>
                <NavLink className={
                  location.pathname === "/about" ? "nav__link__anchor-active" : null
                }
                href="/about">
                  About
                </NavLink>
                {/* <NavLink className={
                  location.pathname === "/help" ? "nav__link__anchor-active" : null
                }
                href="/help">
                  Help
                </NavLink> */}
            </div>
        </div>
      </>
    );
  
    return (
      <>
        {createLinks()}
      </>
    );
};

const NavLink = ({ isAnchor, href, children, className }) => {
  const linkClass = clsx("nav__link__anchor", className);

  return (
    <li className="nav__link">
      {isAnchor ? (
        <span
          tabIndex={"0"}
          onClick={() => {
            const el = document.getElementById(href.substring(1));

            if (el) {
              el.scrollIntoView();
            }
          }}
          className={linkClass}
        >
          {children}
        </span>
      ) : (
        <Link to={href} className={linkClass}>
          {children}
        </Link>
      )}
    </li>
  );
};

NavLink.propTypes = {
  isAnchor: PropTypes.bool,
  className: PropTypes.string,
  href: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const BurgerButton = ({ handleClick, menuOpen }) => {
  const openMenuLabel = "Open and skip to navigation";
  const closeMenuLabel = "Close and hide navigation";
  return (
    <button
      role="button"
      aria-expanded={menuOpen}
      aria-controls="id-nav"
      aria-label={menuOpen ? closeMenuLabel : openMenuLabel}
      className={menuOpen ? `nav__burger nav__burger-close` : `nav__burger`}
      data-cy="mobile-menu"
      onClick={handleClick}
    >
      <div className="nav__burger__line" />
      <div className="nav__burger__line" />
      <div className="nav__burger__line" />
    </button>
  );
};

BurgerButton.propTypes = {
  handleClick: PropTypes.func,
  menuOpen: PropTypes.bool,
};
