/** @format */
import { Button } from "./Button";
import "./banner.css";
import PropTypes from "prop-types";
import closeIcon from "../assets/close.png";
import React from "react";
import clsx from "clsx";

export default function Banner({ message, onDismiss, status, style }) {
  const [showBanner, setShowBanner] = React.useState(true);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const bannerClass = clsx(
    "banner",
    isAnimating && "banner--is-animating",
    status === "error" && "banner--error",
    status === "success" && "banner--success"
  );

  // Automatically close the banner after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setShowBanner(false);
        onDismiss();
      }, 250);
    }, 2000);

    // Clear the timer if the banner is dismissed manually
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return !showBanner || !message || !message?.length ? null : (
    <div className={bannerClass} style={style}>
      <div className="banner__content">{message}</div>
      <Button
        className="banner__dismiss"
        onClick={() => {
          setIsAnimating(true);
          setTimeout(() => {
            setIsAnimating(false);
            setShowBanner(false);
            onDismiss();
          }, 250);
        }}
      >
        <img
          alt="Dismiss banner"
          className="banner__close-icon"
          src={closeIcon}
        />
      </Button>
    </div>
  );
}

Banner.propTypes = {
  message: PropTypes.string,
  onDismiss: PropTypes.func,
  status: PropTypes.oneOf(["error", "success"]),
  style: PropTypes.object,
};
