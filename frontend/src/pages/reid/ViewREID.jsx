/** @format */

import "./viewREID.css";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Heading } from "../../components/Heading";
import {
  add_message,
  bannerStatuses,
} from "../../../features/banner/bannerSlice";
import apiClient from "../../utils/apiClient";
import ImagesView from "./components/ImagesView";

export default function ReIDImages() {
  const dispatch = useDispatch();
  const [detects, setDetects] = useState([]);

  useEffect(() => {
    async function getAllFolders(
      folders = [],
      date = "",
      time = "",
      groupId = ""
    ) {
      console.log("date:", date, "time:", time, "group_id:", groupId);
      try {
        const response = await apiClient(
          `/api/users/reid_images/browse?date=${date}&time=${time}&group_id=${groupId}`,
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
        //console.log("API Response Data:", data);

        for (const item of data.files) {
          if (!item.isDirectory) continue;
          folders.push({
            ...item,
            parent: `${date ? date + "/" : ""}${time ? time + "/" : ""}${
              groupId ? groupId + "/" : ""
            }`,
            path: `${date ? date + "/" : ""}${time ? time + "/" : ""}${
              groupId ? groupId + "/" : ""
            }${item.name}`,
          });

          await getAllFolders(
            folders,
            date || item.date,
            time || item.time || "",
            item.group_id || groupId || ""
          );
        }

        if (date === "" && time === "" && groupId === "") {
          setDetects(folders);
        }
      } catch (err) {
        console.error(err);
        dispatch(
          add_message({
            message:
              "Something went wrong getting folders. Please contact a developer for further assistance.",
            status: bannerStatuses.error,
          })
        );
      }
    }

    getAllFolders();
  }, []);

  return (
    <div className="uploads-wrapper">
      <Heading className="uploads-h1" level={1} style={{ margin: "10px 0" }}>
        ReID Gallery
      </Heading>

      {detects && detects?.length > 0 ? (
        <div className="uploads-list">
          <ImagesView detects={detects} />
        </div>
      ) : (
        <div className="uploads-list uploads-list--empty">
          No ReID images found
        </div>
      )}
    </div>
  );
}
