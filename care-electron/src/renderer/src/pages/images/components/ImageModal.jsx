/** @format */

import { useCallback, useState } from "react";
import Modal from "@renderer/components/Modal";
import { Heading } from "@renderer/components/Heading";
import PropTypes from "prop-types";
import { formatUploadTimestamp } from "@renderer/utils/formatUploadTimestamp";
import { Link } from "react-router-dom";
import { Button } from "@renderer/components/Button";
import clsx from "clsx";
import { useAuth0 } from "@auth0/auth0-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllStoats,
  getStoatById,
} from "@renderer/features/stoat/stoatSlice";
import { fetchStatuses } from "@renderer/features/upload/uploadSlice";
import {
  add_message,
  bannerStatuses,
} from "@renderer/features/banner/bannerSlice";
import {
  assignImageToStoat,
  imageStatuses,
} from "@renderer/features/image/imageSlice";
import StoatAssignmentList from "./StoatAssignmentList";

export default function ImageModal({ image, onCloseClick, onDeleteImage }) {
  const [boundingBox, setBoundingBox] = useState(false);
  const [modalView, setModalView] = useState("stoat");

  const dispatch = useDispatch();

  const stoat = useSelector((state) => getStoatById(state, image.stoatId));
  const deleteImagesStatus = useSelector((state) => state.images.status);
  const deleteImagesErrorMessage = useSelector((state) => state.images.error);

  const generateModalContent = useCallback(() => {
    if (modalView === "stoat") {
      return (
        <>
          <div className="modal__image-description__item">
            <Heading level={5} className="modal__image-description__item-label">
              Date taken
            </Heading>
            <span>
              {image.date ? formatUploadTimestamp(image.date) : "No data"}
            </span>
          </div>

          <div className="modal__image-description__item">
            <Heading level={5} className="modal__image-description__item-label">
              Featured stoat
            </Heading>
            <span>
              {stoat ? (
                <Link className="modal__link" to={`/stoats/${stoat.id}`}>
                  {stoat.name}
                </Link>
              ) : image.stoatId === 0 ? (
                "Unassigned"
              ) : (
                "No stoat detected"
              )}
            </span>
          </div>
          {image.presignedBbUrl && (
            <>
              <Heading
                id="stoat-toggle-label"
                level={5}
                className="modal__image-description__item-label"
              >
                View bounding box
              </Heading>
              <label className="gallery__switch">
                <input
                  aria-labelledby="stoat-toggle-label"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBoundingBox(true);
                    } else {
                      setBoundingBox(false);
                    }
                  }}
                  className="gallery__switch__input"
                  type="checkbox"
                />
                <span className="gallery__switch__slider-round round" />
              </label>
            </>
          )}
          <div className="modal-actions">
            <Button
              className="modal-reassign"
              variant="secondary"
              onClick={() => {
                setModalView("reassign");
              }}
            >
              Assign image to different stoat
            </Button>

            <Button
              variant="primary"
              className="modal-reassign"
              onClick={() => {
                setModalView("delete-confirmation");
              }}
            >
              Delete image
            </Button>
          </div>
        </>
      );
    }

    if (modalView === "reassign") {
      return (
        <StoatAssignmentList imageId={image.id} onCloseClick={onCloseClick} />
      );
    }
  }, [
    modalView,
    image.captureDate,
    image.location,
    image.stoatId,
    image.presignedBbUrl,
    image.id,
    stoat,
    onCloseClick,
  ]);

  return (
    <Modal
      className={clsx(
        "uploader-modal",
        modalView === "delete-confirmation" && "deleting-modal"
      )}
      onCloseClick={onCloseClick}
    >
      {(modalView === "delete-confirmation" || modalView === "reassign") && (
        <Button
          className="button--return"
          onClick={() => {
            setModalView("stoat");
          }}
        >
          Go back
        </Button>
      )}

      {modalView === "delete-confirmation" && (
        <div>
          <Heading level={2}>Are you sure?</Heading>
          <span className="warning-text">This action cannot be undone.</span>
          <div className="delete-actions">
            <Button
              onClick={async () => {
                const deleteRes = await onDeleteImage(image.id);

                if (deleteRes.payload.responseStatus === 204) {
                  dispatch(
                    add_message({
                      message: "Image deleted successfully.",
                      status: bannerStatuses.success,
                    })
                  );
                } else {
                  dispatch(
                    add_message({
                      message:
                        "This image could not be deleted. Error logging is available in the console. Please contain a developer for more information.",
                      status: bannerStatuses.error,
                    })
                  );
                }

                if (deleteImagesStatus === fetchStatuses.failed) {
                  console.error(deleteImagesErrorMessage);
                  dispatch(
                    add_message({
                      message:
                        "This image could not be deleted. Error logging is available in the console. Please contain a developer for more information.",
                      status: bannerStatuses.error,
                    })
                  );
                }

                onCloseClick();
              }}
              variant="primary"
              className="delete-proceed"
            >
              Proceed
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setModalView("stoat");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {(modalView === "stoat" || modalView === "reassign") && (
        <div className="modal-content">
          <img
            className="gallery__selected-image"
            loading="lazy"
            src={
              boundingBox
                ? image.presignedBbUrl || image.presignedUrl
                : image.presignedUrl
            }
            alt={`Image ${image.id}`}
          />
          <div className="modal__image-description">
            {generateModalContent()}
          </div>
        </div>
      )}
    </Modal>
  );
}

ImageModal.propTypes = {
  image: PropTypes.object,
  onCloseClick: PropTypes.func,
  onDeleteImage: PropTypes.func,
  stoats: PropTypes.array,
};
