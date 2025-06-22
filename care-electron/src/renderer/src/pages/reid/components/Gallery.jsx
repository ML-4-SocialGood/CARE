/** @format */
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { Heading } from "@renderer/components/Heading";
import { Button } from "@renderer/components/Button";
import ImageModal from "./ImageModal";
import { getCsrfToken } from "@renderer/utils/getCsrfToken";
import { useAuth0 } from "@auth0/auth0-react";
import { useDispatch, useSelector } from "react-redux";
import { getAllStoats } from "@renderer/features/stoat/stoatSlice";
import {
  deleteImage,
  fetchImageById,
  fetchImages,
  getAllImages,
} from "@renderer/features/image/imageSlice";
import { fetchStatuses } from "@renderer/features/upload/uploadSlice";
import {
  add_message,
  bannerStatuses,
} from "@renderer/features/banner/bannerSlice";
import { isPresignedUrlExpired } from "@renderer/utils/isPresignedUrlExpired";
import { getSiteUrl } from "@renderer/utils/getSiteUrl";

import Loader from "@renderer/components/Loader";

export function ImageGallery({
  images,
  setSelectedImage,
  showBoundingBoxes,
  setFilteredImages,
  clearFilters,
}) {
  const { getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();

  const lastEvaluatedId = useSelector((state) => state.images.lastEvaluatedId);
  const moreToFetch = useSelector((state) => state.images.moreToFetch);
  const imageStatus = useSelector((state) => state.images.status);
  const imageError = useSelector((state) => state.images.error);

  const allImages = useSelector((state) => getAllImages(state));

  // Check over all images, and for any whose presigned URL has expired, fetch a new one
  useEffect(() => {
    async function getUpdatedPresignedUrls() {
      for (let i = 0; i < allImages.length; i++) {
        if (
          isPresignedUrlExpired(allImages[i].presignedUrl) ||
          !allImages[i].presignedUrl ||
          (allImages[i].hasBoundingBox &&
            isPresignedUrlExpired(allImages[i].presignedBbUrl))
        ) {
          try {
            const accessToken = await getAccessTokenSilently({
              authorizationParams: {
                audience: `https://projectcare/api`,
              },
            });

            const image = allImages[i];

            console.log(
              "dispatching for presigned urls that have expired for image with id " +
                image["id"]
            );
            dispatch(
              fetchImageById({ accessToken: accessToken, imageId: image["id"] })
            );
          } catch (err) {
            console.error(err);
            dispatch(
              add_message({
                message:
                  "Something went wrong getting updated presigned urls for your images. Please contact a developer for further assistance.",
                status: bannerStatuses.error,
              })
            );
          }
        }
      }
    }

    getUpdatedPresignedUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="gallery__images-container">
      {images?.length > 0 ? (
        <div className="gallery__images">
          {images.map((img) => (
            <button
              key={`${img.filename}-${img.id}`}
              aria-label="Show image"
              className="gallery__button"
              onClick={() => setSelectedImage(img)}
            >
              <img
                className="gallery__image"
                src={
                  showBoundingBoxes
                    ? img.presignedBbUrl || img.presignedUrl
                    : img.presignedUrl
                }
                loading="lazy"
                alt={`Image ${img.id}`}
              />
            </button>
          ))}
        </div>
      ) : (
        <Heading level={2}>No images found.</Heading>
      )}
      {lastEvaluatedId && images.length && allImages.length == images.length ? (
        <Button
          className="view-more"
          onClick={async () => {
            if (moreToFetch) {
              const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                  audience: `https://projectcare/api`,
                },
              });

              dispatch(
                fetchImages({
                  accessToken: accessToken,
                  lastEvaluatedId: lastEvaluatedId,
                })
              );

              if (imageStatus === fetchStatuses.succeeded) {
                setFilteredImages(images);
                clearFilters();
              } else if (imageStatus === fetchStatuses.failed) {
                dispatch(
                  add_message({
                    message:
                      "Something went wrong retrieving image data. Please contact a developer for more assistance.",
                    status: bannerStatuses.error,
                  })
                );
              }
            }
          }}
          variant="primary"
        >
          View more
        </Button>
      ) : null}
    </div>
  );
}

ImageGallery.propTypes = {
  images: PropTypes.array,
  setSelectedImage: PropTypes.func,
  showBoundingBoxes: PropTypes.bool,
  setFilteredImages: PropTypes.func,
  clearFilters: PropTypes.func,
};

export function GalleryComposition({
  clearFilters,
  filters,
  sort,
  images,
  setLastId,
  showBoundingBoxes,
  lastEvaluatedId,
  setFilteredImages,
}) {
  const [selectedImage, setSelectedImage] = useState(null);

  const dispatch = useDispatch();
  const stoats = useSelector((state) => getAllStoats(state));
  const imageStatus = useSelector((state) => state.images.status);
  const imagesErrorMessage = useSelector((state) => state.images.error);

  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    async function getImages() {
      const accessToken = await getAccessTokenSilently();
      dispatch(fetchImages({ accessToken: accessToken }));
    }

    if (imageStatus === fetchStatuses.idle) {
      getImages();
    }

    if (imageStatus === fetchStatuses.failed) {
      console.error(imagesErrorMessage);
      dispatch(
        add_message({
          message:
            "Something went wrong fetching image data. Please contact a developer for further assistance.",
          status: bannerStatuses.error,
        })
      );
    }
  });

  const onDeleteImage = useCallback(
    async (id) => {
      let csrfToken = getCsrfToken();

      if (csrfToken === null) {
        // Hit public endpoint to retrieve the CSRF token
        await fetch(`${getSiteUrl()}/api/public/csrf`, {
          method: "GET",
          credentials: "include",
        });

        csrfToken = getCsrfToken();
      }

      const accessToken = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://projectcare/api`,
        },
      });

      const requestHeaders = new Headers();
      requestHeaders.append("Authorization", `Bearer ${accessToken}`);
      requestHeaders.append("X-XSRF-TOKEN", csrfToken);

      return dispatch(deleteImage({ headers: requestHeaders, imageId: id }));
    },
    [getAccessTokenSilently, dispatch]
  );

  if (imageStatus === fetchStatuses.loading) {
    return <Loader />;
  }

  return (
    <div className="gallery">
      <div className="gallery__filter-list">{filters}</div>
      <ImageGallery
        clearFilters={clearFilters}
        images={images}
        setFilteredImages={setFilteredImages}
        lastEvaluatedId={lastEvaluatedId}
        showBoundingBoxes={showBoundingBoxes}
        setSelectedImage={setSelectedImage}
      />
      <div className="gallery__sort">{sort}</div>
      {selectedImage != null &&
        createPortal(
          <ImageModal
            image={selectedImage}
            onCloseClick={() => {
              setSelectedImage(null);
            }}
            onDeleteImage={onDeleteImage}
            setLastId={setLastId}
            stoats={stoats}
          />,
          document.body
        )}
    </div>
  );
}

GalleryComposition.propTypes = {
  clearFilters: PropTypes.func,
  images: PropTypes.array,
  filters: PropTypes.node,
  lastEvaluatedId: PropTypes.string,
  setFilteredImages: PropTypes.func,
  sort: PropTypes.node,
  showBoundingBoxes: PropTypes.bool,
  setLastId: PropTypes.func,
};
