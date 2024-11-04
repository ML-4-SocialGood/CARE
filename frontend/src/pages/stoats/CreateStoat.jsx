/** @format */

import { Button } from "../../components/Button";
import { acceptedFileTypes } from "../upload/constants/acceptedFileTypes";
import "./stoats.css";
import { useCallback, useRef, useState } from "react";
import closeIcon from "../../assets/close.png";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getCsrfToken } from "../../utils/getCsrfToken";
import { useDispatch, useSelector } from "react-redux";
import { addNewStoat } from "../../../features/stoat/stoatSlice";
import { fetchStatuses } from "../../../features/upload/uploadSlice";
import {
  imageStatuses,
  addImagesToDynamo,
} from "../../../features/image/imageSlice";
import {
  add_message,
  bannerStatuses,
} from "../../../features/banner/bannerSlice";
import getSiteUrl from "../../utils/getSiteUrl";
import Loader from "../../components/Loader";

export default function CreateStoat() {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();

  const navigate = useNavigate();
  const imageRef = useRef();
  const nameRef = useRef();
  const sexRef = useRef();
  const locationRef = useRef();
  const ageRef = useRef();

  const [file, setFile] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const dispatch = useDispatch();

  const createStoatStatus = useSelector((state) => state.stoats.status);
  const createStoatsErrorMessage = useSelector((state) => state.uploads.error);
  const profileImageUploadStatus = useSelector((state) => state.images.status);
  const profileImageErrorMessage = useSelector((state) => state.images.error);

  const handleButtonKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Space") {
      e.preventDefault();
      handleButtonClick();
    }
  };

  const handleButtonClick = () => {
    imageRef.current?.click();
  };

  const handleOnChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setCreateLoading(true);
      let accessToken;
      let csrfToken;
      let imageId;

      const requestHeaders = new Headers();

      const name = nameRef?.current?.value.trim();
      const sex = sexRef?.current?.value.trim();
      const age = ageRef?.current?.value;
      const location = locationRef?.current?.value.trim();

      if (!name) {
        dispatch(
          add_message({
            message: "Name is required. Please try again",
            status: bannerStatuses.error,
          })
        );
        return;
      }
      try {
        accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: `https://projectcare/api`,
          },
        });

        csrfToken = getCsrfToken();
        if (!csrfToken) {
          // Hit public endpoint to retrieve the CSRF token
          await fetch(`${getSiteUrl()}/api/public/csrf`, {
            method: "GET",
            credentials: "include",
          });

          csrfToken = getCsrfToken();
        }

        requestHeaders.append("Authorization", `Bearer ${accessToken}`);
        requestHeaders.append("X-XSRF-TOKEN", csrfToken);
        requestHeaders.append("Content-Type", "application/json");
      } catch (err) {
        console.error(err);
        dispatch(
          add_message({
            message: `Error getting credentials; aborting upload. Please contact a developer for further assistance.`,
            status: bannerStatuses.error,
          })
        );
        return;
      }

      try {
        if (file) {
          // Upload profile picture
          const res = await fetch(
            `${getSiteUrl()}/api/private/images/generateuploadurls`,
            {
              method: "POST",
              headers: requestHeaders,
              body: JSON.stringify({ filenames: [file.name] }),
            }
          );

          if (res.status !== 200) {
            throw new Error(res);
          }

          const resJson = await res.json();

          const uploadResult = await fetch(resJson[file.name], {
            method: "PUT",
            headers: {
              "Content-Type": "application/octet-stream",
            },
            body: file,
          });

          if (uploadResult.status == 200) {
            const fetchBody = {};
            fetchBody[`${file.name}`] = uploadResult.url.split("?")[0];

            const imageDispatchResult = await dispatch(
              addImagesToDynamo({
                headers: requestHeaders,
                imageArray: [fetchBody],
              })
            );

            if (profileImageUploadStatus === imageStatuses.uploadError) {
              throw new Error(profileImageErrorMessage);
            }

            const { payload } = imageDispatchResult;
            const image = payload[0];

            if (image.id) {
              imageId = image.id;
            } else {
              throw new Error("Image was not uploaded correctly.");
            }
          } else {
            throw new Error(uploadResult);
          }
        }
      } catch (err) {
        console.error(err);
        dispatch(
          add_message({
            message: `Error uploading profile image. Please contact a developer for further assistance. `,
            status: bannerStatuses.error,
          })
        );
      }

      try {
        const dispatchResult = await dispatch(
          addNewStoat({
            headers: requestHeaders,
            name: name,
            sex: sex,
            age: age,
            location: location,
            imageId: imageId,
          })
        );

        if (createStoatStatus === fetchStatuses.succeeded) {
          navigate(`/stoats/${dispatchResult.payload.id}`);
        } else if (createStoatStatus === fetchStatuses.failed) {
          throw new Error(createStoatsErrorMessage);
        }
      } catch (err) {
        console.error(err);
        dispatch(
          add_message({
            message: `Error : ${err.message}`,
            status: bannerStatuses.error,
          })
        );
      } finally {
        setCreateLoading(false);
      }
    },
    [
      createStoatStatus,
      createStoatsErrorMessage,
      dispatch,
      file,
      getAccessTokenSilently,
      navigate,
      profileImageErrorMessage,
      profileImageUploadStatus,
    ]
  );

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/" replace={true} />;
  }

  return (
    <div className="create-stoat__wrapper">
      {createLoading ? (
        <Loader />
      ) : (
        <form className="create-stoat__form" onSubmit={handleSubmit}>
          <Link className="modal__link" to="/stoats">
            Go back
          </Link>
          <div className="create-stoat__img-wrapper">
            <button
              className="create-stoat__img-upload"
              type="button"
              onKeyDown={handleButtonKeyDown}
              onClick={handleButtonClick}
              aria-label="Add profile image"
            >
              {file != null ? (
                <img
                  className="create-stoat__img-preview"
                  src={URL.createObjectURL(file)}
                  onLoad={() => {
                    URL.revokeObjectURL(file);
                  }}
                />
              ) : (
                "Add profile image"
              )}
            </button>
            {file && (
              <button
                aria-label="Remove image"
                className="create-stoat__remove-img"
                type="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Space") {
                    e.preventDefault();
                    setFile(null);
                  }
                }}
                onClick={() => {
                  setFile(null);
                }}
              >
                <img
                  alt="Dismiss banner"
                  className="banner__close-icon"
                  src={closeIcon}
                />
              </button>
            )}
            <label htmlFor="stoat-profile" className="visually-hidden">
              Click to upload stoat profile image
            </label>
            <input
              className="visually-hidden"
              id="stoat-profile"
              ref={imageRef}
              type="file"
              onChange={handleOnChange}
            />
          </div>

          <label className="visually-hidden" htmlFor="stoat-name">
            Name
          </label>
          <input
            id="stoat-name"
            className="create-stoat__input"
            type="text"
            name="name"
            placeholder="name"
            required
            ref={nameRef}
          ></input>
          <label className="visually-hidden" htmlFor="stoat-location">
            Location
          </label>
          <input
            id="stoat-location"
            className="create-stoat__input"
            type="text"
            name="location"
            placeholder="location"
            ref={locationRef}
          ></input>
          <label className="visually-hidden" htmlFor="stoat-age">
            Age
          </label>
          <input
            id="stoat-age"
            className="create-stoat__input"
            type="number"
            name="age"
            placeholder="age"
            ref={ageRef}
          ></input>

          <select
            defaultValue="none"
            className="create-stoat__dropdown"
            name="Sort by"
            ref={sexRef}
          >
            <option value="none" disabled hidden>
              sex
            </option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unknown">Unknown</option>
          </select>

          <Button
            className="create-stoat__submit"
            type="submit"
            variant="primary"
          >
            Add stoat
          </Button>
        </form>
      )}
    </div>
  );
}
