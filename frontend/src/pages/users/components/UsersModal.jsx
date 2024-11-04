/** @format */

import { useCallback } from "react";
import Modal from "../../../components/Modal";
import { modalStatuses } from "../constants";
import { Heading } from "../../../components/Heading";
import { Formik, Field, Form } from "formik";
import { Button } from "../../../components/Button";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { useAuth0 } from "@auth0/auth0-react";
import getSiteUrl from "../../../utils/getSiteUrl";
import apiClient from "../../../utils/apiClient";
import {
  add_message,
  bannerStatuses,
} from "../../../../features/banner/bannerSlice";

export default function UsersModal({
  getUsers,
  modalStatus,
  selectedUser,
  setModalStatus,
  setSelectedUser,
}) {
  const { getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();

  const handleCreateUser = useCallback(async () => {
    try {
      // Hit a public endpoint to retrieve the CSRF token
      await fetch(`${getSiteUrl()}/api/public/csrf`, {
        method: "GET",
        credentials: "include",
      });

      const email = document.getElementById("email");

      const value = email.value?.trim();

      if (value.length) {
        const accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: `https://projectcare/api`,
          },
        });

        const additionRes = await fetch(`${getSiteUrl()}/api/private/users`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({ email: value }),
        });

        if (additionRes.status === 201 || additionRes.status === 200) {
          setModalStatus(modalStatuses.successfulCreation);
          getUsers();
        } else {
          setModalStatus(modalStatuses.errorCreating);
        }
      }
    } catch (err) {
      console.error(err);
      setModalStatus(modalStatuses.errorCreating);
    }
  }, [getAccessTokenSilently, getUsers, setModalStatus]);

  const handleUpdateUser = async (values) => {
    try {
      const res = await apiClient(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: values.password || undefined,
          email: values.email,
          isAuth: values.isAuth === "1",
          isAdmin: values.isAdmin === "1",
        }),
      });
      const body = await res.json();

      if (res.status !== 200) {
        throw new Error(body.message);
      }

      selectedUser.email = values.email;
      selectedUser.isAuth = values.isAuth === "1";
      selectedUser.isAdmin = values.isAdmin === "1";
      dispatch(
        add_message({
          message: `${body.message}`,
          status: bannerStatuses.success,
        })
      );
      setModalStatus(modalStatuses.hidden);
    } catch (err) {
      console.error(err);
      dispatch(
        add_message({
          message: `Update failed: ${err}`, // 当注册不成功时，显示异常信息
          status: bannerStatuses.error,
        })
      );
    }
  };

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) {
      return;
    }

    try {
      const accessToken = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://projectcare/api`,
        },
      });

      const deletionRes = await fetch(
        `${getSiteUrl()}/api/private/users/${selectedUser.email}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (deletionRes.status === 204) {
        setModalStatus(modalStatuses.successfulDelete);
        getUsers();
      } else {
        setModalStatus(modalStatuses.errorDeleting);
      }
    } catch (err) {
      console.error(err);
      setModalStatus(modalStatuses.errorDeleting);
    }
  }, [getAccessTokenSilently, getUsers, selectedUser, setModalStatus]);

  const generateModalContent = useCallback(() => {
    if (modalStatus === modalStatuses.creatingUser) {
      return (
        <div>
          <Heading level={2}>ADD USER</Heading>
          <div className="modal-desc">
            Adding this email will give this user access to the platform and its
            images. <br />
            This access may be revoked at any time by an administrative user.
          </div>

          <input
            id="email"
            type="email"
            name="email"
            className="modal__input"
            placeholder="jane.doe@gmail.com"
            required
          />

          <Button onClick={handleCreateUser} variant="primary">
            Add user
          </Button>
        </div>
      );
    }

    if (modalStatus === modalStatuses.successfulCreation) {
      return (
        <div>
          <Heading level={2}>Creation successful</Heading>
          <div className="modal-desc">
            You may now close this modal. This user can now register and log in
            to access Project Care.
          </div>
        </div>
      );
    }

    if (modalStatus === modalStatuses.requestDelete) {
      return (
        <div>
          <Heading level={2}>Are you sure?</Heading>
          <div className="modal-desc">
            In order to undo this, the user will need to be added to the
            authorised users list.
          </div>
          <Button onClick={handleDeleteUser} variant="primary">
            I&apos;m sure, delete
          </Button>
        </div>
      );
    }

    if (modalStatus === modalStatuses.successfulDelete) {
      return (
        <div>
          <Heading level={2}>Deletion successful</Heading>
          <div className="modal-desc">
            You may now close this modal. This user will no longer have access
            to Project Care.
          </div>
        </div>
      );
    }

    if (modalStatus === modalStatuses.showingUser) {
      return (
        <Formik
          initialValues={{
            username: selectedUser.username,
            password: "",
            email: selectedUser.email,
            isAuth: selectedUser.isAuth ? "1" : "0",
            isAdmin: selectedUser.isAdmin ? "1" : "0",
          }}
          onSubmit={handleUpdateUser}
        >
          <Form className="user__form">
            <Heading level={2}>User info</Heading>
            <div className="user-info">
              <span className="label">Username: </span>
              <div className="input__box">
                <Field
                  className="form__input"
                  name="username"
                  type="string"
                  label="username"
                  required="required"
                  placeholder="Username"
                  disabled
                />
              </div>
            </div>

            <div className="user-info">
              <span className="label">Password: </span>
              <div className="input__box">
                <Field
                  className="form__input"
                  name="password"
                  type="password"
                  placeholder="Password, not update if empty"
                />
              </div>
            </div>

            <div className="user-info">
              <span className="label">Email: </span>
              <div className="input__box">
                <Field
                  className="form__input"
                  name="email"
                  type="email"
                  required="required"
                  placeholder="Email Address"
                />
              </div>
            </div>

            <div className="user-info radio-group">
              <span className="label">Activate this user: </span>
              <div role="group">
                <label>
                  <Field type="radio" name="isAuth" value="1" />
                  Yes
                </label>
                <label>
                  <Field type="radio" name="isAuth" value="0" />
                  No
                </label>
              </div>
            </div>

            <div className="user-info radio-group">
              <span className="label">Administrator privileges: </span>
              <div role="group">
                <label>
                  <Field type="radio" name="isAdmin" value="1" />
                  Yes
                </label>
                <label>
                  <Field type="radio" name="isAdmin" value="0" />
                  No
                </label>
              </div>
            </div>
            <div className="modal__user-actions">
              <Button variant="primary">Update user</Button>
              {/* <Button
                  onClick={() => {
                    setModalStatus(modalStatuses.requestDelete);
                  }}
                  variant="primary"
                >
                  Delete this user
                </Button> */}
            </div>
          </Form>
        </Formik>
      );
    }
  }, [
    modalStatus,
    selectedUser,
    handleCreateUser,
    handleDeleteUser,
    setModalStatus,
  ]);

  return (
    <Modal
      className="users-modal"
      onCloseClick={() => {
        setModalStatus(modalStatuses.hidden);
        setSelectedUser(null);
      }}
    >
      {generateModalContent()}
    </Modal>
  );
}

UsersModal.propTypes = {
  getUsers: PropTypes.func,
  modalStatus: PropTypes.oneOf(Object.values(modalStatuses)),
  selectedUser: PropTypes.object,
  setModalStatus: PropTypes.func,
  setSelectedUser: PropTypes.func,
};
