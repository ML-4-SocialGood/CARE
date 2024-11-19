/** @format */

import { useState, useEffect, useRef } from "react";
import { Heading } from "../../../components/Heading";
import PropTypes from "prop-types";
import clsx from "clsx";
import './FilterConfidence.css';
import {Button} from "../../../components/Button.jsx";

export default function FilterConfidence({ title, filterButton, onValueChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef(null); // Reference to the dropdown container

  const [confLow, setConfLow] = useState('0');
  const [confHigh, setConfHigh] = useState('1');

  const handleReset = () => {
    setConfLow('0');
    setConfHigh('1');
    onValueChange({
      confLow: '0',
      confHigh: '1',
    });
    setIsOpen(false); // Close the dropdown
  }

  const handleSubmit = () => {
    onValueChange({
      confLow,
      confHigh,
    });
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
            "gallery__filter-dropdown confidence__filter-dropdown",
            isOpen && "gallery__filter-dropdown--open",
            isClosing && "gallery__filter-dropdown--closing"
          )}
        >
          <div className="confidence__form">
            <input
                type="number"
                step="0.01"
                min="0"
                max={confHigh}
                value={confLow}
                onChange={(event) => {
                  setConfLow(event.target.value);
                }}
                onBlur={() => {
                  const current = +confLow;
                  if (isNaN(current) || current < 0 || current > 1 || current > +confHigh) {
                    setConfLow('0');
                  } else {
                    setConfLow(`${Math.floor(current * 100) / 100}`);
                  }
                }}
            />
            <span>-</span>
            <input
                type="number"
                step="0.01"
                min={confLow}
                max="1"
                value={confHigh}
                onChange={(event) => {
                  setConfHigh(event.target.value);
                }}
                onBlur={() => {
                  const current = +confHigh;
                  if (isNaN(current) || current < 0 || current > 1 || current < +confLow) {
                    setConfHigh('1');
                  } else {
                    setConfHigh(`${Math.floor(current * 100) / 100}`);
                  }
                }}
            />
          </div>
          <div className="confidence__submit">
            <Button onClick={handleReset}>Reset</Button>
            <Button className="confidence__submit-change" onClick={handleSubmit}>Change</Button>
          </div>
        </div>
        {isOpen ? filterButton : null}
      </div>
    </>
  );
}

FilterConfidence.propTypes = {
  title: PropTypes.string,
  content: PropTypes.node,
  filterButton: PropTypes.node,
  onValueChange: PropTypes.func.isRequired,
};
