/** @format */

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";
import imageReducer from "@renderer/features/image/imageSlice";
import stoatReducer from "@renderer/features/stoat/stoatSlice";
import uploadReducer from "@renderer/features/upload/uploadSlice";
import bannerReducer from "@renderer/features/banner/bannerSlice";

const persistConfig = {
  key: "root",
  storage: storageSession,
  blacklist: ["banner"],
};

const persistedReducer = persistReducer(
  persistConfig,
  combineReducers({
    images: imageReducer,
    stoats: stoatReducer,
    uploads: uploadReducer,
    banner: bannerReducer,
  })
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
