/** @format */

import { useEffect, useState } from "react";
import { Heading } from "../../components/Heading";
import "./users.css";
import UserAvatar from "./components/UserAvatar";
import Loader from "../../components/Loader";
import { createPortal } from "react-dom";
import UsersModal from "./components/UsersModal";
import { modalStatuses } from "./constants";
import { useDispatch } from "react-redux";
import {
  add_message,
  bannerStatuses,
} from "../../../features/banner/bannerSlice";
import apiClient from "../../utils/apiClient";

export default function Users() {
  const dispatch = useDispatch();

  const [isLoading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [modalStatus, setModalStatus] = useState(modalStatuses.hidden);

  const getUsers = async () => {
    try {
      const usersResponse = await apiClient("/api/admin/users?isAuth=all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!usersResponse.ok) {
        throw new Error("Failed to fetch users");
      }

      const usersJson = await usersResponse.json();

      setUsers([...usersJson]);
      setLoading(false);
    } catch (error) {
      console.error(error);
      dispatch(
        add_message({
          message: `Error fetching user info. Please contact a developer for further assistance.`,
          status: bannerStatuses.error,
        })
      );
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="user-index">
      <Heading level={1} className="user-index__heading">
        User index
      </Heading>
      <div className="users-grid">
        {users.map((u) => (
          <UserAvatar
            key={u.email}
            email={u.email}
            initial={
              u.name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()
            }
            onClick={() => {
              setSelectedUser(u);
              setModalStatus(modalStatuses.showingUser);
            }}
          />
        ))}
        {/* <div className="add-user-wrapper">
          <button
            className="add-user-button"
            aria-label="Add user"
            onClick={() => {
              setModalStatus(modalStatuses.creatingUser);
            }}
          />
        </div> */}
      </div>
      {modalStatus !== modalStatuses.hidden &&
        createPortal(
          <UsersModal
            getUsers={getUsers}
            modalStatus={modalStatus}
            setModalStatus={setModalStatus}
            setSelectedUser={setSelectedUser}
            selectedUser={selectedUser}
          />,
          document.body
        )}
    </div>
  );
}
