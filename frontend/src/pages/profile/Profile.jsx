/** @format */

import { useEffect, useState } from "react";
import User from "../../assets/user.png";
import "./profile.css";
import { Heading } from "../../components/Heading";
import { Button, SignOutButton } from "../../components/Button";
import { useDispatch } from "react-redux";
import {
  add_message,
  bannerStatuses,
} from "../../../features/banner/bannerSlice";
import Loader from "../../components/Loader";
import apiClient from "../../utils/apiClient";
import ProfileVideo from "../../assets/profile_video.mp4";

export default function Profile() {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState({});

  useEffect(() => {
    const getUserMetadata = async () => {
      try {
        const metadataResponse = await apiClient("/api/users/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const _user = await metadataResponse.json();
        setUser(_user);
        setIsLoading(false);
      } catch (e) {
        console.error(e.message);
        dispatch(
          add_message({
            message: `Something went wrong retrieving user information. Please contact a developer for further assistance.`,
            status: bannerStatuses.error,
          })
        );
      }
    };

    getUserMetadata();
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="profile-container">
      <div className="profile-overlay" />
     
      <div className="profile-content">
        <img
          src={user.picture || User}
          alt={user.name}
          className="profile-image"
        />
       <Heading level={2} className="artistic-font">{user.username}</Heading>
       <p>{user.email}</p >

        {user.isAdmin && (
          <Button isLink href="/users" className="profile-button action button-secondary">
            Manage users
          </Button>
        )}
        <Button isLink href="/profile/user" className="profile-button action button-secondary">
          Update profile
        </Button>
        <SignOutButton variant="primary" className="profile-button button-primary">
          Sign out
        </SignOutButton>
      </div>
    </div>
  );
}
