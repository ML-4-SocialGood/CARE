/** @format */
import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import './Nav.css'

import { Link, useLocation } from 'react-router-dom'

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef()
  const location = useLocation()

  const handleClick = () => {
    setMenuOpen(!menuOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        navRef.current &&
        !navRef.current.contains(event.target) &&
        !event.target.closest('.nav__burger')
      ) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      navRef.current?.focus()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const createLinks = () => (
    // TODO: update these links
    <>
      <NavLink
        className={location.pathname === '/upload' ? 'nav__link__anchor-active' : null}
        href="/upload"
        onClick={closeMenu}
      >
        Add Images
      </NavLink>

      <NavLink
        className={location.pathname === '/uploads' ? 'nav__link__anchor-active' : null}
        href="/uploads"
        onClick={closeMenu}
      >
        Image Gallery
      </NavLink>

      <NavLink
        className={location.pathname === '/images' ? 'nav__link__anchor-active' : null}
        href="/images"
        onClick={closeMenu}
      >
        Detection Gallery
      </NavLink>

      <NavLink
        className={location.pathname === '/reid' ? 'nav__link__anchor-active' : null}
        href="/reid"
        onClick={closeMenu}
      >
        ReID Gallery
      </NavLink>

      <div className="vl"></div>

      <DropdownMenu closeMenu={closeMenu}></DropdownMenu>
    </>
  )

  return (
    <>
      <BurgerButton handleClick={handleClick} menuOpen={menuOpen} />
      <nav
        className={clsx(`nav__container`, !menuOpen && `nav__container-closed`)}
        data-menu-open={menuOpen}
        ref={navRef}
      >
        <ul className={clsx('nav__links', 'nav__links--signed-in')}>{createLinks()}</ul>
      </nav>
    </>
  )
}

const DropdownMenu = ({ closeMenu }) => {
  const location = useLocation()
  return (
    <>
      <div className="dropdown">
        <button className="dropdown-button">Navigation</button>
        <div className="dropdown-menu">
          <NavLink
            className={location.pathname === '/' ? 'nav__link__anchor-active' : null}
            href="/"
            onClick={closeMenu}
          >
            Home
          </NavLink>
          <NavLink
            className={location.pathname === '/about' ? 'nav__link__anchor-active' : null}
            href="/about"
            onClick={closeMenu}
          >
            About
          </NavLink>
          <NavLink
            className={location.pathname === '/user-guide' ? 'nav__link__anchor-active' : null}
            href="/user-guide"
            onClick={closeMenu}
          >
            User Guide
          </NavLink>
        </div>
      </div>
    </>
  )
}

const NavLink = ({ isAnchor, href, children, className, onClick }) => {
  const linkClass = clsx('nav__link__anchor', className)

  return (
    <li className="nav__link">
      {isAnchor ? (
        <span
          tabIndex={'0'}
          onClick={() => {
            const el = document.getElementById(href.substring(1))

            if (el) {
              el.scrollIntoView()
            }
            if (onClick) onClick()
          }}
          className={linkClass}
        >
          {children}
        </span>
      ) : (
        <Link to={href} className={linkClass} onClick={onClick}>
          {children}
        </Link>
      )}
    </li>
  )
}

NavLink.propTypes = {
  isAnchor: PropTypes.bool,
  className: PropTypes.string,
  href: PropTypes.string.isRequired,
  children: PropTypes.node,
  onClick: PropTypes.func
}

const BurgerButton = ({ handleClick, menuOpen }) => {
  const openMenuLabel = 'Open and skip to navigation'
  const closeMenuLabel = 'Close and hide navigation'
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
  )
}

BurgerButton.propTypes = {
  handleClick: PropTypes.func,
  menuOpen: PropTypes.bool
}
