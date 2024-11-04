/** @format */

import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useParams } from "react-router-dom";
import "./uploadpage.css";
import { Heading } from "../../components/Heading";
import { useEffect } from "react";
import StoatAvatar from "../../components/StoatAvatar";
import { Button } from "../../components/Button";
import Progress from "../../components/Progress";
import { getPercentageComplete } from "../../utils/getPercentageComplete";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStatuses,
  fetchUploadById,
  getUploadById,
} from "../../../features/upload/uploadSlice";
import { getAllStoats } from "../../../features/stoat/stoatSlice";
import {
  add_message,
  bannerStatuses,
} from "../../../features/banner/bannerSlice";
import { getEstimatedTime } from "./components/UploadsTable";

const countKnownStoats = (uploadResults) => {
  if (!uploadResults) {
    return;
  }

  return Object.keys(uploadResults).filter(
    (stoatId) => stoatId.toLowerCase() !== "unknown"
  ).length;
};

const countTotalImagesWithStoats = (uploadResults) => {
  if (!uploadResults) {
    return;
  }

  return Object.keys(uploadResults).reduce((acc, currentKey) => {
    if (isNaN(parseInt(currentKey))) {
      return acc + 0;
    }

    return acc + uploadResults[currentKey];
  }, 0);
};

const countNoStoatImages = (uploadResults) => {
  if (!uploadResults) {
    return;
  }

  return uploadResults["Unknown"] || 0;
};

const countUnknownStoats = (uploadResults) => {
  return uploadResults["0"];
};

const renderGroupingResults = (groupingResults, stoats) => {
  function getGroupCount(num) {
    return num == 1 ? `${num} image` : `${num} images`;
  }
  return (
    <div className="groupings">
      <Heading className="analytics-subheading" level={4}>
        Your upload contained images with no stoat assignment.
      </Heading>
      <p className="groupings-description">
        The AI model was able to group these images by unknown stoat by
        comparing the stoat against all images in the database.
      </p>

      <div className="all-groups">
        {Object.keys(groupingResults).map((groupId, index) => (
          <div key={`${groupId}-group`} className="upload-result">
            <StoatAvatar
              name={`Group ${index + 1}`}
              imgLink={
                "https://img.icons8.com/ios-filled/200/question-mark.png"
              }
              imgClass={"unassigned-avatar unknown-stoat"}
            />
            <div className="group-analytics">
              {getGroupCount(groupingResults[groupId])} added to group
            </div>
            <Button
              isLink
              className="group-button"
              href={`/images?groupId=${groupId}`}
              variant="primary"
            >
              View all images in group
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const renderUploadResults = (uploadResults, stoats, uploadId) => {
  if (!uploadResults) {
    return;
  }

  const generateStoatString = (value) =>
    value == 1 ? `${value} image` : `${value} images`;

  return (
    <div className="upload-results">
      {Object.keys(uploadResults).map((key) => {
        if (key.toLowerCase() === "unknown") {
          return (
            <div key="unknown" className="upload-result">
              <StoatAvatar
                hasLongTitle
                name="No stoats detected"
                imgClass="unassigned-avatar"
                imgLink={
                  "https://img.icons8.com/ios-filled/200/question-mark.png"
                }
              />
              <div className="stoat-analytics">
                <div>
                  {uploadResults[key]
                    ? `AI: ${uploadResults[key]} image(s)`
                    : null}
                </div>
              </div>
              <Button
                variant="primary"
                isLink
                href={`/images?stoatId=Unknown&uploadId=${uploadId}`}
              >
                View images
              </Button>
            </div>
          );
        } else {
          const stoat = stoats.find((s) => s.id == key);

          return stoat ? (
            <div key={`uploadResult-${stoat.id}`} className="upload-result">
              <StoatAvatar
                name={stoat.name}
                imgLink={stoat.profileImg}
                imgClass={
                  stoat.id == 0 ? "unassigned-avatar unknown-stoat" : null
                }
              />
              <div className="stoat-analytics">
                <div>
                  {uploadResults[key]
                    ? `AI: ${generateStoatString(uploadResults[key])}`
                    : null}
                </div>
              </div>
              <Button
                isLink
                href={`/images?stoatId=${stoat.id}&uploadId=${uploadId}`}
                variant="primary"
              >
                {stoat.id == 0 ? "View all unassigned" : "View images"}
              </Button>
            </div>
          ) : null;
        }
      })}
    </div>
  );
};

/** @format */
export default function UploadPage() {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { uploadId } = useParams();

  const dispatch = useDispatch();

  const uploadsStatus = useSelector((state) => state.uploads.status);
  const errorMessage = useSelector((state) => state.uploads.error);

  const upload = useSelector((state) => getUploadById(state, uploadId));
  const stoats = useSelector((state) => getAllStoats(state));

  // Keep updating the upload as needed by getting the user to fetch it if they're viewing the upload page
  useEffect(() => {
    // if (upload.uploadStatus === "complete") {
    //   return;
    // }

    async function fetchUpload() {
      if (!uploadId) {
        return;
      }

      try {
        const accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: `https://projectcare/api`,
          },
        });

        dispatch(
          fetchUploadById({
            accessToken: accessToken,
            uploadId: uploadId,
            imagesToFetch: upload.imagesToFetch,
            lastProcessedImageId: upload.lastProcessedImageId,
          })
        );

        if (uploadsStatus === fetchStatuses.failed) {
          console.error(errorMessage);
          dispatch(
            add_message({
              message:
                "Something went wrong getting upload information. Please contact a developer for further assistance.",
              status: bannerStatuses.error,
            })
          );
        }
      } catch (err) {
        console.error(err);
        dispatch(
          add_message({
            message:
              "Something went wrong getting upload information. Please contact a developer for further assistance.",
            status: bannerStatuses.error,
          })
        );
      }
    }

    fetchUpload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/" replace={true} />;
  }

  if (!upload) {
    return (
      <div className="images__container">
        Upload not found. Are you sure you have formatted your request
        correctly?
      </div>
    );
  }

  return (
    <div className="analytics-wrapper">
      <Heading className="analytics-heading" level={1}>
        Upload results
      </Heading>
      {upload ? (
        <>
          <div className="analytics-status">
            <span>Status: {upload.uploadStatus}</span>
            <Progress
              labelId="upload-progress-title"
              percentage={getPercentageComplete(
                upload.processedImages,
                upload.totalImagesUploaded
              )}
            />
          </div>
          <div className="analytics-time">
            <span>
              Estimated time: {getEstimatedTime(upload.estimatedTime)}
            </span>
          </div>
        </>
      ) : null}

      {upload?.uploadStatus !== "initiated" && upload?.uploadResults ? (
        <>
          <Heading className="analytics-subheading" level={4}>
            Out of&nbsp;
            <span className="analytics-subheading--stronger">
              {upload.successfulImages}
            </span>
            &nbsp; processed images, AI detected that&nbsp;
            {countTotalImagesWithStoats(upload.uploadResults)} contained stoats.
          </Heading>
          {countNoStoatImages(upload.uploadResults) > 0 ? (
            <p>
              Warning: stoats were not detected in{" "}
              {countNoStoatImages(upload.uploadResults)} image(s). Please
              manually verify and reassign if needed.
            </p>
          ) : null}
          {countUnknownStoats(upload.uploadResults) > 0 ? (
            <p>
              Warning: stoats were detected but could not be identified in&nbsp;
              {countUnknownStoats(upload.uploadResults)} image(s). Please
              manually verify and reassign if needed.
            </p>
          ) : null}
          <p>
            <em>Please note</em>: this information reflects findings from AI
            processing and may be out-of-date if images have been manually
            reassigned.
          </p>
          {renderUploadResults(upload.uploadResults, stoats, upload.id)}
        </>
      ) : null}
      {upload?.uploadStatus !== "initiated" &&
      Object.keys(upload.groupingResults).length > 0
        ? renderGroupingResults(upload.groupingResults, stoats)
        : null}
    </div>
  );
}
