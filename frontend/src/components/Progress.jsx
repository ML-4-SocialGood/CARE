/** @format */
import PropTypes from "prop-types";
import "./progress.css";

export default function Progress({ labelId, percentage }) {
  return (
    <div className="progress-wrapper">
      <progress
        aria-labelledby={labelId}
        className="progress"
        value={percentage}
        max="100"
      >
        {percentage}%
      </progress>
      <span className="progress-amount">{percentage}%</span>
    </div>
  );
}

Progress.propTypes = {
  labelId: PropTypes.string.isRequired,
  percentage: PropTypes.number.isRequired,
};
