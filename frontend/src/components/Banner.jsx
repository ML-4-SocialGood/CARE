/** @format */
import { Button } from "./Button";
import "./banner.css";
import PropTypes from "prop-types";
import closeIcon from "../assets/close.png";
import React from "react";
import clsx from "clsx";

export default function Banner({ message, onDismiss, status, style }) {
  // TO DO: This should come with an aria-live region
  const [showBanner, setShowBanner] = React.useState(true);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const bannerClass = clsx(
    "banner",
    isAnimating && "banner--is-animating",
    status === "error" && "banner--error",
    status === "success" && "banner--success"
  );

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
