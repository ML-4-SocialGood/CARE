/** @format */
import { Heading } from "../../components/Heading";
import ImageUploader from "./components/ImageUploader";
import "./upload.css";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../hook/auth";
import { useContext } from "react";
export default function Upload() {
  const authContext = useContext(AuthContext);

  return authContext.isAuthenticated ? (
    <div className="upload-wrapper">
      <Heading level={1} className="upload-heading1">
        Image Uploader
      </Heading>
      <ImageUploader />
    </div>
  ) : (
    <Navigate to="/" replace={true} />
  );
}
