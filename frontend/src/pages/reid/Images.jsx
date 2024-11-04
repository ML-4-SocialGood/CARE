/** @format */
import { useAuth0 } from "@auth0/auth0-react";
import { Heading } from "../../components/Heading";
import "./images.css";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { useState, useEffect, useMemo, useCallback } from "react";

import StoatAvatar from "../../components/StoatAvatar";
import { GalleryComposition } from "./components/Gallery";
import { formatUploadTimestamp } from "../../utils/formatUploadTimestamp";
import { Button } from "../../components/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUploads,
  getAllUploads,
  update_upload,
} from "../../../features/upload/uploadSlice";
import { getAllStoats } from "../../../features/stoat/stoatSlice";
import {
  assignImageGroup,
  fetchImageById,
  getAllImages,
  imageStatuses,
} from "../../../features/image/imageSlice";
import {
  add_message,
  bannerStatuses,
} from "../../../features/banner/bannerSlice";
import FilterDropdown from "./components/FilterDropdown";
import GroupAssignmentModal from "./components/GroupAssignmentModal";
import { getCsrfToken } from "../../utils/getCsrfToken";
import getSiteUrl from "../../utils/getSiteUrl";
import { SortDropdown } from "./components/SortDropdown";
import Loader from "../../components/Loader";

const filterImages = (
  images,
  uploadFilters,
  stoatView,
  selectedStoatId = null
) => {
  let filteredImages = images;

  if (uploadFilters.length) {
    // Filter by uploads

    filteredImages = filteredImages.filter((img) =>
      uploadFilters.find((uploadId) => uploadId == img.uploadId)
    );
  }

  // Filter by selected stoat
  if (stoatView) {
    if (isNaN(parseInt(selectedStoatId)) && selectedStoatId === null) {
      filteredImages = filteredImages.filter((img) => {
        if (isNaN(parseInt(img.stoatId))) {
          return true;
        }
      });
    } else {
      filteredImages = filteredImages.filter(
        (img) => img.stoatId == selectedStoatId
      );
    }
  }

  return filteredImages;
};

export default function Images() {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();
  const [lastId, setLastId] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [stoatView, setStoatView] = useState(false);
  const [groupView, setGroupView] = useState(false);
  const [selectedStoat, setSelectedStoat] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  // To minimise the amount of calls to the b.e., we store filtered & non-filtered images
  const [filteredImages, setFilteredImages] = useState([]);
  const [currentUploadFilters, setCurrentUploadFilters] = useState([]);
  const [boundingBoxes, setBoundingBoxes] = useState(false);

  const navigate = useNavigate();
  const uploads = useSelector((state) => getAllUploads(state));
  const stoats = useSelector((state) => getAllStoats(state));

  const images = useSelector((state) => getAllImages(state));
  const imagesUploadStatus = useSelector((state) => state.images.singleStatus);
  const imageError = useSelector((state) => state.images.error);

  const [searchParams] = useSearchParams();
  const stoatIdParam = searchParams.get("stoatId");
  const uploadIdParam = searchParams.get("uploadId");
  const groupIdParam = searchParams.get("groupId");

  const clearFilters = useCallback(() => {
    setCurrentUploadFilters([]);
    setSelectedStoat(null);
  }, []);

  useEffect(() => {
    clearFilters();
  }, [clearFilters]);

  // This effect runs on page load to check what the filters/parameters are to display the relevant stoats
  useEffect(() => {
    let upload;
    let selected;
    const uploadFilters = [];

    if (groupIdParam) {
      const filtered = images.filter((image) => image.groupId == groupIdParam);
      setFilteredImages(filtered);
      setGroupView(true);

      setInitialLoad(false);
      return;
    } else {
      setGroupView(false);
    }

    if (uploadIdParam) {
      upload = uploads.find((u) => u.id == uploadIdParam);

      if (upload) {
        setCurrentUploadFilters([upload.id]);
        uploadFilters.push(upload.id);
      }
    } else {
      setCurrentUploadFilters([]);
    }

    if (stoatIdParam) {
      if (isNaN(parseInt(stoatIdParam))) {
        setSelectedStoat(null);
      } else {
        selected = stoats.find((s) => s.id == stoatIdParam);
        if (selected) {
          setSelectedStoat(selected.id);
        }
      }

      setStoatView(true);
      setFilteredImages(
        filterImages(images, uploadFilters, true, selected?.id)
      );

      setInitialLoad(false);
      return;
    } else {
      setStoatView(false);
      setFilteredImages(filterImages(images, uploadFilters, false, null));
    }

    setInitialLoad(false);
  }, [
    images,
    stoats,
    uploads,
    setFilteredImages,
    groupIdParam,
    uploadIdParam,
    stoatIdParam,
  ]);

  // This filter runs every time filters are changed
  useEffect(() => {
    setFilteredImages(
      filterImages(images, currentUploadFilters, stoatView, selectedStoat)
    );
  }, [currentUploadFilters, images, selectedStoat, stoatView]);

  // If any of the uploads have images that haven't been fetched, then we need to fetch them
  useEffect(() => {
    async function getUnfetchedImages() {
      // If any upload has imagesToFetch true, then fetch the images
      const newUploads = uploads.filter((u) => u.imagesToFetch);
      let accessToken;

      try {
        accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: `https://projectcare/api`,
          },
        });

        dispatch(fetchUploads(accessToken));
      } catch (err) {
        console.error(err);
        dispatch(
          add_message({
            message:
              "Something went wrong fetching upload data. Please contact a developer for assistance.",
            status: bannerStatuses.error,
          })
        );
      }

      for (let i = 0; i < newUploads.length; i++) {
        const newUpload = structuredClone(newUploads[i]);

        const { imagesToFetch, lastProcessedImageId, imageSet } = newUpload;

        if (imagesToFetch === true) {
          let indexToStart = 0;
          if (lastProcessedImageId) {
            // Find where we left off
            const lastProcessedIndex = imageSet.indexOf(lastProcessedImageId);

            if (lastProcessedIndex > -1) {
              indexToStart = lastProcessedIndex + 1;
            }
          }

          // Fetch remaining images
          for (let i = indexToStart; i < imageSet?.length; i++) {
            await dispatch(
              fetchImageById({
                accessToken: accessToken,
                imageId: imageSet[i],
              })
            );

            if (imagesUploadStatus === imageStatuses.singleSuccess) {
              newUpload["lastProcessedImageId"] = imageSet[i];
              newUpload[imagesToFetch] = true;
            }
          }

          if (newUpload.uploadStatus === "complete" && imageSet) {
            if (
              newUpload["lastProcessedImageId"] == imageSet[imageSet.length - 1]
            ) {
              newUpload.imagesToFetch = false;
            }
          }

          await dispatch(update_upload(newUpload));
        }
      }
    }

    getUnfetchedImages();

    // We only want to run this effect on refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStoatViewChange = (e) => {
    if (e.target.checked) {
      navigate("/images?stoatId=Unknown");
    } else {
      navigate("/images");
    }
  };

  const handleBoundingBoxInputChange = (e) => {
    if (e.target.checked) {
      setBoundingBoxes(true);
    } else {
      setBoundingBoxes(false);
    }
  };

  const handleUploadFilters = (event) => {
    // Check if the input was checked or removed
    if (event.target.checked) {
      setCurrentUploadFilters((prevFilters) => [
        event.target.id,
        ...prevFilters,
      ]);
    } else {
      setCurrentUploadFilters((prevFilters) => {
        const idxToRemove = prevFilters.indexOf(event.target.id);
        if (idxToRemove > -1) {
          const updatedFilters = [
            ...prevFilters.slice(0, idxToRemove),
            ...prevFilters.slice(idxToRemove + 1),
          ];

          return updatedFilters;
        }
        return prevFilters;
      });
    }
  };

  const filters = useMemo(() => {
    return (
      <>
        {!stoatView ? (
          <div
            onClick={() => {
              () => {
                setCurrentUploadFilters([]);
                setSelectedStoat(null);
              };
            }}
            tabIndex={0}
          >
            <Heading
              className={clsx(
                "gallery__filter-heading",
                "gallery__filter-heading-link",
                !currentUploadFilters.length &&
                  !selectedStoat &&
                  "gallery__filter-heading-active"
              )}
              level={5}
            >
              {groupView
                ? `${filteredImages.length} images in group`
                : "All images"}
            </Heading>
          </div>
        ) : null}
        {groupView ? null : (
          <div
            className={clsx(
              "gallery__filter-container",
              stoatView && "stoat-view"
            )}
          >
            {/* <Heading className="gallery__filter-heading" level={5}>
            Filter by upload
          </Heading> */}
            <FilterDropdown
              title="Filter by upload"
              content={
                <ul className="gallery__filter-group">
                  {uploads?.length &&
                    uploads.map((upload) => (
                      <li
                        className="gallery__filter-item"
                        key={`${upload.id}-filter`}
                      >
                        <input
                          type="checkbox"
                          id={upload.id}
                          name={upload.id}
                          onChange={handleUploadFilters}
                          className="filter-option"
                          checked={Boolean(
                            currentUploadFilters.find((f) => f == upload.id)
                          )}
                        />
                        <label htmlFor={upload.id}>
                          {formatUploadTimestamp(upload.uploadDateTime)}
                        </label>
                      </li>
                    ))}
                </ul>
              }
            />
            {stoatView ? (
              <>
                <Heading level={5} className="stoat-view-heading">
                  Select a stoat
                </Heading>
                <div className="stoat-avatars">
                  <StoatAvatar
                    isActive={selectedStoat === null}
                    name="No stoats detected"
                    hasLongTitle
                    imgClass="unassigned-avatar"
                    imgLink={
                      "https://img.icons8.com/ios-filled/200/question-mark.png"
                    }
                    onClick={() => {
                      navigate(`/images?stoatId=Unknown`);
                    }}
                  />
                  {stoats?.length &&
                    stoats?.map((stoat) => (
                      <StoatAvatar
                        imgClass={
                          stoat.id == 0
                            ? "unassigned-avatar unknown-stoat"
                            : null
                        }
                        isActive={selectedStoat == stoat.id}
                        key={`${stoat.name}-${stoat.id}`}
                        name={stoat.name}
                        imgLink={stoat.profileImg}
                        age={stoat.age}
                        sex={stoat.sex}
                        withAgeSex
                        onClick={() => {
                          navigate(`/images?stoatId=${stoat.id}`);
                        }}
                      />
                    ))}
                </div>
              </>
            ) : null}
          </div>
        )}
      </>
    );
  }, [
    stoatView,
    currentUploadFilters,
    selectedStoat,
    groupView,
    filteredImages.length,
    uploads,
    stoats,
    navigate,
  ]);

  const sortOptions = groupView ? (
    <Button
      onClick={() => {
        setShowAssignmentModal(true);
      }}
      variant="primary"
    >
      Assign
    </Button>
  ) : (
    <>
      <div className="gallery__sort__item">
        <SortDropdown
          onChange={(e) => {
            const imagesToSort = structuredClone(filteredImages);

            imagesToSort.sort((a, b) => {
              const aDate = new Date(a.date);
              const bDate = new Date(b.date);

              if (!a.date) {
                return 1;
              } else if (!b.date) {
                return -1;
              }

              if (e.target.value.toLowerCase() === "newest") {
                return bDate - aDate;
              } else if (e.target.value.toLowerCase() === "oldest") {
                return aDate - bDate;
              }
            });

            setFilteredImages(imagesToSort);
          }}
        />
      </div>
      <div className="gallery__sort__item">
        <Heading
          id="stoat-toggle-label"
          level={5}
          className="gallery__toggle-label"
        >
          Stoat view
        </Heading>
        <label className="gallery__switch">
          <input
            aria-labelledby="stoat-toggle-label"
            onChange={handleStoatViewChange}
            className="gallery__switch__input"
            type="checkbox"
            checked={stoatView}
          />
          <span className="gallery__switch__slider-round round" />
        </label>
      </div>
      <div className="gallery__sort__item">
        <Heading
          id="boundingbox-toggle-label"
          level={5}
          className="gallery__toggle-label"
        >
          Show bounding boxes
        </Heading>
        <label className="gallery__switch">
          <input
            aria-labelledby="boundingbox-toggle-label"
            onChange={handleBoundingBoxInputChange}
            className="gallery__switch__input"
            type="checkbox"
          />
          <span className="gallery__switch__slider-round round" />
        </label>
      </div>
    </>
  );

  if (initialLoad) {
    return <Loader />;
  }

  return !isLoading && isAuthenticated ? (
    <div className="images__container">
      <div className="images__header">
        <Heading className="images__heading" level={1}>
          Result Gallery
        </Heading>
      </div>

      <GalleryComposition
        clearFilters={clearFilters}
        showBoundingBoxes={boundingBoxes}
        filters={filters}
        images={filteredImages}
        setFilteredImages={setFilteredImages}
        setLastId={setLastId}
        sort={sortOptions}
        lastEvaluatedId={lastId}
      />
      {showAssignmentModal ? (
        <GroupAssignmentModal
          onAssign={async (stoatId) => {
            try {
              const requestHeaders = new Headers();

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

              requestHeaders.append("Authorization", `Bearer ${accessToken}`);
              requestHeaders.append("X-XSRF-TOKEN", csrfToken);
              requestHeaders.append("Content-Type", "application/json");

              const { payload } = await dispatch(
                assignImageGroup({
                  stoatId: stoatId,
                  requestHeaders: requestHeaders,
                  groupId: groupIdParam,
                  imageIds: filteredImages.map((image) => image.id),
                })
              );

              const { status } = payload;

              if (status === 200) {
                return true;
              } else {
                throw new Error(imageError);
              }
            } catch (err) {
              console.error(err);
              dispatch(
                add_message({
                  message: `Error getting stoat info. Please contact a developer for further assistance.`,
                  status: bannerStatuses.error,
                })
              );

              return false;
            }

            // Make call to backend with all of hte images ot reassign
            // This should bulk update each image's stoatId to be the new stoatId, and remove their groupId
            // Reassign stoat for each image
          }}
          onCloseClick={() => {
            setShowAssignmentModal(false);
          }}
        />
      ) : null}
    </div>
  ) : (
    <Navigate to="/" replace={true} />
  );
}
