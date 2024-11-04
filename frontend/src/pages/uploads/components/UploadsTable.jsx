/** @format */
import PropTypes from "prop-types";
import Progress from "../../../components/Progress";
import { formatUploadTimestamp } from "../../../utils/formatUploadTimestamp";
import { Link } from "react-router-dom";
import { getPercentageComplete } from "../../../utils/getPercentageComplete";

export const getEstimatedTime = (seconds) => {
  if (!seconds) {
    return "Estimating...";
  }

  var minutes = Math.round(seconds / 60); // Round to nearest minute
  if (minutes > 1) {
    return minutes + " minutes";
  } else if (minutes == 1) {
    return minutes + " minute";
  } else {
    return "< 1 minute";
  }
};

export default function UploadsTable({ uploads }) {
  return (
    <div className="uploads-scrollable-container">
      <table className="uploads-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>
              <span id="upload-progress-title">Upload progress</span>
            </th>
            <th>Successful images</th>
            <th>Failed images</th>
            <th>Uploaded by</th>
            <th>Estimated time</th>
            <th>View analytics</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((u) => (
            <tr key={u.id}>
              <td>
                {u.uploadDateTime
                  ? formatUploadTimestamp(u.uploadDateTime)
                  : "No date available"}
              </td>
              <td>{u.uploadStatus}</td>
              <td>
                <Progress
                  labelId="upload-progress-title"
                  percentage={getPercentageComplete(
                    u.processedImages,
                    u.totalImagesUploaded
                  )}
                />
              </td>
              <td>{u.successfulImages}</td>
              <td>{u.failedImages}</td>
              <td>{u.uploadUserEmail}</td>
              <td>{getEstimatedTime(u.estimatedTime)}</td>
              <td>
                <Link className="modal__link" to={`/uploads/${u.id}`}>
                  Click to view
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

UploadsTable.propTypes = {
  uploads: PropTypes.array,
};
