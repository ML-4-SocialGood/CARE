/** @format */

import "./viewimages.css";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Heading } from "../../components/Heading";
import {
  add_message,
  bannerStatuses,
} from "../../../features/banner/bannerSlice";
import apiClient from "../../utils/apiClient";
import ImagesView from "./components/ImagesView";
import FilterConfidence from "./components/FilterConfidence.jsx";
import FilterDropdown from "./components/FilterDropdown.jsx";

export default function Images() {
  const dispatch = useDispatch();
  const [detects, setDetects] = useState([]);
  const [selectedSpecies, setSpecies] = useState(null);
  const [confLow, setConfLow] = useState("0");
  const [confHigh, setConfHigh] = useState("1");
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const labels = [
    "No Detection",
    "Bird",
    "Cat",
    "Deer",
    "Dog",
    "Ferret",
    "Goat",
    "Hedgehog",
    "Kiwi",
    "Lagomorph",
    "Livestock",
    "Pig",
    "Possum",
    "Rodent",
    "Stoat",
    "Wallaby",
  ];

  const handleSpeciesSelect = async (species) => {
    setSpecies(species);
  };

  const handleConfidenceChange = ({ confLow, confHigh }) => {
    setConfLow(confLow);
    setConfHigh(confHigh);
  };

  const handleDownload = async () => {
    // Set loading state to true before making the API request
    setIsLoading(true);

    // Construct the URL without a label if selectedSpecies is null
    const downloadUrl = selectedSpecies
      ? `/api/users/detect_images/download?label=${selectedSpecies}`
      : `/api/users/detect_images/download`;

    try {
      const response = await apiClient(downloadUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        responseType: "blob", // Important to handle binary data
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = selectedSpecies
          ? `${selectedSpecies}_images.zip`
          : `all_images.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errorText = await response.text();
        dispatch(
          add_message({
            message:
              errorText || "Failed to download images. Please try again.",
            status: bannerStatuses.error,
          })
        );
      }
    } catch (err) {
      console.error(err);
      dispatch(
        add_message({
          message:
            "Something went wrong while downloading. Please contact a developer.",
          status: bannerStatuses.error,
        })
      );
    } finally {
      // Set loading state back to false after the download completes or fails
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function getAllImages(
      files = [],
      date = "",
      folderPath = "",
      label = selectedSpecies
    ) {
      console.log("date:", date);
      console.log("folderPath: ", folderPath);
      console.log("label: ", selectedSpecies);
      console.log("##################");
      try {
        const response = await apiClient(
          `/api/users/detect_images/browse?date=${date}&folderPath=${folderPath}${
            label ? `&label=${label}` : ""
          }&confLow=${confLow}&confHigh=${confHigh}`,
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
            parent: `${date ? date + "/" : ""}${
              folderPath ? folderPath + "/" : ""
            }`,
            path: `${date ? date + "/" : ""}${item.path}`,
          });
          console.log("Folders:", detects);
          await getAllImages(
            files,
            date ? date : item.path,
            date ? item.path : "",
            label
          );
        }

        if (date === "") {
          console.log("Files: ");
          setDetects(files);
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

    getAllImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecies, confLow, confHigh]);

  return (
    <div className="uploads-wrapper">
      <Heading className="uploads-h1" level={1}>
        Detection Gallery
      </Heading>
      <div id="LabelDropdown">
        <FilterConfidence
          title={
            confLow !== "0" || confHigh !== "1"
              ? `Filter by Confidence: ${confLow} - ${confHigh} ▼`
              : "Filter by Confidence ▼"
          }
          onValueChange={handleConfidenceChange}
        />
        <FilterDropdown
          title={
            selectedSpecies
              ? `Filter by Species: ${selectedSpecies} ▼`
              : "Filter by Species ▼"
          }
          content={labels}
          onItemSelect={handleSpeciesSelect}
        />
        <div
          className="clear-filter-button"
          onClick={() => {
            setSpecies(null);
            setConfLow("0");
            setConfHigh("1");
          }}
        >
          Clear Filter
        </div>
        {/* Download button with loading state */}
        <div
          className="download-button"
          onClick={handleDownload}
          disabled={isLoading}
        >
          {isLoading
            ? "Exporting..."
            : selectedSpecies
            ? `Export All ${selectedSpecies}`
            : `Export All Images`}
        </div>
      </div>

      {detects && detects?.length > 0 ? (
        <div className="uploads-list">
          <ImagesView
            detects={detects}
            label={selectedSpecies}
            confLow={confLow}
            confHigh={confHigh}
          />
        </div>
      ) : (
        <div className="uploads-list uploads-list--empty">
          No detect images found
        </div>
      )}
    </div>
  );
}
