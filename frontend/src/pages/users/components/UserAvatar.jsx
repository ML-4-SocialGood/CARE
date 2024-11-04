/** @format */
import PropTypes from "prop-types";
import { useState } from "react";

export default function UserAvatar({ email, initial, onClick }) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      tabIndex="0"
      className="user-avatar"
      onClick={onClick}
      onMouseOver={() => {
        setIsHovering(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
    >
      {initial}
      {isHovering ? <div className="user-preview">{email}</div> : null}
    </div>
  );
}

UserAvatar.propTypes = {
  email: PropTypes.string.isRequired,
  initial: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};
