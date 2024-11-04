/** @format */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import getSiteUrl from "../../src/utils/getSiteUrl";

export const fetchUploads = createAsyncThunk(
  "uploads/fetchUploads",
  async (accessToken) => {
    console.log("Fetching uploads...");
    const uploadsResponse = await fetch(`${getSiteUrl()}/api/private/uploads`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const uploadJson = await uploadsResponse.json();

    // Sort by most recent
    return uploadJson.sort(
      (u1, u2) => new Date(u2.uploadDateTime) - new Date(u1.uploadDateTime)
    );
  }
);

export const fetchUploadById = createAsyncThunk(
  "uploads/fetchUploadById",
  async ({ accessToken, uploadId, imagesToFetch, lastProcessedImageId }) => {
    console.log(`Fetching upload with id ${uploadId}...`);
    const uploadRes = await fetch(
      `${getSiteUrl()}/api/private/uploads/${uploadId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const upload = await uploadRes.json();
    upload.imagesToFetch = imagesToFetch;
    upload.lastProcessedImageId = lastProcessedImageId;
    return upload;
  }
);

export const fetchStatuses = {
  idle: "idle",
  loading: "loading",
  succeeded: "succeeded",
  failed: "failed",
};

export const uploadSlice = createSlice({
  name: "uploads",
  initialState: {
    value: [],
    status: fetchStatuses.idle,
    error: null,
  },
  reducers: {
    update_upload: (state, action) => {
      const uploadToReplaceIndex = state.value.findIndex(
        (upload) => upload.id === action.payload.id
      );

      if (uploadToReplaceIndex > -1) {
        state.value = [
          ...state.value.slice(0, uploadToReplaceIndex),
          action.payload,
          ...state.value.slice(uploadToReplaceIndex + 1),
        ];
      } else {
        state.value.push(action.payload);
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchUploads.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUploads.fulfilled, (state, action) => {
        state.status = "succeeded";

        const { payload } = action;
        const uploads = [];

        for (let i = 0; i < payload.length; i++) {
          const newUpload = payload[i];

          const existingUpload = state.value.find(
            (upload) => upload.id === payload[i].id
          );

          if (existingUpload) {
            newUpload["imagesToFetch"] = existingUpload.imagesToFetch;
            newUpload["lastProcessedImageId"] =
              existingUpload.lastProcessedImageId;
          }

          uploads.push(newUpload);
        }
        // Add any fetched uploads to the array
        state.value = uploads;
      })
      .addCase(fetchUploads.rejected, (state, action) => {
        state.status = fetchStatuses.failed;
        state.error = action.error.message;
      })
      .addCase(fetchUploadById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUploadById.fulfilled, (state, action) => {
        const upload = action.payload;
        const uploadToReplaceIndex = state.value.findIndex(
          (u) => u.id == upload.id
        );

        if (uploadToReplaceIndex > -1) {
          state.value = [
            ...state.value.slice(0, uploadToReplaceIndex),
            upload,
            ...state.value.slice(uploadToReplaceIndex + 1),
          ];
        } else {
          state.value.push(action.payload);
        }

        state.status = fetchStatuses.succeeded;
      })
      .addCase(fetchUploadById.rejected, (state, action) => {
        state.status = fetchStatuses.failed;
        state.error = action.error.message;
      });
  },
});

export default uploadSlice.reducer;

export const { update_upload } = uploadSlice.actions;

export const getAllUploads = (state) => state.uploads.value;

export const getUploadById = (state, uploadId) =>
  state.uploads.value.find((u) => u.id == uploadId);
