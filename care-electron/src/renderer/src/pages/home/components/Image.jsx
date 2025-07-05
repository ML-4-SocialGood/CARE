/** @format */

import clsx from "clsx";
import PropTypes from "prop-types";

export function Image({ shape, imageSrc, alt, className }) {
  const imageClass = clsx(
    className,
    shape === "rectangle" && `rectangle-image`,
    shape === "circle" && "circle-image"
  );

  return <img src={imageSrc} alt={alt} className={imageClass} />;
}

Image.propTypes = {
  shape: PropTypes.string,
  imageSrc: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
};
