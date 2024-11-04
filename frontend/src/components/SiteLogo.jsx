/** @format */

import { Link } from "react-router-dom";
import Logo from "../assets/Logo-cropped.png";
import PropTypes from "prop-types";

export default function SiteLogo({ imageSrc }) {
  return (
    <div className="logo">
      <Link to="/" className="logo__link">
        <img
          src={imageSrc || Logo}
          className="logo__image"
          alt="Te Korowai o Waiheke"
        />
      </Link>
    </div>
  );
}

SiteLogo.propTypes = {
  imageSrc: PropTypes.string,
};
