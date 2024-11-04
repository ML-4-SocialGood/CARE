/** @format */

import { createSlice } from "@reduxjs/toolkit";

export const bannerStatuses = {
  error: "error",
  success: "success",
};

export const bannerSlice = createSlice({
  name: "banner",
  initialState: {
    messages: [],
  },
  reducers: {
    add_message: (state, action) => {
      state.messages.push(action.payload);
    },
    remove_message: (state, action) => {
      const indexToRemove = state.messages.findIndex(
        (message) => message.message === action.payload
      );

      if (indexToRemove > -1) {
        state.messages = [
          ...state.messages.slice(0, indexToRemove),
          ...state.messages.slice(indexToRemove + 1),
        ];
      }
    },
  },
});

// Action creators are generated for each case reducer function
export const { add_message, remove_message } = bannerSlice.actions;

export default bannerSlice.reducer;
