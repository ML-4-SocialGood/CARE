/** @format */
/** @format */

import { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@renderer/components/Button";
import clsx from "clsx";
import { useAuth0 } from "@auth0/auth0-react";
import { useDispatch, useSelector } from "react-redux";
import { getAllStoats } from "@renderer/features/stoat/stoatSlice";
import {
  add_message,
  bannerStatuses,
} from "@renderer/features/banner/bannerSlice";
import {
  assignImageToStoat,
  imageStatuses,
} from "@renderer/features/image/imageSlice";

export default function StoatAssignmentList({ imageId, onCloseClick }) {
  const { getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();
  const [assignedStoat, setAssignedStoat] = useState(null);

  const assignmentStatus = useSelector((state) => state.images.status);
  const assignmentError = useSelector((state) => state.images.error);

  const stoats = useSelector((state) => getAllStoats(state));

  return (
    <>
      <div className="stoat-list">
        {stoats.map((stoat) => (
          <Button
            key={`${stoat.id}-modal-view`}
            onClick={() => {
              setAssignedStoat(stoat);
            }}
            className={clsx(
              assignedStoat?.id === stoat.id && `button--selected`
            )}
            variant="primary"
          >
            {stoat.name}
          </Button>
        ))}
      </div>
      <Button
        className="modal-patch-image"
        variant="secondary"
        onClick={async () => {
          if (!assignedStoat) {
            return;
          }

          try {
            const accessToken = await getAccessTokenSilently({
              authorizationParams: {
                audience: `https://projectcare/api`,
              },
            });

            const result = await dispatch(
              assignImageToStoat({
                accessToken: accessToken,
                imageId: imageId,
                stoatId: assignedStoat.id,
              })
            );
            if (assignmentStatus === imageStatuses.assignmentError) {
              throw new Error(assignmentError);
            }

            if (result.payload.responseStatus === 200) {
              dispatch(
                add_message({
                  message: "Image reassigned successfully.",
                  status: bannerStatuses.success,
                })
              );
              onCloseClick();
            } else {
              throw new Error();
            }
          } catch (err) {
            console.error(err);

            dispatch(
              add_message({
                message:
                  "Stoat could not be reassigned. Detailed logging is available in the console. Please contact a developer for more information.",
                status: bannerStatuses.error,
              })
            );
          }
        }}
      >
        Assign
      </Button>
    </>
  );
}

StoatAssignmentList.propTypes = {
  imageId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCloseClick: PropTypes.func,
};
