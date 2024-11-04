/** @format */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchStatuses } from "../upload/uploadSlice";
import getSiteUrl from "../../src/utils/getSiteUrl";

export const fetchImages = createAsyncThunk(
  "images/fetchImages",
  async ({ accessToken, lastEvaluatedId }) => {
    console.log(`Fetching images with lastEvaluatedId as ${lastEvaluatedId}`);
    const url = lastEvaluatedId
      ? `${getSiteUrl()}/api/private/images?startIndex=${lastEvaluatedId}`
      : `${getSiteUrl()}/api/private/images`;

    const paginationResponse = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await paginationResponse.json();

    return result;
  }
);

export const assignImageGroup = createAsyncThunk(
  "images/assignImageGroup",
  async ({ requestHeaders, imageIds, groupId, stoatId }) => {
    console.log(
      `Assigning all ${imageIds.length} images in Group ${groupId} to ${stoatId}`
    );

    const assignResponse = await fetch(
      `${getSiteUrl()}/api/private/images/assign`,
      {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          imageIds: imageIds,
          groupId: groupId,
          stoatId: `${stoatId}`,
        }),
      }
    );

    const result = await assignResponse.json();

    return { status: assignResponse.status, images: result };
  }
);

export const fetchImageById = createAsyncThunk(
  "images/fetchImageById",
  async ({ accessToken, imageId }) => {
    if (!imageId) {
      return;
    }
    console.log(`Fetching image with id ${imageId}`);
    const imageRes = await fetch(
      `${getSiteUrl()}/api/private/images/${imageId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const image = await imageRes.json();

    return image;
  }
);

export const assignImageToStoat = createAsyncThunk(
  "images/updateImage",
  async ({ accessToken, imageId, stoatId }) => {
    console.log(
      `Reassigning image with id ${imageId} to stoat with id ${stoatId}`
    );
    const assignmentRes = await fetch(
      `${getSiteUrl()}/api/private/images/${imageId}?stoatId=${stoatId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const image = await assignmentRes.json();

    return { responseStatus: assignmentRes.status, updatedImage: image };
  }
);

export const deleteImage = createAsyncThunk(
  "images/deleteImageById",
  async ({ headers, imageId }) => {
    console.log(`Deleting image with id ${imageId}`);

    const deleteRes = await fetch(
      `${getSiteUrl()}/api/private/images/${imageId}`,
      {
        method: "DELETE",
        headers: headers,
        credentials: "include",
      }
    );

    return { responseStatus: deleteRes.status, id: imageId };
  }
);

export const addImagesToDynamo = createAsyncThunk(
  "images/addImagesToDynamo",
  async ({ headers, imageArray }) => {
    console.log(`Adding images to DynamoDB...`);

    const dynamoResult = await fetch(`${getSiteUrl()}/api/private/images`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(imageArray),
    });

    const images = await dynamoResult.json();

    return images;
  }
);

export const imageStatuses = {
  assignmentSuccess: "assignment success",
  assignmentError: "assignment error",
  uploadSuccess: "upload success",
  uploadError: "upload error",
  singleLoading: "one image loading",
  singleFailure: "single failure",
  singleSuccess: "single success",
  groupAssignLoading: "assigning group loading",
  groupAssignSuccess: "assigning group successful",
  groupAssinFailure: "assigning group failure",
};

export const imageSlice = createSlice({
  name: "images",
  initialState: {
    value: [],
    lastEvaluatedId: null,
    moreToFetch: true,
    status: fetchStatuses.idle,
    singleStatus: fetchStatuses.idle,
    groupAssignStatus: fetchStatuses.idle,
    error: null,
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchImages.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchImages.fulfilled, (state, action) => {
        state.status = "succeeded";

        const { images, lastEvaluatedId } = action.payload;

        for (let i = 0; i < images.length; i++) {
          const newImage = images[i];

          const imageToReplaceIndex = state.value.findIndex(
            (i) => i.id == newImage.id
          );

          if (imageToReplaceIndex > -1) {
            state.value = [
              ...state.value.slice(0, imageToReplaceIndex),
              newImage,
              ...state.value.slice(imageToReplaceIndex + 1),
            ];
          } else {
            state.value.push(newImage);
          }
        }

        if (lastEvaluatedId) {
          state.moreToFetch = true;
          state.lastEvaluatedId = lastEvaluatedId;
        } else {
          state.moreToFetch = false;
          state.lastEvaluatedId = null;
        }
      })
      .addCase(fetchImages.rejected, (state, action) => {
        state.status = fetchStatuses.failed;
        state.error = action.error.message;
      })
      .addCase(deleteImage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        const { responseStatus, id } = action.payload;
        const imageToDeleteIndex = state.value.findIndex((i) => i.id == id);

        if (responseStatus === 204 && imageToDeleteIndex > -1) {
          state.value = [
            ...state.value.slice(0, imageToDeleteIndex),
            ...state.value.slice(imageToDeleteIndex + 1),
          ];
        }

        state.status = fetchStatuses.succeeded;
      })
      .addCase(deleteImage.rejected, (state, action) => {
        state.status = fetchStatuses.failed;
        state.error = action.error.message;
      })
      .addCase(assignImageToStoat.pending, (state) => {
        state.status = "loading";
      })
      .addCase(assignImageToStoat.fulfilled, (state, action) => {
        const { responseStatus, updatedImage } = action.payload;
        const imageToUpdateIndex = state.value.findIndex(
          (i) => i.id == updatedImage.id
        );

        if (responseStatus === 200 && imageToUpdateIndex > -1) {
          state.value = [
            ...state.value.slice(0, imageToUpdateIndex),
            updatedImage,
            ...state.value.slice(imageToUpdateIndex + 1),
          ];

          state.status = imageStatuses.assignmentSuccess;
        } else {
          state.status = imageStatuses.assignmentError;
        }
      })
      .addCase(assignImageToStoat.rejected, (state, action) => {
        state.status = imageStatuses.assignmentError;
        state.error = action.error.message;
      })
      .addCase(addImagesToDynamo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addImagesToDynamo.fulfilled, (state) => {
        state.status = imageStatuses.uploadSuccess;
      })
      .addCase(addImagesToDynamo.rejected, (state, action) => {
        state.status = imageStatuses.uploadError;
        state.error = action.error.message;
      })
      .addCase(fetchImageById.pending, (state) => {
        state.singleStatus = imageStatuses.singleLoading;
      })
      .addCase(fetchImageById.fulfilled, (state, action) => {
        if (action.payload.id) {
          const existingImageIndex = state.value.findIndex(
            (i) => i.id == action.payload.id
          );

          if (existingImageIndex > -1) {
            state.value = [
              ...state.value.slice(0, existingImageIndex),
              action.payload,
              ...state.value.slice(existingImageIndex + 1),
            ];
          } else {
            state.value.push(action.payload);
          }
        }

        state.singleStatus = imageStatuses.singleSuccess;
      })
      .addCase(fetchImageById.rejected, (state, action) => {
        state.singleStatus = imageStatuses.singleFailure;
        state.error = action.error.message;
      })
      .addCase(assignImageGroup.pending, (state) => {
        state.groupAssignStatus = imageStatuses.groupAssignLoading;
      })
      .addCase(assignImageGroup.fulfilled, (state, action) => {
        const { images: updatedImages } = action.payload;
        if (!updatedImages.length) {
          return;
        }

        for (let i = updatedImages.length - 1; i >= 0; i--) {
          const existingImageIndex = state.value.findIndex(
            (image) => image.id == updatedImages[i].id
          );

          if (existingImageIndex > -1) {
            state.value = [
              ...state.value.slice(0, existingImageIndex),
              updatedImages[i],
              ...state.value.slice(existingImageIndex + 1),
            ];
          }
        }

        state.groupAssignStatus = imageStatuses.groupAssignSuccess;
      })
      .addCase(assignImageGroup.rejected, (state, action) => {
        state.groupStatus = imageStatuses.groupAssinFailure;
        state.error = action.error.message;
      });
  },
});

export default imageSlice.reducer;

export const getAllImages = (state) => state.images.value;

export const getImageById = (state, imageId) =>
  state.images.value.find((i) => i.id == imageId);
