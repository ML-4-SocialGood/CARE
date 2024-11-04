/** @format */
import { Navigate, useParams } from "react-router-dom";
import "./stoatProfile.css";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Heading } from "../../components/Heading";
import { GalleryComposition } from "../images/components/Gallery";
import StoatAvatar, { renderAgeAndSex } from "../../components/StoatAvatar";
import { SortDropdown } from "../images/components/SortDropdown";
import { getCsrfToken } from "../../utils/getCsrfToken";
import { useDispatch, useSelector } from "react-redux";
import { getStoatById, updateStoat } from "../../../features/stoat/stoatSlice";
import {
  add_message,
  bannerStatuses,
} from "../../../features/banner/bannerSlice";
import { getAllImages } from "../../../features/image/imageSlice";
import getSiteUrl from "../../utils/getSiteUrl";

export default function StoatProfile() {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();
  const { stoatId } = useParams();
  const [filteredImages, setFilteredImages] = useState([]);

  const stoat = useSelector((state) => getStoatById(state, stoatId));

  const allImages = useSelector((state) => getAllImages(state));

  useEffect(() => {
    if (!stoatId || !stoat) {
      return;
    }

    const filtered = allImages.filter((i) => i.stoatId == stoatId);

    setFilteredImages(filtered);
  }, [allImages, stoatId, stoat]);

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/" replace={true} />;
  }

  if (!stoat) {
    return (
      <div className="images__container">
        Stoat not found. Are you sure you have formatted your request correctly?
      </div>
    );
  }

  const filters = (
    <div className="filters__avatar">
      <StoatAvatar
        key={`${stoat.name}-${stoat.id}`}
        name={stoat.name}
        imgLink={stoat.profileImg}
      />
      <ul className="avatar__details">
        <li className="avatar__detail">{stoat.name}</li>
        {stoat.location && <li className="avatar__detail">{stoat.location}</li>}
        {(stoat.age || stoat.sex) && (
          <li className="avatar__detail">
            {renderAgeAndSex(stoat.age, stoat.sex)}
          </li>
        )}
      </ul>
      <button
        className="avatar__profile-button"
        onClick={async () => {
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

            dispatch(
              updateStoat({
                stoatId: stoatId,
                requestHeaders: requestHeaders,
                requestBody: { archivedFlag: !stoat.archivedFlag },
              })
            );
          } catch (err) {
            console.error(err);
            dispatch(
              add_message({
                message: `Error: ${err.message}`,
                status: bannerStatuses.error,
              })
            );
          }
        }}
      >
        {stoat.archivedFlag ? "Unarchive" : "Archive"}
      </button>
      <button
        className="avatar__profile-button"
        onClick={async () => {
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

            dispatch(
              updateStoat({
                stoatId: stoatId,
                requestHeaders: requestHeaders,
                requestBody: { deceasedFlag: !stoat.deceasedFlag },
              })
            );
          } catch (err) {
            console.error(err);
            dispatch(
              add_message({
                message: `Error getting stoat info. Please contact a developer for further assistance.`,
                status: bannerStatuses.error,
              })
            );
          }
        }}
      >
        {stoat.deceasedFlag ? "Mark alive" : "Mark deceased"}
      </button>
    </div>
  );

  return (
    <div className="images__container">
      <div className="images__header">
        <Heading className="images__heading" level={1}>
          {stoat?.name}
        </Heading>
      </div>
      <GalleryComposition
        filters={filters}
        images={filteredImages}
        sort={
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
        }
      />
    </div>
  );
}
