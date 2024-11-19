/** @format */

import { useState, useEffect, useRef } from "react";
import { Heading } from "../../../components/Heading";
import PropTypes from "prop-types";
import clsx from "clsx";
import "./FilterDropdown.css";

export default function FilterDropdown({ title, content, filterButton, onItemSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef(null); // Reference to the dropdown container

  const handleItemClick = (item) => {
    onItemSelect(item);
    setIsOpen(false); // Close the dropdown
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup the event listener on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div className="galley__dropdown" ref={dropdownRef}>
        <div
          className={clsx(
            "gallery__filter-heading-link",
            "gallery__filter-dropdown-toggle",
            isOpen && "gallery__filter-dropdown-toggle--open"
          )}
          tabIndex="0"
          onClick={() => {
            // if the dropdown is closing, schedule an animation to close it
            if (isOpen) {
              setIsClosing(true);
              setTimeout(() => {
                setIsClosing(false);
              }, 500);
            }
            setIsOpen(!isOpen);
          }}
        >
          <Heading
            className={clsx(
              "gallery__filter-heading",
              isOpen && "gallery__filter-heading-active"
            )}
            level={5}
          >
            {title}
          </Heading>
        </div>
        <div
          className={clsx(
            "gallery__filter-dropdown",
            isOpen && "gallery__filter-dropdown--open",
            isClosing && "gallery__filter-dropdown--closing"
          )}
        >
          {Array.isArray(content) &&
            content.map((str, index) => (
              <a key={index} onClick={() => handleItemClick(str)}>
                {str}
              </a>
            ))}
        </div>
        {isOpen ? filterButton : null}
      </div>
    </>
  );
}

FilterDropdown.propTypes = {
  title: PropTypes.string,
  content: PropTypes.node,
  filterButton: PropTypes.node,
  onItemSelect: PropTypes.func.isRequired,
};
