/** @format */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchStatuses } from "@renderer/features/upload/uploadSlice";
import { getSiteUrl } from "@renderer/utils/getSiteUrl";


export const fetchStoats = createAsyncThunk(
  "stoats/fetchStoats",
  async (accessToken) => {
    console.log("Fetching stoats...");
    const stoatsResponse = await fetch(`${getSiteUrl()}/api/private/stoats`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const stoatsJson = await stoatsResponse.json();

    const stoatsWithImageUrls = await Promise.all(
      stoatsJson.map(async (stoat) => {
        const newStoat = structuredClone(stoat);

        if (stoat.imageId) {
          try {
            const profileImageRes = await fetch(
              `${getSiteUrl()}/api/private/images/${stoat.imageId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (profileImageRes.status === 200) {
              const { presignedUrl } = await profileImageRes.json();

              newStoat["profileImg"] = presignedUrl;
            }
          } catch (err) {
            console.error(err);
          }
        }

        return newStoat;
      })
    );

    return stoatsWithImageUrls;
  }
);

export const fetchStoatById = createAsyncThunk(
  "stoats/fetchStoatById",
  async ({ accessToken, stoatId }) => {
    console.log(`Fetching stoat with id ${stoatId}...`);

    const stoatResponse = await fetch(
      `${getSiteUrl()}/api/private/stoats/${stoatId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const stoat = await stoatResponse.json();

    return stoat;
  }
);

export const addNewStoat = createAsyncThunk(
  "stoats/addNewStoat",
  // The payload creator receives the partial `{title, content, user}` object
  async ({ headers, name, sex, age, location, imageId }) => {
    const createStoatRes = await fetch(`${getSiteUrl()}/api/private/stoats`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        name: name,
        sex: sex,
        age: age,
        location: location,
        imageId: imageId,
      }),
    });

    const stoat = await createStoatRes.json();

    if (imageId) {
      const profileImageRes = await fetch(
        `${getSiteUrl()}/api/private/images/${stoat.imageId}`,
        {
          headers: headers,
        }
      );

      if (profileImageRes.status === 200) {
        const { presignedUrl } = await profileImageRes.json();

        stoat["profileImg"] = presignedUrl;
      }
    }

    return stoat;
  }
);

export const updateStoat = createAsyncThunk(
  "stoats/updateStoat",
  // The payload creator receives the partial `{title, content, user}` object
  async ({ stoatId, requestHeaders, requestBody }) => {
    console.log("updating stoat...");
    const res = await fetch(`${getSiteUrl()}/api/private/stoats/${stoatId}`, {
      method: "PATCH",
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    const updatedStoat = await res.json();

    return updatedStoat;
  }
);

export const stoatSlice = createSlice({
  name: "stoats",
  initialState: {
    value: [],
    status: fetchStatuses.idle,
    error: null,
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchStoats.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStoats.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Replace state with new fetched stoats
        state.value = action.payload;
      })
      .addCase(fetchStoats.rejected, (state, action) => {
        state.status = fetchStatuses.failed;
        state.error = action.error.message;
      })
      .addCase(fetchStoatById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStoatById.fulfilled, (state, action) => {
        const stoat = action.payload;
        const stoatToReplaceIndex = state.value.findIndex(
          (s) => s.id == stoat.id
        );

        if (stoatToReplaceIndex > -1) {
          state.value = [
            ...state.value.slice(0, stoatToReplaceIndex),
            stoat,
            ...state.value.slice(stoatToReplaceIndex + 1),
          ];
        } else {
          state.value.push(action.payload);
        }

        state.status = fetchStatuses.succeeded;
      })
      .addCase(fetchStoatById.rejected, (state, action) => {
        state.status = fetchStatuses.failed;
        state.error = action.error.message;
      })
      .addCase(addNewStoat.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addNewStoat.fulfilled, (state, action) => {
        state.status = "succeeded";

        if (action.payload.id) {
          // Add new stoat object to stoats array
          const stoat = action.payload;
          const stoatToReplaceIndex = state.value.findIndex(
            (s) => s.id == stoat.id
          );

          if (stoatToReplaceIndex > -1) {
            state.value = [
              ...state.value.slice(0, stoatToReplaceIndex),
              stoat,
              ...state.value.slice(stoatToReplaceIndex + 1),
            ];
          } else {
            state.value.push(action.payload);
          }
        }
      })
      .addCase(addNewStoat.rejected, (state, action) => {
        state.status = fetchStatuses.failed;
        state.error = action.error.message;
      })
      .addCase(updateStoat.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateStoat.fulfilled, (state, action) => {
        const stoat = action.payload;
        const stoatToReplaceIndex = state.value.findIndex(
          (s) => s.id == stoat.id
        );

        if (stoatToReplaceIndex > -1) {
          stoat.profileImg = state.value[stoatToReplaceIndex].profileImg;
          state.value = [
            ...state.value.slice(0, stoatToReplaceIndex),
            stoat,
            ...state.value.slice(stoatToReplaceIndex + 1),
          ];
        } else {
          state.value.push(action.payload);
        }

        state.status = "succeeded";
      })
      .addCase(updateStoat.rejected, (state, action) => {
        state.status = fetchStatuses.failed;
        state.error = action.error.message;
      });
  },
});

export default stoatSlice.reducer;

export const getAllStoats = (state) => state.stoats.value;

export const getStoatById = (state, stoatId) => {
  return state.stoats.value.find((s) => s.id == stoatId);
};
