/** @format */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Auth0Provider } from "@auth0/auth0-react";
import { Provider } from "react-redux";
import { store, persistor } from "../configureStore.js";
import { PersistGate } from "redux-persist/integration/react";
import AuthProvider from "./hook/auth.jsx";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* TO DO: Hide these and fetch from the backend */}
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        // If using in dev mode, change to http://localhost:5173
        redirect_uri: "http://localhost:5173",
        // redirect_uri: `https://projectcarewaiheke.com`,
        audience: "https://projectcare/api",
      }}
    >
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AuthProvider>
            <App />
          </AuthProvider>
    
        </PersistGate>
      </Provider>
    </Auth0Provider>
  </React.StrictMode>
);
