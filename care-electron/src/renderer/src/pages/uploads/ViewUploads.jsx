/** @format */

import "./viewuploads.css";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Heading } from "@renderer/components/Heading";
import {
  add_message,
  bannerStatuses,
} from "@renderer/features/banner/bannerSlice";
import apiClient from "@renderer/utils/apiClient";
import UploadsView from "./components/UploadsView";

export default function Uploads() {
  const dispatch = useDispatch();
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    async function getAllUploads(files = [], date = "", folderPath = "") {
      console.log(date);
      console.log(folderPath);
      try {
        const response = await apiClient(
          `/api/users/images/browse?date=${date}&folderPath=${folderPath}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error(response.status);
          dispatch(
            add_message({
              message:
                "Something went wrong getting upload information. Please contact a developer for further assistance.",
              status: bannerStatuses.error,
            })
          );
          return;
        }

        const data = await response.json();
        console.log(data);

        for (const item of data.files) {
          if (!item.isDirectory) continue;
          files.push({
            ...item,
            parent: `${date ? date + '/': ''}${folderPath ? folderPath + '/': ''}`,
            path: `${date ? date + '/': ''}${item.path}`,
          });
          await getAllUploads(
            files,
            date ? date : item.path,
            date ? item.path : ""
          );
        }

        if (date === "") {
          setUploads(files);
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

    getAllUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="uploads-wrapper">
      <Heading className="uploads-h1" level={1}>
        Image Gallery
      </Heading>
      {uploads && uploads?.length > 0 ? (
        <div className="uploads-list">
          <UploadsView uploads={uploads} />
        </div>
      ) : (
        <div className="uploads-list uploads-list--empty">No uploads found</div>
      )}
    </div>
  );
}
