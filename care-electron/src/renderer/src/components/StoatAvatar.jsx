/** @format */
import { Heading } from "./Heading";
import "./stoatAvatar.css";
import clsx from "clsx";

import PropTypes from "prop-types";

export const renderAgeAndSex = (age, sex) => {
  const details = [];
  if (sex) {
    details.push(sex);
  }

  if (age) {
    details.push(`${age}y`);
  }

  return details.join(", ");
};
export default function StoatAvatar({
  isActive,
  imgClass,
  imgLink,
  name,
  age,
  sex,
  withAgeSex,
  onClick,
  hasLongTitle,
}) {
  return (
    <div
      className={clsx(isActive && "avatar__wrapper-active", "avatar__wrapper")}
      onClick={onClick}
      tabIndex={onClick && "0"}
    >
      {imgLink ? (
        <img
          className={clsx("avatar__image", imgClass)}
          loading="lazy"
          src={imgLink}
          alt={name}
        />
      ) : (
        <img
          className={clsx("unassigned-avatar", imgClass, "avatar__image")}
          loading="lazy"
          src={"https://img.icons8.com/ios-filled/200/question-mark.png"}
          alt={"No stoat profile image"}
        />
      )}
      <div className="avatar__text">
        <Heading
          className={clsx(
            "avatar__name",
            hasLongTitle && "avatar__name--small"
          )}
          level={6}
        >
          {name}
        </Heading>

        {withAgeSex && (
          <span className="avatar__extras">
            {withAgeSex ? renderAgeAndSex(age, sex) : ""}
          </span>
        )}
      </div>
    </div>
  );
}

StoatAvatar.propTypes = {
  hasLongTitle: PropTypes.bool,
  isActive: PropTypes.bool,
  imgClass: PropTypes.string,
  imgLink: PropTypes.string,
  name: PropTypes.string,
  age: PropTypes.number,
  sex: PropTypes.string,
  withAgeSex: PropTypes.bool,
  onClick: PropTypes.func,
};
